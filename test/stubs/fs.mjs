import { createRequire } from "node:module";

const real = createRequire(import.meta.url)("fs");

export const promises = {
  ...real.promises,
  async readFile() {
    return Buffer.from("");
  },
  async writeFile() {},
};

export const existsSync = real.existsSync;
export const readFileSync = real.readFileSync;
export const writeFileSync = real.writeFileSync;
export const statSync = real.statSync;
export const readdirSync = real.readdirSync;

export default { ...real, promises };
