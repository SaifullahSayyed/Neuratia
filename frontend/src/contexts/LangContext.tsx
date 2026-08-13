import React, { createContext, useContext, useEffect, useState } from "react";
import { en, type TranslationKeys } from "../i18n/en";
import { hi } from "../i18n/hi";
import { ur } from "../i18n/ur";

export type Lang = "en" | "hi" | "ur";

const translations: Record<Lang, Record<TranslationKeys, string>> = { en, hi, ur };

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKeys) => string;
  isRTL: boolean;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => en[k],
  isRTL: false,
});

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("neuratia_lang") as Lang) || "en";
  });

  const isRTL = lang === "ur";

  const setLang = (l: Lang) => {
    localStorage.setItem("neuratia_lang", l);
    setLangState(l);
  };

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [lang, isRTL]);

  const t = (key: TranslationKeys): string => translations[lang][key] ?? en[key];

  return <LangContext.Provider value={{ lang, setLang, t, isRTL }}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);
