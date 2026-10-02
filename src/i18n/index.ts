import merge from "deepmerge";
import en from "./en";
import zh from "./zh";

export type Lang = typeof en;

const locales = { en, zh };

export default {
  i18n: locales,
  get current() {
    const lang = window.localStorage.getItem("language") ?? "en";
    const overlay = lang === "en" || lang === "zh" ? this.i18n[lang] : {};
    return merge(this.i18n.en, overlay) as Lang;
  },
};
