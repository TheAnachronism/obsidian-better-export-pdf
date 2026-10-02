import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { mount, tick, unmount } from "svelte";
import PdfPreviewV2 from "../src/components/PdfPreviewV2.svelte";
import { ExportConfigModal } from "../src/modal";
import { printToPdfCalls, resetPrintToPdfCalls } from "./stubs/render.mjs";

const HEADER_TEMPLATE = '<div class="hdr">{{author}}</div>';
const FOOTER_TEMPLATE = '<div class="ftr">{{title}}</div>';

let mounted;

function pluginSettings() {
  return {
    displayHeader: true,
    displayFooter: true,
    headerTemplate: HEADER_TEMPLATE,
    footerTemplate: FOOTER_TEMPLATE,
    printBackground: false,
    generateTaggedPDF: false,
    displayMetadata: false,
    showTitle: true,
    maxLevel: "6",
    scale: 100,
    concurrency: "5",
    isTimestamp: false,
    debug: false,
    enabledCss: false,
    version: "2",
  };
}

function exportConfig() {
  return {
    pageSize: "A4",
    marginType: "1",
    displayHeader: true,
    displayFooter: true,
    showTitle: true,
    landscape: false,
    scale: 100,
    open: false,
  };
}

function makeFile(basename) {
  return { basename, name: `${basename}.md`, path: `${basename}.md`, extension: "md" };
}

function makeDoc({ basename, frontMatter }) {
  const doc = document.createElement("div");
  const heading = document.createElement("h1");
  heading.textContent = basename;
  doc.appendChild(heading);
  return { doc, file: makeFile(basename), frontMatter };
}

async function mountPreview() {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(PdfPreviewV2, {
    target,
    props: {
      modal: {
        app: {},
        file: makeFile("preview"),
        multiplePdf: false,
        async getAllFilesV2() {
          return { data: [] };
        },
      },
      plugin: { settings: pluginSettings() },
      config: exportConfig(),
    },
  });
  await tick();
  mounted = { app, target };
  return mounted;
}

afterEach(() => {
  resetPrintToPdfCalls();
  if (!mounted) return;
  unmount(mounted.app);
  mounted.target.remove();
  mounted = undefined;
});

test("printDocs resolves {{author}} and {{title}} in a single note header and footer", async () => {
  const { app } = await mountPreview();
  const docs = [
    makeDoc({
      basename: "note",
      frontMatter: { author: "Hein Gromek", title: "Export Title" },
    }),
  ];

  await app.printDocs({ docs, outfiles: ["/tmp/note.pdf"], onlyPreview: true });

  assert.equal(printToPdfCalls.length, 1);
  assert.equal(printToPdfCalls[0].options.headerTemplate, '<div class="hdr">Hein Gromek</div>');
  assert.equal(printToPdfCalls[0].options.footerTemplate, '<div class="ftr">Export Title</div>');
});

test("printDocs uses each note's own frontmatter and template overrides for separate exports", async () => {
  const { app } = await mountPreview();
  const docs = [
    makeDoc({
      basename: "engine",
      frontMatter: {
        author: "Ada Lovelace",
        title: "Analytical Engine",
        headerTemplate: "<header>{{author}}</header>",
        footerTemplate: "<footer>{{title}}</footer>",
      },
    }),
    makeDoc({
      basename: "computable",
      frontMatter: {
        author: "Alan Turing",
        title: "Computable Numbers",
        headerTemplate: "<p>{{author}}</p>",
        footerTemplate: "<small>{{title}}</small>",
      },
    }),
  ];

  await app.printDocs({
    docs,
    outfiles: ["/tmp/engine.pdf", "/tmp/computable.pdf"],
    onlyPreview: true,
  });

  assert.equal(printToPdfCalls.length, 2);
  assert.equal(printToPdfCalls[0].options.filepath, "/tmp/engine.pdf");
  assert.equal(printToPdfCalls[0].options.headerTemplate, "<header>Ada Lovelace</header>");
  assert.equal(printToPdfCalls[0].options.footerTemplate, "<footer>Analytical Engine</footer>");
  assert.equal(printToPdfCalls[1].options.filepath, "/tmp/computable.pdf");
  assert.equal(printToPdfCalls[1].options.headerTemplate, "<p>Alan Turing</p>");
  assert.equal(printToPdfCalls[1].options.footerTemplate, "<small>Computable Numbers</small>");
});

test("printDocs uses the first document frontmatter for a merged export", async () => {
  const { app } = await mountPreview();
  const first = makeDoc({
    basename: "engine",
    frontMatter: { author: "Ada Lovelace", title: "Analytical Engine" },
  });
  const second = makeDoc({
    basename: "computable",
    frontMatter: { author: "Alan Turing", title: "Computable Numbers" },
  });
  for (const { doc } of [first, second]) {
    const view = document.createElement("div");
    view.className = "markdown-preview-view";
    view.append(...doc.childNodes);
    doc.appendChild(view);
    document.body.appendChild(doc);
  }
  const docs = ExportConfigModal.prototype.mergeDocV2([first, second]);

  await app.printDocs({ docs, outfiles: ["/tmp/merged.pdf"], onlyPreview: true });
  assert.ok(printToPdfCalls[0].el.textContent.includes("engine"));
  assert.ok(printToPdfCalls[0].el.textContent.includes("computable"));
  docs[0].doc.remove();

  assert.equal(printToPdfCalls.length, 1);
  assert.equal(printToPdfCalls[0].options.headerTemplate, '<div class="hdr">Ada Lovelace</div>');
  assert.equal(printToPdfCalls[0].options.footerTemplate, '<div class="ftr">Analytical Engine</div>');
  assert.equal(printToPdfCalls[0].options.headerTemplate.includes("Alan Turing"), false);
  assert.equal(printToPdfCalls[0].options.footerTemplate.includes("Computable Numbers"), false);
});

