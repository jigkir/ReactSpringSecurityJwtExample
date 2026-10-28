import '@testing-library/jest-dom/vitest';
import {vi} from 'vitest';
import i18n from './i18next.jsx';

// pdf.js needs browser APIs that jsdom does not have
// A pending load keeps CvPreview in its loading state
vi.mock('./utils/pdf/pdfLoader.js', () => ({
    getDocument: vi.fn(() => ({
        promise: new Promise(() => {
        }), destroy: vi.fn()
    })),
}));

await i18n.changeLanguage('fr');