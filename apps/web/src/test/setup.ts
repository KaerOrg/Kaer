import '@testing-library/jest-dom'
import i18n from '../i18n'

// jsdom default language is 'en'; force French so tests match the UI language.
void i18n.changeLanguage('fr')
