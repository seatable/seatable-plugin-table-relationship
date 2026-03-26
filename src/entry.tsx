// import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './app';
import info from './plugin-config/info.json';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from './locale';
import intl from 'react-intl-universal';

let pluginRoot: ReturnType<typeof createRoot> | null = null;

const SeaTablePlugin = {
  execute: () => {
    let lang =
      window.dtable && Object.keys(AVAILABLE_LOCALES).includes(window.dtable.lang)
        ? window.dtable.lang
        : DEFAULT_LOCALE;
    intl.init({ currentLocale: lang, locales: AVAILABLE_LOCALES });
    const container = document.querySelector('#plugin-wrapper');
    if (!pluginRoot) {
      pluginRoot = createRoot(container!);
    }
    pluginRoot.render(<App showDialog={true} key={Date.now()} />);
  },
};

export default SeaTablePlugin;

window.app.registerPluginItemCallback(info.name, SeaTablePlugin.execute);
