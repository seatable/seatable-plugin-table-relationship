import { AvailableLocales } from '../utils/template-interfaces/App.interface';

const files = require.context('./lang', false, /\.json$/);

const AVAILABLE_LOCALES: AvailableLocales = files.keys().reduce((locales: any, key) => {
  const fileName = key.replace(/\.\/|\.json/g, '');
  locales[fileName] = files(key);
  return locales;
}, {});

/**
 * Fallback locale only: in production the language comes from `window.dtable.lang`
 * (see entry.tsx). In development, `window.dtablePluginConfig` is populated from
 * setting.local.js by setting.ts. This module must NOT import setting.local: it is
 * reachable from the production entry, so a fresh clone (where that gitignored file
 * is absent) could not compile, and the developer's file would end up in the bundle.
 */
const DEFAULT_LOCALE: string = window.dtablePluginConfig?.lang || 'en';

export { AVAILABLE_LOCALES, DEFAULT_LOCALE };
