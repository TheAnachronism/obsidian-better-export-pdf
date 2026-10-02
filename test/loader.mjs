import { readFileSync, statSync } from "node:fs";
import { isBuiltin } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformSync } from "esbuild";
import { compile } from "svelte/compiler";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const srcRender = path.join(testDir, "..", "src", "render.ts");

const stubs = new Map([
  ["obsidian", path.join(testDir, "stubs", "obsidian.mjs")],
  ["electron", path.join(testDir, "stubs", "electron.mjs")],
  ["fs", path.join(testDir, "stubs", "fs.mjs")],
  ["node:fs", path.join(testDir, "stubs", "fs.mjs")],
]);

function isFile(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveSourceFile(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.svelte`,
    path.join(base, "index.ts"),
    path.join(base, "index.js"),
    path.join(base, "index.mjs"),
  ];
  return candidates.find((candidate) => isFile(candidate));
}

function isSrcRender(filePath) {
  return path.resolve(filePath) === path.resolve(srcRender);
}

function rewriteCjsRequire(code) {
  const fsStub = pathToFileURL(path.join(testDir, "stubs", "fs.mjs")).href;
  const withFs = code.replace(/\brequire\s*\(\s*["']fs["']\s*\)/g, "__fs");
  const needsFs = withFs !== code;
  const needsRequire = /\brequire\s*\(/.test(withFs);
  const header = [
    needsFs ? `import __fs from ${JSON.stringify(fsStub)};` : "",
    needsRequire
      ? `import { createRequire as __createRequire } from "node:module";\nconst require = __createRequire(import.meta.url);`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  return header ? `${header}\n${withFs}` : withFs;
}

export async function resolve(specifier, context, nextResolve) {
  const stub = stubs.get(specifier);
  if (stub) {
    return { url: pathToFileURL(stub).href, shortCircuit: true, format: "module" };
  }

  if (isBuiltin(specifier) || specifier.startsWith("node:")) {
    return nextResolve(specifier, context);
  }

  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    const parent = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
    const found = resolveSourceFile(path.resolve(path.dirname(parent), specifier));
    if (found) {
      if (isSrcRender(found)) {
        return {
          url: pathToFileURL(path.join(testDir, "stubs", "render.mjs")).href,
          shortCircuit: true,
          format: "module",
        };
      }
      const format = found.endsWith(".ts") || found.endsWith(".svelte") || found.endsWith(".mjs") ? "module" : undefined;
      return { url: pathToFileURL(found).href, shortCircuit: true, ...(format ? { format } : {}) };
    }
  }

  const resolved = await nextResolve(specifier, context);
  if (resolved.url.startsWith("file:")) {
    const filePath = fileURLToPath(resolved.url);
    if (isSrcRender(filePath)) {
      return {
        url: pathToFileURL(path.join(testDir, "stubs", "render.mjs")).href,
        shortCircuit: true,
        format: "module",
      };
    }
  }
  return resolved;
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:")) {
    return nextLoad(url, context);
  }

  const filePath = fileURLToPath(url);
  if (filePath.endsWith(".svelte")) {
    const source = readFileSync(filePath, "utf8");
    const compiled = compile(source, {
      filename: filePath,
      generate: "client",
      css: "injected",
      dev: true,
    });
    const transformed = transformSync(compiled.js.code, {
      loader: "js",
      format: "esm",
      target: "es2022",
      sourcefile: filePath,
    });
    return { format: "module", source: rewriteCjsRequire(transformed.code), shortCircuit: true };
  }

  if (filePath.endsWith(".ts")) {
    const source = readFileSync(filePath, "utf8");
    const transformed = transformSync(source, {
      loader: "ts",
      format: "esm",
      target: "es2022",
      sourcefile: filePath,
    });
    return { format: "module", source: rewriteCjsRequire(transformed.code), shortCircuit: true };
  }

  return nextLoad(url, context);
}
