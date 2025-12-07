import * as Localization from 'expo-localization';
import { Platform } from 'react-native';

import en from '@/locales/en.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import ar from '@/locales/ar.json';
import zh from '@/locales/zh.json';
import pt from '@/locales/pt.json';

export type Language = 'en' | 'es' | 'fr' | 'ar' | 'zh' | 'pt' | 'ja' | 'he' | 'ro' | 'ru' | 'hi' | 'it';

export type TranslationFile = typeof en;

const translations: Record<string, TranslationFile> = {
  en,
  es: es as unknown as TranslationFile,
  fr: fr as unknown as TranslationFile,
  ar: ar as unknown as TranslationFile,
  zh: zh as unknown as TranslationFile,
  pt: pt as unknown as TranslationFile,
  ja: en,
  he: en,
  ro: en,
  ru: en,
  hi: en,
  it: en,
};

export const supportedLanguages: Language[] = ['en', 'es', 'fr', 'ar', 'zh', 'pt', 'ja', 'he', 'ro', 'ru', 'hi', 'it'];

export const languageInfo: Record<Language, { name: string; nativeName: string; flag: string; rtl: boolean }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
  he: { name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
  ro: { name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', rtl: false },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
  hi: { name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', rtl: false },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
};

export function getDeviceLanguage(): Language {
  try {
    let locale = 'en';
    
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined') {
        locale = navigator.language || 'en';
      }
    } else {
      const locales = Localization.getLocales();
      if (locales && locales.length > 0) {
        locale = locales[0].languageCode || 'en';
      }
    }
    
    const langCode = locale.toLowerCase().substring(0, 2);
    
    if (supportedLanguages.includes(langCode as Language)) {
      return langCode as Language;
    }
    
    return 'en';
  } catch (error) {
    console.log('[i18n] Error getting device language:', error);
    return 'en';
  }
}

export function getTranslations(language: Language): TranslationFile {
  return translations[language] || translations.en;
}

export function isRTL(language: Language): boolean {
  return languageInfo[language]?.rtl || false;
}

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<TranslationFile>;

export function translate(translations: TranslationFile, key: string): string {
  const keys = key.split('.');
  let value: unknown = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      console.warn(`[i18n] Translation key not found: ${key}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

export function createFlatTranslations(translations: TranslationFile) {
  const flat: Record<string, string> = {};
  
  function flatten(obj: Record<string, unknown>, prefix = '') {
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        flatten(value as Record<string, unknown>, newKey);
      } else if (typeof value === 'string') {
        flat[newKey] = value;
      }
    }
  }
  
  flatten(translations as unknown as Record<string, unknown>);
  return flat;
}

export function createLegacyTranslations(translations: TranslationFile) {
  return {
    calendar: translations.navigation.calendar,
    track: translations.navigation.track,
    learn: translations.navigation.learn,
    settings: translations.navigation.settings,
    morning: translations.navigation.morning,
    night: translations.navigation.night,
    phonebook: translations.navigation.phonebook,
    chats: translations.navigation.chats,
    planner: translations.navigation.planner,
    ai: translations.navigation.ai,
    universe: translations.navigation.universe,
    analytics: translations.navigation.analytics,
    tools: translations.navigation.tools,
    
    pickYourMode: translations.modeSelection.pickYourMode,
    universeModeTitle: translations.modeSelection.universeModeTitle,
    classicModeTitle: translations.modeSelection.classicModeTitle,
    selected: translations.modeSelection.selected,
    switchModesAnytime: translations.modeSelection.switchModesAnytime,
    
    chooseYourStyle: translations.themeSelection.chooseYourStyle,
    brightMode: translations.themeSelection.brightMode,
    nightModeTitle: translations.themeSelection.nightModeTitle,
    changeThemeAnytime: translations.themeSelection.changeThemeAnytime,
    
    thisMonth: translations.calendar.thisMonth,
    events: translations.calendar.events,
    high: translations.calendar.high,
    medium: translations.calendar.medium,
    low: translations.calendar.low,
    noEventsForThisDay: translations.calendar.noEventsForThisDay,
    tapThePlusButtonToAddOne: translations.calendar.tapThePlusButtonToAddOne,
    addEvent: translations.calendar.addEvent,
    editEvent: translations.calendar.editEvent,
    eventTitle: translations.calendar.eventTitle,
    category: translations.calendar.category,
    priority: translations.calendar.priority,
    time: translations.calendar.time,
    description: translations.calendar.description,
    work: translations.calendar.work,
    personal: translations.calendar.personal,
    health: translations.calendar.health,
    social: translations.calendar.social,
    other: translations.calendar.other,
    updateEvent: translations.calendar.updateEvent,
    deleteEvent: translations.calendar.deleteEvent,
    areYouSureDeleteEvent: translations.calendar.areYouSureDeleteEvent,
    addNotes: translations.calendar.addNotes,
    
    selectLanguage: translations.language.selectLanguage,
    chooseYourPreferredLanguage: translations.language.chooseYourPreferredLanguage,
    
    trackProgress: translations.track.trackProgress,
    yourFinancialJourney: translations.track.yourFinancialJourney,
    financialOverview: translations.track.financialOverview,
    income: translations.track.income,
    expenses: translations.track.expenses,
    savings: translations.track.savings,
    netWorth: translations.track.netWorth,
    addTransaction: translations.track.addTransaction,
    wealthManifesting: translations.track.wealthManifesting,
    todaysManifestations: translations.track.todaysManifestations,
    noManifestationsYet: translations.track.noManifestationsYet,
    addManifestation: translations.track.addManifestation,
    wealthGoals: translations.track.wealthGoals,
    noWealthGoalsYet: translations.track.noWealthGoalsYet,
    addGoal: translations.track.addGoal,
    complete: translations.track.complete,
    metricsDashboard: translations.track.metricsDashboard,
    trackAndAnalyze: translations.track.trackAndAnalyze,
    passwordManager: translations.track.passwordManager,
    secureVault: translations.track.secureVault,
    mindMapping: translations.track.mindMapping,
    visualizeIdeas: translations.track.visualizeIdeas,
    
    riseAndShine: translations.morning.riseAndShine,
    goodMorning: translations.morning.goodMorning,
    seizeTheDay: translations.morning.seizeTheDay,
    morningInspiration: translations.morning.morningInspiration,
    awakeningRituals: translations.morning.awakeningRituals,
    morningMeditation: translations.morning.morningMeditation,
    centerYourMind: translations.morning.centerYourMind,
    morningRoutines: translations.morning.morningRoutines,
    buildYourPerfectRitual: translations.morning.buildYourPerfectRitual,
    dailyAffirmations: translations.morning.dailyAffirmations,
    speakPowerIntoExistence: translations.morning.speakPowerIntoExistence,
    morningHabits: translations.morning.morningHabits,
    fuelYourTransformation: translations.morning.fuelYourTransformation,
    wellnessCheck: translations.morning.wellnessCheck,
    tuneIntoYourEnergy: translations.morning.tuneIntoYourEnergy,
    embraceTheLight: translations.morning.embraceTheLight,
    
    goodEvening: translations.night.goodEvening,
    goodNight: translations.night.goodNight,
    restWell: translations.night.restWell,
    tonightsReflection: translations.night.tonightsReflection,
    eveningRituals: translations.night.eveningRituals,
    momentsOfGratitude: translations.night.momentsOfGratitude,
    captureYourThoughts: translations.night.captureYourThoughts,
    howImFeeling: translations.night.howImFeeling,
    checkInWithEmotions: translations.night.checkInWithEmotions,
    dreamJournal: translations.night.dreamJournal,
    captureYourDreams: translations.night.captureYourDreams,
    sleepMeditation: translations.night.sleepMeditation,
    peacefulRestSounds: translations.night.peacefulRestSounds,
    tomorrowsIntentions: translations.night.tomorrowsIntentions,
    setGoalsForTomorrow: translations.night.setGoalsForTomorrow,
    dailyHealthAssessment: translations.night.dailyHealthAssessment,
    takeYourTime: translations.night.takeYourTime,
    
    toolsAndSettings: translations.settings.toolsAndSettings,
    customizeYourExperience: translations.settings.customizeYourExperience,
    membership: translations.settings.membership,
    premiumPlan: translations.settings.premiumPlan,
    activeSubscription: translations.settings.activeSubscription,
    accountSettings: translations.settings.accountSettings,
    manageYourAccount: translations.settings.manageYourAccount,
    appTour: translations.settings.appTour,
    watchVideoTour: translations.settings.watchVideoTour,
    notifications: translations.settings.notifications,
    manageEventReminders: translations.settings.manageEventReminders,
    nightMode: translations.settings.nightMode,
    enabled: translations.settings.enabled,
    disabled: translations.settings.disabled,
    theme: translations.settings.theme,
    language: translations.settings.language,
    audioStyle: translations.settings.audioStyle,
    sound: translations.settings.sound,
    muted: translations.settings.muted,
    unavailable: translations.settings.unavailable,
    textSize: translations.settings.textSize,
    appMode: translations.settings.appMode,
    universeMode: translations.settings.universeMode,
    classicMode: translations.settings.classicMode,
    logOut: translations.settings.logOut,
    signedInWithDemo: translations.settings.signedInWithDemo,
    verified: translations.settings.verified,
    autoTheme: translations.settings.autoTheme,
    autoThemeDescription: translations.settings.autoThemeDescription,
    calendarBackgrounds: translations.settings.calendarBackgrounds,
    customizeCalendarAppearance: translations.settings.customizeCalendarAppearance,
    calendarThemes: translations.settings.calendarThemes,
    yourCalendars: translations.settings.yourCalendars,
    colorThemes: translations.settings.colorThemes,
    themesAvailable: translations.settings.themesAvailable,
    backToTools: translations.settings.backToTools,
    choosePreferredAudioStyle: translations.settings.choosePreferredAudioStyle,
    chooseComfortableSize: translations.settings.chooseComfortableSize,
    customizeAppAppearance: translations.settings.customizeAppAppearance,
    name: translations.settings.name,
    email: translations.settings.email,
    account: translations.settings.account,
    
    title: translations.forms.title,
    amount: translations.forms.amount,
    type: translations.forms.type,
    goalTitle: translations.forms.goalTitle,
    targetAmount: translations.forms.targetAmount,
    manifestation: translations.forms.manifestation,
    writeYourManifestation: translations.forms.writeYourManifestation,
    amountOptional: translations.forms.amountOptional,
    
    save: translations.common.save,
    edit: translations.common.edit,
    add: translations.common.add,
    close: translations.common.close,
    back: translations.common.back,
    next: translations.common.next,
    done: translations.common.done,
    loading: translations.common.loading,
    success: translations.common.success,
    pleaseWait: translations.common.pleaseWait,
    noDataYet: translations.common.noDataYet,
    tapToAdd: translations.common.tapToAdd,
    shared: translations.common.shared,
    active: translations.common.active,
    level: translations.common.level,
    dayStreak: translations.common.dayStreak,
    completed: translations.common.completed,
    badges: translations.common.badges,
    xp: translations.common.xp,
    or: translations.common.or,
    cancel: translations.common.cancel,
    delete: translations.common.delete,
    error: translations.common.error,
    continue: translations.common.continue,
    confirm: translations.common.confirm,
    areYouSure: translations.common.areYouSure,
    yes: translations.common.yes,
    no: translations.common.no,
    pleaseEnterEventTitle: translations.common.error,
    
    welcomeToAudrey: translations.account.welcomeToAudrey,
    createYourAccount: translations.account.createYourAccount,
    createAccountToBegin: translations.account.createAccountToBegin,
    firstName: translations.account.firstName,
    lastName: translations.account.lastName,
    emailAddress: translations.account.emailAddress,
    phoneNumber: translations.account.phoneNumber,
    phoneNeededForChat: translations.account.phoneNeededForChat,
    password: translations.account.password,
    createAccount: translations.account.createAccount,
    signUpWithICloud: translations.account.signUpWithICloud,
    signUpWithFaceID: translations.account.signUpWithFaceID,
    termsAndPrivacy: translations.account.termsAndPrivacy,
    
    chooseYourPremiumPlan: translations.subscription.chooseYourPremiumPlan,
    unlockFullPower: translations.subscription.unlockFullPower,
    basicMonthly: translations.subscription.basicMonthly,
    basicYearly: translations.subscription.basicYearly,
    advancedMonthly: translations.subscription.advancedMonthly,
    advancedYearly: translations.subscription.advancedYearly,
    perMonth: translations.subscription.perMonth,
    perYear: translations.subscription.perYear,
    popular: translations.subscription.popular,
    comingSoon: translations.subscription.comingSoon,
    fullAccessToFeatures: translations.subscription.fullAccessToFeatures,
    aiPoweredAssistant: translations.subscription.aiPoweredAssistant,
    unlimitedPlanning: translations.subscription.unlimitedPlanning,
    cloudSync: translations.subscription.cloudSync,
    prioritySupport: translations.subscription.prioritySupport,
    everythingInBasic: translations.subscription.everythingInBasic,
    saveAmount: translations.subscription.saveAmount,
    yearlyBonuses: translations.subscription.yearlyBonuses,
    earlyAccess: translations.subscription.earlyAccess,
    accessOnlineCourses: translations.subscription.accessOnlineCourses,
    excelInLife: translations.subscription.excelInLife,
    becomeExtraordinary: translations.subscription.becomeExtraordinary,
    vipSupport: translations.subscription.vipSupport,
    premiumCourses: translations.subscription.premiumCourses,
    exclusiveContent: translations.subscription.exclusiveContent,
    personalCoaching: translations.subscription.personalCoaching,
    continueWithPlan: translations.subscription.continueWithPlan,
    cancelAnytime: translations.subscription.cancelAnytime,
    noHiddenFees: translations.subscription.noHiddenFees,
    confirmSubscription: translations.subscription.confirmSubscription,
    planSummary: translations.subscription.planSummary,
    securedByAppStore: translations.subscription.securedByAppStore,
    doubleClickToPay: translations.subscription.doubleClickToPay,
    youreAllSet: translations.subscription.youreAllSet,
    welcomeToPremium: translations.subscription.welcomeToPremium,
    letsGo: translations.subscription.letsGo,
    viewPlanDetails: translations.subscription.viewPlanDetails,
    
    audrey: translations.ai.audrey,
    aiAssistant: translations.ai.aiAssistant,
    chatWithAudrey: translations.ai.chatWithAudrey,
    typeMessage: translations.ai.typeMessage,
    listening: translations.ai.listening,
    clearChat: translations.ai.clearChat,
    areYouSureClearChat: translations.ai.areYouSureClearChat,
    whatCanIHelp: translations.ai.whatCanIHelp,
    audreyCapabilities: translations.ai.audreyCapabilities,
    
    daily: translations.planner.daily,
    weekly: translations.planner.weekly,
    monthly: translations.planner.monthly,
    yearly: translations.planner.yearly,
    addTask: translations.planner.addTask,
    editTask: translations.planner.editTask,
    deleteTask: translations.planner.deleteTask,
    dueDate: translations.planner.dueDate,
    reminder: translations.planner.reminder,
    notes: translations.planner.notes,
    attachments: translations.planner.attachments,
    markComplete: translations.planner.markComplete,
    markIncomplete: translations.planner.markIncomplete,
    
    todoList: translations.todo.todoList,
    addTodo: translations.todo.addTodo,
    editTodo: translations.todo.editTodo,
    deleteTodo: translations.todo.deleteTodo,
    allTodos: translations.todo.allTodos,
    activeTodos: translations.todo.activeTodos,
    completedTodos: translations.todo.completedTodos,
    
    notesAndPads: translations.notes.notesAndPads,
    createNote: translations.notes.createNote,
    editNote: translations.notes.editNote,
    deleteNote: translations.notes.deleteNote,
    noteTitle: translations.notes.noteTitle,
    noteContent: translations.notes.noteContent,
    

    
    messages: translations.chat.messages,
    sendMessage: translations.chat.sendMessage,
    newMessage: translations.chat.newMessage,
    lastSeen: translations.chat.lastSeen,
    online: translations.chat.online,
    offline: translations.chat.offline,
    typing: translations.chat.typing,
    
    contacts: translations.contacts.contacts,
    addContact: translations.contacts.addContact,
    editContact: translations.contacts.editContact,
    deleteContact: translations.contacts.deleteContact,
    phone: translations.contacts.phone,
    mobile: translations.contacts.mobile,
    address: translations.contacts.address,
    website: translations.contacts.website,
    favorites: translations.contacts.favorites,
    allContacts: translations.contacts.allContacts,
    company: translations.contacts.company,
    position: translations.contacts.position,
    
    addPassword: translations.passwords.addPassword,
    editPassword: translations.passwords.editPassword,
    deletePassword: translations.passwords.deletePassword,
    username: translations.passwords.username,
    url: translations.passwords.url,
    secureNotes: translations.passwords.secureNotes,
    
    metrics: translations.metrics.metrics,
    dashboard: translations.metrics.dashboard,
    templates: translations.metrics.templates,
    activeMetrics: translations.metrics.activeMetrics,
    export: translations.metrics.export,
    import: translations.metrics.import,
    filter: translations.metrics.filter,
    search: translations.metrics.search,
  };
}
