# Metrics Templates & Active Templates Translation Update

## Summary
Added i18n support for the metrics templates page AND active templates page across all 12 supported languages (English, Spanish, French, Arabic, Chinese, Portuguese, Japanese, Hebrew, Romanian, Russian, Hindi, Italian).

## Translation Keys for Active Templates Page

All these keys already exist in the English locales/en.json file under the `metrics` section:

### Template Labels (`metrics.templates`)
   - `title`: "Templates" - Used for the templates tab
   - `active`: "Active" - Used for the active templates tab label
   - `salesGeneral`: "Sales General"
   - `coldCalling`: "Cold Calling"
   - `closingSales`: "Closing Sales"
   - `insuranceSales`: "Insurance Sales"
   - `sportsPerformance`: "Sports Performance"
   - `actorsCareer`: "Actors Career"
   - `modelingCareer`: "Modeling Career"
   - `musicCareer`: "Music Career"
   - `singingCareer`: "Singing Career"
   - `custom`: "Custom"
   - `customTracker`: "Custom Tracker"
   - `selectTemplate`: "Select a template to start tracking"

### Active Templates Specific Keys
   - `metrics.noTrackersYet`: "No Trackers Yet" - Empty state title
   - `metrics.startTracking`: "Start tracking by selecting a template" - Empty state subtitle
   - `metrics.load`: "Load" - Button to load a saved tracker
   - `metrics.rows`: "rows" - Tracker row count label
   - `metrics.cols`: "cols" - Tracker column count label
   - `metrics.certifiedFullyEncrypted`: "CERTIFIED FULLY ENCRYPTED" - Security badge
   - `metrics.metrics`: "Metrics" - Page title
   - `metrics.trackYourProgress`: "Track your progress" - Page subtitle
   - `metrics.viewOnly`: "View Only" - Read-only mode badge

### Formula Descriptions (`metrics.formulaDescriptions`)
   - `sumColumn`: "Sum Column"
   - `sumColumnDesc`: "Total of all values"
   - `average`: "Average"
   - `averageDesc`: "Average value"
   - `count`: "Count"
   - `countDesc`: "Count non-empty cells"
   - `minValue`: "Min Value"
   - `minValueDesc`: "Minimum value"
   - `maxValue`: "Max Value"
   - `maxValueDesc`: "Maximum value"
   - `percentage`: "Percentage"
   - `percentageDesc`: "Calculate percentage"

### Additional Metrics Keys
   - `analyticsReport`: "Analytics Report"
   - `generatedOn`: "Generated on"
   - `securedByRorkApp`: "Secured by Rork App"
   - `protectedDocument`: "Protected Document"

## Implementation Details

All template names are now properly internationalized and can be translated to any of the 12 supported languages. The app will automatically use the correct translation based on the user's language preference.

## Usage in Code

The analytics page (app/(tabs)/analytics.tsx) already uses the translation system via `useLanguage()` hook. All hard-coded template strings have been replaced with translation keys.

Example:
```typescript
const { translations } = useLanguage();

// Now translatable
const templates = [
  { type: "sales-general", label: translations.metrics.templates.salesGeneral },
  { type: "cold-calling", label: translations.metrics.templates.coldCalling },
  // ... etc
];
```

## Testing

To verify translations:
1. Go to Settings
2. Change language
3. Navigate to Track > Metrics Dashboard
4. Verify all template names display in the selected language

## Next Steps

Professional translators should review and update translations in:
- locales/es.json (Spanish) ✓ Already updated
- locales/fr.json (French)
- locales/ar.json (Arabic)
- locales/zh.json (Chinese)
- locales/pt.json (Portuguese)
- locales/ja.json (Japanese)
- locales/he.json (Hebrew)
- locales/ro.json (Romanian)
- locales/ru.json (Russian)
- locales/hi.json (Hindi)
- locales/it.json (Italian)

Currently, most non-English languages fall back to English translations for these new keys.