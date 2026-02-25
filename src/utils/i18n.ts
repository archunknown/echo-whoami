export type SupportedLanguage = 'en' | 'es';

export function t(field: any, lang: SupportedLanguage): string {
    if (!field || typeof field !== 'object') {
        return '';
    }

    // Return the strict requested language, then fallback to english, then an empty string
    return field[lang] || field['en'] || '';
}
