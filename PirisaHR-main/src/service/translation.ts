export const translateText = async (text: string, targetLang: string): Promise<string> => {
    // Skip translation for English
    if (targetLang === "en") {
      return text;
    }
  
    try {
      // Try to get from localStorage first
      const cacheKey = `translation_${text}_${targetLang}`;
      const cachedTranslation = localStorage.getItem(cacheKey);
      
      if (cachedTranslation) {
        return cachedTranslation;
      }
  
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURI(text)}`
      );
      const data = await response.json();
      const translation = data[0][0][0];
  
      // Cache the result
      localStorage.setItem(cacheKey, translation);
  
      return translation;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };