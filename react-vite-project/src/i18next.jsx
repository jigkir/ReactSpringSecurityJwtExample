import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./translation/fr/translation.json";
import en from "./translation/en/translation.json";

i18n


    .use(LanguageDetector)

    .use(initReactI18next)


    .init({
        resources: {fr: {translation: fr}, en: {translation: en}},
        fallbackLng: 'fr',
        supportedLngs: ['fr', 'en'],
        detection: {order: ['localStorage'], caches: ['localStorage']},
        interpolation: {escapeValue: false},
        react: {bindI18n: 'languageChanged'},
    });

const syncHtmlLang = (lng) => {
    document.documentElement.lang = (lng || 'fr').split('-')[0];
};
syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
