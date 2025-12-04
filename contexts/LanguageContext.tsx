import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import {
  Language,
  getDeviceLanguage,
  getTranslations,
  isRTL,
  createLegacyTranslations,
  languageInfo,
  supportedLanguages,
} from '@/utils/i18n';

export { Language } from '@/utils/i18n';

const STORAGE_KEY = '@app_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    
    const loadLanguage = async () => {
      try {
        console.log('[Language] Loading saved language preference...');
        
        // Always prioritize user's saved language over device language
        const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
        
        if (storedLanguage && supportedLanguages.includes(storedLanguage as Language)) {
          console.log('[Language] Found saved language (overriding device locale):', storedLanguage);
          setLanguageState(storedLanguage as Language);
          
          // Apply RTL settings on load
          const rtl = isRTL(storedLanguage as Language);
          if (I18nManager.isRTL !== rtl) {
            I18nManager.allowRTL(rtl);
            I18nManager.forceRTL(rtl);
          }
        } else {
          // Only use device language if no preference is saved
          const deviceLang = getDeviceLanguage();
          console.log('[Language] No saved preference, using device language:', deviceLang);
          setLanguageState(deviceLang);
        }
      } catch (error) {
        console.error('[Language] Error loading language:', error);
        const deviceLang = getDeviceLanguage();
        setLanguageState(deviceLang);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      console.log('[Language] Setting language to:', lang);
      
      // Save language preference immediately
      await AsyncStorage.setItem(STORAGE_KEY, lang);
      setLanguageState(lang);
      
      // Handle RTL changes
      const rtl = isRTL(lang);
      const needsRTLChange = I18nManager.isRTL !== rtl;
      
      if (needsRTLChange) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
        console.log('[Language] RTL mode set to:', rtl);
      }
    } catch (error) {
      console.error('[Language] Error saving language:', error);
      setLanguageState(lang);
    }
  }, []);

  const translations = useMemo(() => getTranslations(language), [language]);
  
  const t = useMemo(() => createLegacyTranslations(translations), [translations]);

  const rtl = useMemo(() => isRTL(language), [language]);

  const getLanguageInfo = useCallback((lang: Language) => {
    return languageInfo[lang];
  }, []);

  const translate = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, [translations]);

  return useMemo(() => ({
    language,
    setLanguage,
    t,
    translations,
    translate,
    isLoading,
    isRTL: rtl,
    getLanguageInfo,
    supportedLanguages,
  }), [language, setLanguage, t, translations, translate, isLoading, rtl, getLanguageInfo]);
});

export function useTranslation() {
  const { translate, translations, language, isRTL } = useLanguage();
  
  return {
    t: translate,
    translations,
    language,
    isRTL,
  };
}
