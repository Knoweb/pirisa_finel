import { useEffect, useState } from "react";
import { useTranslation } from "../../context/LanguageProvider";
import { translateText } from "../../service/translation";

// Define the type for translations object
type Translations = Record<string, string>;

interface TranslatableTextProps {
  text: string;
}

interface TranslatableOptionProps {
  text: string;
}

interface TranslationContextType {
  language: string;
  translations: Translations;
  setTranslations: React.Dispatch<React.SetStateAction<Translations>>;
}

export const TranslatableText = ({ text }: TranslatableTextProps) => {
  const { language, translations, setTranslations } =
    useTranslation() as TranslationContextType;
  const [loading, setLoading] = useState(false);
  const cacheKey = `${text}_${language}`;

  useEffect(() => {
    const translateAndCache = async () => {
      if (language === "en") {
        return text;
      }

      // Check if translation exists in cache
      if (translations[cacheKey]) {
        return translations[cacheKey];
      }

      setLoading(true);
      try {
        const translated = await translateText(text, language);
        setTranslations((prev: Translations) => ({
          ...prev,
          [cacheKey]: translated,
        }));
      } catch (error) {
        console.error("Translation failed:", error);
      } finally {
        setLoading(false);
      }
    };

    translateAndCache();
  }, [text, language, cacheKey, translations, setTranslations]);

  if (loading) {
    return <span className="text-gray-400">Loading...</span>;
  }

  return (
    <span>{language === "en" ? text : translations[cacheKey] || text}</span>
  );
};

// New component for use in option elements - returns plain text
export const TranslatableOption = ({ text }: TranslatableOptionProps) => {
  const { language, translations, setTranslations } =
    useTranslation() as TranslationContextType;
  const [loading, setLoading] = useState(false);
  const cacheKey = `${text}_${language}`;

  useEffect(() => {
    const translateAndCache = async () => {
      if (language === "en") {
        return text;
      }

      // Check if translation exists in cache
      if (translations[cacheKey]) {
        return translations[cacheKey];
      }

      setLoading(true);
      try {
        const translated = await translateText(text, language);
        setTranslations((prev: Translations) => ({
          ...prev,
          [cacheKey]: translated,
        }));
      } catch (error) {
        console.error("Translation failed:", error);
      } finally {
        setLoading(false);
      }
    };

    translateAndCache();
  }, [text, language, cacheKey, translations, setTranslations]);

  if (loading) {
    return "Loading...";
  }

  return language === "en" ? text : translations[cacheKey] || text;
};
