import React from 'react';
import { useTranslation } from '../../context/LanguageProvider';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="p-2 border rounded"
    >
      <option value="en">English</option>
      <option value="si">සිංහල</option>
    </select>
  );
};
