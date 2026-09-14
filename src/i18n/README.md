# Internationalization

`config.ts` initializes `i18next` synchronously with German as the default and English as the
supported alternative. `resources.ts` owns stable, language-neutral translation keys. Financial
labels reuse the canonical keys from `docs/terminology.md`; additions must update both resources
and the terminology standard together.

`formatters.ts` provides locale-aware number, percentage and euro display. Euro values enter the
formatter as integer cents, while percentage rates enter as decimals. Localization changes display
only and must never alter calculation inputs.
