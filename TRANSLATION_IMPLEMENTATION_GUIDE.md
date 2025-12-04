# Translation Implementation Guide

This app now has a comprehensive internationalization system supporting 12 languages:
- English (en)
- Spanish (es)
- Italian (it)
- French (fr)
- Arabic (ar)
- Chinese (zh)
- Portuguese (pt)
- Japanese (ja)
- Hebrew (he)
- Romanian (ro)
- Russian (ru)
- Hindi (hi)

## Current Status

The LanguageContext is fully set up with translations for existing keys. The following pages are already using translations:
- Language selection screen
- Morning screen (partial)
- Night screen (partial)
- Settings screen (partial)
- Track screen (partial)
- Calendar screens (partial)

## How to Add Translations to a Page

### Step 1: Import the Language Hook

```tsx
import { useLanguage } from '@/contexts/LanguageContext';
```

### Step 2: Use the Translation Hook

```tsx
export default function YourScreen() {
  const { t, language } = useLanguage();
  
  // Now you can use t.yourKey to get translated text
  return (
    <View>
      <Text>{t.yourTranslationKey}</Text>
    </View>
  );
}
```

### Step 3: Add Missing Keys to LanguageContext

If you need new translation keys that don't exist yet:

1. Add the key to the `TranslationKeys` type in `contexts/LanguageContext.tsx`
2. Add translations for ALL 12 languages in the `translations` object

Example:
```typescript
// In TranslationKeys type:
type TranslationKeys = {
  // ... existing keys
  yourNewKey: string;
};

// In translations object for each language:
const translations: Record<Language, TranslationKeys> = {
  en: {
    // ... existing translations
    yourNewKey: 'Your English Text',
  },
  es: {
    // ... existing translations
    yourNewKey: 'Tu Texto en Español',
  },
  // ... repeat for all 12 languages
};
```

## Pages That Need Translation Implementation

### High Priority (User-facing screens)
1. ✅ Language Selection - DONE
2. ⚠️ Morning Screen - Partially done, needs completion
3. ⚠️ Night Screen - Needs implementation
4. ❌ AI Assistant Screen
5. ❌ Account Creation Screen
6. ❌ Membership Screen
7. ❌ Planner Screens (yearly, monthly, weekly, daily)
8. ❌ Todo List Screen
9. ❌ Notes Screen
10. ❌ Mind Mapping Screens
11. ❌ Chats Screen
12. ❌ Phonebook Screen
13. ❌ Calendar Manager Screen
14. ❌ Analytics Screen
15. ❌ Wellness/Habits/Routines Screens

### Medium Priority (Settings and modals)
16. ❌ Mode Selection Screen
17. ❌ Theme Selection Screen
18. ❌ Account Settings Screen
19. ❌ Notification Settings Screen
20. ❌ Subscription Selection Screen
21. ❌ All Modals (add event, edit contact, etc.)

### Common Patterns

#### Headers/Titles
```tsx
<Text style={styles.header}>{t.yourHeaderKey}</Text>
```

#### Buttons
```tsx
<TouchableOpacity onPress={handlePress}>
  <Text>{t.save}</Text>
</TouchableOpacity>
```

#### Form Labels
```tsx
<TextInput
  placeholder={t.enterYourName}
  // ...
/>
```

#### Error Messages
```tsx
{error && <Text>{t.error}: {t.pleaseEnterEventTitle}</Text>}
```

#### Lists/Empty States
```tsx
{items.length === 0 ? (
  <Text>{t.noDataYet}</Text>
) : (
  // render items
)}
```

## Translation Keys Needed for Each Screen Type

### Account/Auth Screens
- `createAccount`
- `signIn`
- `firstName`
- `lastName`
- `password`
- `confirmPassword`
- `forgotPassword`
- `orContinueWith`
- `alreadyHaveAccount`
- `dontHaveAccount`

### Planner Screens
- `yearly`, `monthly`, `weekly`, `daily`
- `addTask`, `editTask`, `deleteTask`
- `dueDate`, `reminder`
- `notes`, `attachments`
- `markComplete`, `markIncomplete`

### Chat/Messages Screens
- `sendMessage`, `newMessage`
- `typeMessage`
- `lastSeen`, `online`, `offline`
- `search`, `filter`

### Contacts/Phonebook Screens
- `addContact`, `editContact`
- `phone`, `mobile`, `work`, `home`
- `address`, `website`
- `favorites`, `allContacts`
- `company`, `position`

### Mind Mapping Screens
- `createMap`, `editMap`
- `addNode`, `deleteNode`
- `connect`, `disconnect`
- `export`, `import`

## RTL (Right-to-Left) Support

For Arabic and Hebrew, the app should automatically handle RTL layout. The LanguageContext already supports these languages.

## Number Formatting

For numbers and dates, consider using locale-specific formatting:

```tsx
// Format numbers based on language
const formatNumber = (num: number) => {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : language).format(num);
};

// Format dates based on language
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : language).format(date);
};
```

## Testing Translations

1. Go to Settings > Language
2. Select a different language
3. Navigate through all screens
4. Verify all text is translated
5. Check for text overflow issues
6. Verify RTL layout for Arabic/Hebrew

## Common Issues and Solutions

### Issue: Text Too Long in Some Languages
**Solution**: Use `numberOfLines` and `adjustsFontSizeToFit` props:
```tsx
<Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
  {t.veryLongTitle}
</Text>
```

### Issue: Hardcoded Strings
**Solution**: Search for strings wrapped in quotes and replace with translation keys

### Issue: Missing Translation
**Solution**: Add the key to LanguageContext for all 12 languages

## Completion Checklist

- [ ] All screens use `useLanguage()` hook
- [ ] No hardcoded English strings remain
- [ ] All buttons/headers/labels are translated
- [ ] All error messages are translated
- [ ] All placeholders are translated
- [ ] All modals are translated
- [ ] Tested in all 12 languages
- [ ] RTL layout works for Arabic/Hebrew
- [ ] No text overflow issues
- [ ] Numbers/dates use locale formatting

## Implementation Priority Order

1. Start with most-used screens (Calendar, Planner, Morning/Night)
2. Then do authentication/onboarding flows
3. Then settings and configuration screens
4. Finally, less-used screens and modals

## Next Steps

The current implementation provides a solid foundation. You now need to:

1. Go through each screen file
2. Import `useLanguage` hook
3. Replace all hardcoded strings with `t.translationKey`
4. Add any missing keys to LanguageContext
5. Test the screen in multiple languages

Good luck with the implementation! The translation system is now ready to use across the entire app.
