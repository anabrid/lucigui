# lucidac-gui: A Svelte based JavaScript Single Page Web Application for LUCIDAC

This is the README file for the Svelte based single page web application (SPA) to configure and
program the LUCIDAC, called **lucidac-gui**. The application behaves "just as another"
*LUCIDAC client*, i.e. the LUCIDAC does not rely on this particular application. However, all
other existing client implementations so far (for insance written in Python, Julia, Matlab or C/C++)
concentrate on the terminal (command line interface), that is, they do not have a graphical user
interface. This is where this application differs most.

## Main Features

- Can be used while being connected to a LUCIDAC but also in "headless" use, able to connect to any
  suitable LUCIDAC or to no LUCIDAC at all.
- When connected to a LUCIDAC, allows to
  - display basic system information (such as firmware version, uptime, etc.)
  - show and edit persistent microcontroller configuration (networking, access control, etc)
  - do a factory reset, upgrade the firmware
  - provide an easy access to outgoing help links to the system documentation and programming guides
- As a unique feature, it powers a powerful **visual programming experience** for configuring the
  analog wiring in the LUCIDAC straight out of the browser, featuring various completely synchronized
  and editable *views*, including
  - a graphical circuit editor
  - a graphical matrix editor
  - and probably a DDA code editor in the future
- The programmer is completed with a included set of example circuits.

## About the code

The code was written in [Typescript](https://www.typescriptlang.org/), which compiles to Javascript,
the defacto programming language for applications running in web browsers. It ships with a standalone
Typescript hybrid controller client (at the single file `src/lib/HybridController.ts`) which serves
as a **javascript client for the JSONL lucidac protocol**.
It can also be used in other Javascript/Typescript clients in any modern Javascript ecosystem such as 
[node](https://nodejs.org/) or [deno](https://deno.com/).

The actual **SPA web application** is using the precompiled reactive web framework [Svelte](https://svelte.dev)
and the JS build tool [Vite](https://vitejs.dev/). [npm](https://www.npmjs.com/) is used for library managament.
We use the [svelte-spa-router](https://www.npmjs.com/package/svelte-spa-router) instead of SvelteKit.
For the graphical programming, we currently stick to [Svelte Flow](https://svelteflow.dev/).

For the records, the project was boostrapped with `npm create vite@latest`.

## Design principles

The fundamental idea is written in 
[#58: Simple Webserver for LUCIDAC](https://lab.analogparadigm.com/lucidac/firmware/hybrid-controller/-/issues/58)
and summarized in the following.

We want a *simple* SPA with static HTML files which makes self-hosting of the
compiled code trivial. This code is supposed to be served *straight from the firmware of the LUCIDAC*, i.e.
included into the hybrid controller firmware image. This is primarily in order to be able to use it also when
the LUCIDAC is used in an isolated/offline network and to avoid vendor dependencies. A webserver hosting this
SPA provides the following benefits:

- Simplifies finding LUCIDAC in network and to do "first steps"
- Simplifies device configuration for non-CLI experienced people or administrators
- People expect this, think of a web gui for any modern network-enabled printer. They allow you to configure the device and see its status.
- It also opens the world for javascript analog programming. People could also do this with node.js and friends,
  but with a real HTTP endpoint it is easier and more convenient.

The *HTTP endpoint* is a simple adapter which *elevates* the JSONL "raw" TCP/IP protocol ontop of HTTP/1.1.
The LUCIDAC-embedded webserver does only need to serve a few static files.

The following design decision have been made in terms of security:

- As a guiding principle, the firmware webserver has no HTTPS, which is always dysfunctional in non-public
  networks. As websockets require HTTPS, they cannot be used.
- **Cross-Origin Resource Sharing** (CORS) is the primary security measure for protecting the LUCIDAC HTTP
  endpoint against unwanted access. It is one more configuration option for the LUCIDAC networking.
- The simple user-password access system is also elevated on HTTP and exponential back off for failed logins
  shall be implemented (this is out of scope for the lucidac-gui client).

## Deployment strategies

There are two deployment routes:

- The headless "variant" of the code built and uploaded to https://lucidac-gui.anabrid.dev/ by Gitlab-CI.
- The LUCIDAC "variant" is made available as Gitlab-CI build artifacts and integrated into the firmware
  at firmware build time. This is made by embedding individual gzipped files as bytestring objects.

Gzipped code size of the compiled project is currently about 500kB. We strongly try to keep this as low
as possible (the magical barrier is 1MB of zipped build size).

## License

This is an open source code released under *MIT OR GPL* license. The code is copyright
by anabrid, see https://www.anabrid.com/licensing/ for details.

## Getting started as developer

Make sure you have a running version of nodejs or in particular `npm`, the node package manager.

* Clone the repository from https://lab.analogparadigm.com/lucidac/software/lucidac-gui 
* Go to the repository root directory and run `npm install` in order to install the project dependencies locally.
* In order to start the development webserver and open your web browser: `npm run dev --open`

If you want to build the compiled code locally, run  `npm run build`.
Afterwards, you can serve the code without any node dependency for instance with `cd dist && python -m http.server`.

If you want to use an IDE, we suggest to use vscode or IntelliJ with the svelte plugins for developing.

When debugging in browser, the JavaScript console is your friend.
You can load the JavaScript HybridController client directly into the browser console and then examine
how replies look like with the following:

```
var hc; import("http://localhost:5173/src/lib/HybridController.ts").then(module => { hc = module; })
await hc.query("status)
```

Also have a look at our issue tracker at https://lab.analogparadigm.com/lucidac/software/lucidac-gui/-/issues
