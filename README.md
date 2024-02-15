# Svelte based JavaScript Single Page Web Application for LUCIDAC

This repository holds a project using [Svelte](https://svelte.dev) and [Vite](https://vitejs.dev/).
Svelte is a precompiled reactive web framework and Vite is a JS build tool. [npm](https://www.npmjs.com/)
is used for library managament.
We use this with [svelte-spa-router](https://www.npmjs.com/package/svelte-spa-router) instead of SvelteKit,
which is incredibly large for the work to be done.

For the records, the project was boostrapped with `npm create vite@latest`.

Gzipped code size of the compiled project is currently about 25kB. That's what goes basically into the
firmware when directly hosted from the LUCIDAC Teensy.

## How to use

* First run: `npm install`
* To start the development server: `npm run dev`
* To build the static assets: `npm run build`. Can subsequently check for valid and independent working
  with `cd dist && python -m http.server`

## Tips for debugging

You can load the JavaScript HybridController client directly into the browser console and then examine
how replies look like:

```
var hc; import("http://localhost:5173/src/lib/HybridController.js").then(module => { hc = module; })
await hc.query("status)
```