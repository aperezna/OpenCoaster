import i18next from 'i18next';
import { initI18n } from '../config';

// ---------------------------------------------------------------------------
// i18next configuration
// ---------------------------------------------------------------------------

describe('i18next config', () => {
  beforeAll(async () => {
    await initI18n();
  });

  it('should initialize with en as the default language', () => {
    expect(i18next.isInitialized).toBe(true);
    expect(i18next.language).toBe('en');
  });

  it('should have en and es resources loaded', () => {
    const hasEn = i18next.getResourceBundle('en', 'translation');
    const hasEs = i18next.getResourceBundle('es', 'translation');
    expect(hasEn).toBeDefined();
    expect(hasEs).toBeDefined();
    expect(typeof hasEn).toBe('object');
    expect(typeof hasEs).toBe('object');
  });

  it('should translate known English keys correctly', () => {
    expect(i18next.t('common.loading')).toBe('Loading...');
    expect(i18next.t('nav.map')).toBe('Map');
    expect(i18next.t('profile.language')).toBe('Language');
  });

  it('should translate known Spanish keys correctly', async () => {
    await i18next.changeLanguage('es');
    expect(i18next.t('common.loading')).toBe('Cargando...');
    expect(i18next.t('nav.map')).toBe('Mapa');
    expect(i18next.t('profile.language')).toBe('Idioma');
  });

  it('should fall back to English for missing keys when language is es', async () => {
    await i18next.changeLanguage('es');
    // A key that exists in languages config check
    // i18next returns the key as last fallback
    expect(i18next.t('common.searchPlaceholder')).toBe('Buscar parques...');
  });

  afterAll(async () => {
    await i18next.changeLanguage('en');
  });
});
