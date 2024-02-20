import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

/* Read this very code's version from package.json */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

// TODO: Would also be nice to include git revision tag.

// TODO: Would also be nice to have some generated index.html

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    globals: {
      lucidac_gui_version: pkg.version,
      default_lucidac_endpoint:  "http://192.168.150.113/api",
      application_name: "Lucidac-GUI"
    }
  }
})
