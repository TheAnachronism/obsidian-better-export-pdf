import { register } from "node:module";
import { Window } from "happy-dom";

function installDom() {
  const window = new Window({ url: "https://obsidian.local/" });
  globalThis.window = window;
  globalThis.self = window;
  globalThis.document = window.document;

  for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(window))) {
    if (key in globalThis) continue;
    try {
      const value = window[key];
      if (typeof value === "function") {
        globalThis[key] = value.bind(window);
      }
    } catch {
      // happy-dom getters can throw for unimplemented browser APIs
    }
  }

  for (const key of Object.getOwnPropertyNames(window)) {
    if (key in globalThis) continue;
    try {
      globalThis[key] = window[key];
    } catch {
      // ignore non-copyable window properties
    }
  }
}

function patchObsidianDom() {
  const elementProto = globalThis.Element?.prototype;
  if (elementProto) {
    if (!elementProto.empty) {
      elementProto.empty = function empty() {
        this.innerHTML = "";
      };
    }
    if (!elementProto.addClass) {
      elementProto.addClass = function addClass(...cls) {
        this.classList.add(...cls);
      };
    }
    if (!elementProto.removeClass) {
      elementProto.removeClass = function removeClass(...cls) {
        this.classList.remove(...cls);
      };
    }
    if (!elementProto.createDiv) {
      elementProto.createDiv = function createDiv(cls) {
        const el = this.ownerDocument.createElement("div");
        if (cls) el.className = cls;
        this.appendChild(el);
        return el;
      };
    }
  }

  const documentProto = globalThis.Document?.prototype;
  if (documentProto && !documentProto.createDiv) {
    documentProto.createDiv = function createDiv(cls) {
      const el = this.createElement("div");
      if (cls) el.className = typeof cls === "string" ? cls : "";
      return el;
    };
  }
}

installDom();
patchObsidianDom();
globalThis.sleep = async () => {};
console.debug = () => {};

register(new URL("./loader.mjs", import.meta.url));
