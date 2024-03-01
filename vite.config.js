import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

/* Read this very code's version from package.json */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

import { execSync } from 'node:child_process'

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);
const githash = execSync("git rev-parse --short HEAD").toString().trimEnd();

const globals = {
  lucidac_gui_version: pkg.version,
  lucidac_gui_githash: githash,

  // headless builds are inteded to be servered without an endpoint in mind.
  // The opposite is a build intended to be served from a Teensy ("not headless").
  // An example for a headless build is the usage on some http://*.anabrid.dev/ server.
  headless_build: false,
  
  // suitable endpoint URLs are either explicit, such as "http://192.168.1.123/api"
  // or using loopback magic such as "http://127.0.0.1:1234/api"
  // or are relative to where the SPA is hosted from, i.e. "/api"
  default_lucidac_endpoint:  "http://192.168.150.113/api",

  // Used for instance in <title> elements
  application_name: "LUCIDAC-GUI",

  // Fully qualified application name including version
  application_name_and_version: `LUCIDAC-GUI/${pkg.version}-${githash}`
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'update-static-index-html-deployment-infos',
      transformIndexHtml: {
        enforce: 'pre',
        transform: (html) => {
          return html.replace(
            /CODE-NAME-AND-VERSION/,
            globals.application_name_and_version
          )
        }
      }
    }
  
  ],
  define: {
    globals
  }
})
