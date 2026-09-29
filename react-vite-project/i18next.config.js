import { defineConfig } from 'i18next-cli';

export default defineConfig({
    locales: ['fr', 'en'],
    extract: {
        input: ['src/**/*.{js,jsx}'],
        output: 'src/translation/{{language}}/{{namespace}}.json',
        primaryLanguage: 'en',
        removeUnusedKeys: false,
    },
    lint: {
        ignoredAttributes: ['className', 'type', 'name', 'id', 'href', 'to', 'target', 'rel', 'autoComplete'],
    },
});