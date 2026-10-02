
export const printToPdfCalls = [];


export async function printToPdf(printEl, options) {
  printToPdfCalls.push({ el: printEl, options: { ...options } });
}


export function resetPrintToPdfCalls() {
  printToPdfCalls.length = 0;
}

export async function renderMarkdownV2() {
  throw new Error("renderMarkdownV2 is a render boundary and is not used by printDocs tests");
}

export function fixDocV2(doc) {
  return doc;
}

function unusedLegacyRender() {
  throw new Error("Legacy rendering is outside the v2 printDocs test seam");
}

export {
  unusedLegacyRender as fixDoc,
  unusedLegacyRender as getAllStyles,
  unusedLegacyRender as getPatchStyle,
  unusedLegacyRender as makeWebviewJs,
  unusedLegacyRender as renderMarkdown,
};
