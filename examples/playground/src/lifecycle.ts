import { createApp } from '@usevibejs/ui';
import type { App } from '@usevibejs/ui';
import Chat from './Chat.vibe';
import './style.css';
const host = document.querySelector('#app');
if (!host) throw new Error('Missing lifecycle fixture host');
let app: App | undefined;
function mount() {
  app?.unmount();
  app = createApp(Chat);
  app.mount(host!);
}
document.querySelector('#mount')?.addEventListener('click', mount);
document.querySelector('#unmount')?.addEventListener('click', () => {
  app?.unmount();
  app = undefined;
});
mount();
