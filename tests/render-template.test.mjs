import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const { outputFiles } = await build({
  stdin: {
    contents: 'export { renderTemplate } from "./src/utils/index.ts";',
    resolveDir: fileURLToPath(new URL("..", import.meta.url)),
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  write: false,
  plugins: [{
    name: "exclude-unused-obsidian-imports",
    setup(build) {
      build.onResolve({ filter: /^obsidian$/ }, () => ({
        path: "obsidian",
        external: true,
        sideEffects: false,
      }));
    },
  }],
});
const { renderTemplate } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

test("missing note properties render empty in header/footer HTML", () => {
  assert.equal(renderTemplate('<span>{{ author }}</span>', {}), '<span></span>');
  assert.equal(
    renderTemplate('<span>{{author}} / {{missing}} / {{author}}</span>', { author: "Ada" }),
    '<span>Ada /  / Ada</span>',
  );
});

test("nullish properties render empty without discarding present values", () => {
  assert.equal(
    renderTemplate("{{missing}}|{{null}}|{{empty}}|{{zero}}|{{false}}|{{text}}", {
      missing: undefined,
      null: null,
      empty: "",
      zero: 0,
      false: false,
      text: "Ada",
    }),
    "|||0|false|Ada",
  );
});
test("frontmatter wikilinks render as their visible text", () => {
  assert.equal(
    renderTemplate("{{author}}", { author: "author: [[Name]], [[second-person]]" }),
    "author: Name, second-person",
  );
});
test("frontmatter lists use comma-space separators", () => {
  assert.equal(
    renderTemplate("{{links}}|{{names}}", {
      links: ["[[asdf]]", "[[asdfasdf]]"],
      names: ["Ada", "Grace"],
    }),
    "asdf, asdfasdf|Ada, Grace",
  );
});
test("frontmatter property values retain coercion while normalizing links", () => {
  assert.equal(
    renderTemplate("{{alias}}|{{tags}}|{{brackets}}|{{malformed}}", {
      alias: "[[internal-name|Display name]]",
      tags: ["[[first]]", "[[second|Second name]]"],
      brackets: "[text] and [[complete]]",
      malformed: "[[unfinished",
    }),
    "Display name|first, Second name|[text] and complete|[[unfinished",
  );
});
