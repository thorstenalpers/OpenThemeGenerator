import { de } from './de';
import { en, type Translations } from './en';

export const LOCALES = [
	{ id: 'en', label: 'English' },
	{ id: 'de', label: 'Deutsch' }
] as const;

export type Locale = (typeof LOCALES)[number]['id'];

const DICTIONARIES: Record<Locale, Translations> = { en, de };

export function isLocale(value: string): value is Locale {
	return value in DICTIONARIES;
}

/** The interface language. Token names are part of the output and stay as they are. */
class I18n {
	locale = $state<Locale>('en');

	get t(): Translations {
		return DICTIONARIES[this.locale];
	}
}

export const i18n = new I18n();
