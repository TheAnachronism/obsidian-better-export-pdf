export class Notice {
  constructor(_message) {}
}

export class TFile {}

export class TFolder {}

export class Plugin {}

export class Modal {}

export class App {}

export class Setting {
  constructor(containerEl) {
    this.settingEl = containerEl ?? { classList: { add() {} }, firstChild: null, remove() {} };
    this.controlEl = this.settingEl;
  }
  setName() {
    return this;
  }
  setDesc() {
    return this;
  }
  setHeading() {
    return this;
  }
  addToggle() {
    return this;
  }
  addDropdown() {
    return this;
  }
  addSlider() {
    return this;
  }
  addButton() {
    return this;
  }
  addText() {
    return this;
  }
}

export function setIcon(_node, _id) {}

export function debounce(fn) {
  return fn;
}

export async function loadPdfJs() {
  return {
    getDocument() {
      return {
        promise: Promise.resolve({
          numPages: 0,
          async getPage() {
            return {};
          },
        }),
      };
    },
  };
}

export default {
  Notice,
  TFile,
  TFolder,
  Plugin,
  Modal,
  App,
  Setting,
  setIcon,
  debounce,
  loadPdfJs,
};
