import "@testing-library/jest-dom/vitest";
import {vi} from "vitest";
import i18n from "./i18next.jsx";



vi.mock('./utils/pdf/pdfLoader.js', () => ({
    getDocument: vi.fn(() => ({
        promise: new Promise(() => {
        }), destroy: vi.fn()
    })),
}));

await i18n.changeLanguage('fr');
