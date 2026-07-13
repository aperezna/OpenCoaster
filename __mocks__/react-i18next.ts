// Manual mock for react-i18next
// In tests, t(key) returns the key itself so we can verify correct keys are used.
// Components that use useTranslation will get these defaults unless overridden.

const mockT = (key: string): string => key;

const mockI18n = {
  language: 'en',
  changeLanguage: jest.fn().mockResolvedValue(undefined),
  isInitialized: true,
  t: mockT,
};

export function useTranslation() {
  return {
    t: mockT,
    i18n: mockI18n,
    ready: true,
  };
}

export const I18nextProvider = ({ children }: { children: React.ReactNode }) => children;

export const initReactI18next = {
  type: '3rdParty' as const,
  init: jest.fn(),
};
