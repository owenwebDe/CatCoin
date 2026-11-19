import { defineConfig } from 'vite';
import { config, CA_PLACEHOLDER_TEXT, shortCA } from './src/config.ts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function values(): Record<string, string> {
  const ca = config.CA.trim();
  const hasCA = ca.length > 0;
  return {
    ...config,
    CA_DISPLAY: hasCA ? ca : CA_PLACEHOLDER_TEXT,
    CA_SHORT: hasCA ? shortCA(ca) : CA_PLACEHOLDER_TEXT,
    CA_DISABLED: hasCA ? '' : 'disabled',
    CA_STATE: hasCA ? 'has-ca' : 'no-ca',
    BUY_TARGET: config.BUY_URL === '#' ? '_self' : '_blank',
  };
}

export default defineConfig({
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 800 },
  plugins: [
    {
      name: 'catcoin-placeholders',
      transformIndexHtml(html) {
        const v = values();
        return html.replace(/\{\{(\w+)\}\}/g, (m, key: string) => {
          if (!(key in v)) throw new Error(`Unknown placeholder ${m} in index.html`);
          return esc(v[key]);
        });
      },
    },
  ],
});
