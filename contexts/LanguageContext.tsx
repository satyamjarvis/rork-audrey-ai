import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform, Alert } from 'react-native';
import * as Updates from 'expo-updates';
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
const PENDING_RESTART_KEY = '@app_language_pending_restart';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRestart, setPendingRestart] = useState(false);
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
        
        // Clear any pending restart flag
        await AsyncStorage.removeItem(PENDING_RESTART_KEY);
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

  const restartApp = useCallback(async () => {
    console.log('[Language] Restarting app for language change...');
    
    if (Platform.OS === 'web') {
      // Web: Simple page reload
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      // Native: Use expo-updates if available, otherwise prompt user
      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.log('[Language] Updates.reloadAsync not available:', error);
        // Fallback: Show alert asking user to manually restart
        Alert.alert(
          'Restart Required',
          'Please restart the app for the language change to take full effect.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  }, []);

  const setLanguage = useCallback(async (lang: Language, shouldRestart = false) => {
    try {
      console.log('[Language] Setting language to:', lang, 'shouldRestart:', shouldRestart);
      
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
      
      // Trigger restart if requested
      if (shouldRestart) {
        setPendingRestart(true);
        await AsyncStorage.setItem(PENDING_RESTART_KEY, 'true');
        await restartApp();
      }
    } catch (error) {
      console.error('[Language] Error saving language:', error);
      setLanguageState(lang);
    }
  }, [restartApp]);

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

  const setLanguageWithRestart = useCallback(async (lang: Language) => {
    await setLanguage(lang, true);
  }, [setLanguage]);

  return useMemo(() => ({
    language,
    setLanguage,
    setLanguageWithRestart,
    restartApp,
    t,
    translations,
    translate,
    isLoading,
    isRTL: rtl,
    pendingRestart,
    getLanguageInfo,
    supportedLanguages,
  }), [language, setLanguage, setLanguageWithRestart, restartApp, t, translations, translate, isLoading, rtl, pendingRestart, getLanguageInfo]);
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
