// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

/* Read this very code's version from package.json */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'node:child_process'

import { marked } from 'marked';

// Read file to memory, path relative to repo root.
const slurp = (filename) => readFileSync(fileURLToPath(new URL(filename, import.meta.url)), 'utf8');

const pkg = JSON.parse(slurp("package.json"));
const githash = execSync("git rev-parse --short HEAD").toString().trimEnd();

// we use the environment variable access method from node.js and not
// from vite. Vite requires variables to be prepended with VITE_ and is weird.
const environ = process.env // loadEnv("production", process.cwd())
const env = (key, fallback_val) => key in environ ? environ[key] : fallback_val

/** @see src/lib/client_defaults.ts for the Interface describing this object */
const client_defaults = {
  app_version: pkg.version,
  app_githash: githash,
  app_build_date: new Date().toISOString(),
  
  // Used for instance in <title> elements
  app_name: "LUCIDAC-GUI",

  // URLs where variants of the app are hosted
  canonical_urls: [
    "https://lucidac.online",
    "http://nossl.lucidac.online",
  ],

  /**
   * Builds are either
   * 
   *   1) headless: inteded to be servered without an endpoint in mind.
   *      In this case, leave default_endpoint empty.
   *      Example usage on https://lucidac-gui.anabrid.dev/
   * 
   *   2) not headless: Inteded to be served from a Teensy or any other
   *      server where there is a clear unique endpoint. In this case,
   *      provide and endpoint.
   * 
   * Endpoints are URLs as strings. Suitable URLs are either explicit,
   * such as "http://192.168.1.123/api"
   * or using loopback magic such as "http://127.0.0.1:1234/api"
   * or are relative to where the SPA is hosted from, i.e. "/api"
   * 
   * (Note that any env default here is most likely a relict from development)
   **/
  endpoint: env("ENDPOINT", "/api"),

  // Data source name for Senitry performance monitor
  sentry_dsn: "https://1945f70e4e7a79fda4bcc0b6e321d1c7@sentry.anabrid.dev/2"
}

// const meta_serialized = Object.entries(meta_variables).map(([k,v]) => ws+`<meta property="luci:${k}" content="${v}" />`).join("\n")

// Just an easy compile-time text inserter.
const textfiles = {
  'README_HTML': marked.parse(slurp("README.md")),
  'CHANGELOG_HTML': marked.parse(slurp("CHANGELOG.md")),
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'update-static-index-html-deployment-infos',
      transformIndexHtml: {
        enforce: 'pre',
        transform: (html) => 
          html.replace(/CODE-NAME-AND-VERSION/, `${client_defaults.app_name}/${client_defaults.app_version}+${client_defaults.app_githash}`)
              .replace(/GLOBALS_JSON/, JSON.stringify(client_defaults, null, /* indent */ 8))          
      }
    }
  ],
  resolve: {
    alias: {
      '@': "/src",
    }
  },
  define: {
    // these variables appear globally, we want to scope them with "vite_replaced"
    // Usage is then like vite_replaced.textfiles.README_HTML
    vite_replaced: {
      textfiles
    }
  },
  base: './', // use relative paths
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapBaseUrl: env("SOURCEMAP_BASE_URL", undefined)
      }
    }
  }
})
