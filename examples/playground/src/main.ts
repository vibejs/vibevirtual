import { createApp } from '@usevibejs/ui';
import App from './App.vibe';
import { createVibeQueryPlugin, QueryClient } from '@usevibejs/query';
import '@fontsource-variable/geist/index.css';
import '@fontsource-variable/geist-mono/index.css';
import './style.css';
const host = document.querySelector('#app');
if (!host) throw new Error('Missing app host');
createApp(App)
  .use(
    createVibeQueryPlugin(new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } })),
  )
  .mount(host);
