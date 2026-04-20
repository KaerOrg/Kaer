const useMock = (k: string) => k

export const useTranslation = () => ({
  t: useMock,
  i18n: { changeLanguage: jest.fn(), language: 'fr' },
})

export const initReactI18next = {
  type: '3rdParty' as const,
  init: () => {},
}

export const Trans = ({ children }: { children: React.ReactNode }) => children
