import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'fr', name: t('french') },
    { code: 'en', name: t('english') },
    { code: 'es', name: t('spanish') },
    { code: 'it', name: t('italian') },
    { code: 'pt', name: t('portuguese') },
    { code: 'de', name: t('swiss') }
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-selector">
      <select
        onChange={(e) => changeLanguage(e.target.value)}
        value={i18n.language}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector; 