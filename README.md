# lucigui: A GUI for the analog-digital hybrid computer LUCIDAC

lucigui is a Svelte based JavaScript Single Page Web Application for [LUCIDAC](https://anabrid.com/lucidac).
LUCIDAC lacks the classical analog computer cable-based interface, and this is the first graphical
interface for a reprogrammable analog computer.

This is the README file for the Svelte based single page web application (SPA) to configure and
program the LUCIDAC, called **lucidac-gui**. The application behaves "just as another"
*LUCIDAC client*, i.e. the LUCIDAC does not rely on this particular application. However, all
other existing client implementations so far (for insance written in Python, Julia, Matlab or C/C++)
concentrate on the terminal (command line interface), that is, they do not have a graphical user
interface. This is where this application differs most.

## Main Features

- Talks to LUCIDACs via HTTP ~~REST API~~ Websockets. Requires suitable LUCIDAC firmware branch.
- Can be used while being connected to a LUCIDAC but also in **headless mode**, where most functions
  are still available. The client can connect to any suitable LUCIDAC or no LUCIDAC at all.
- When connected to a LUCIDAC, allows to
  - display basic system information (such as firmware version, uptime, etc.)
  - show and edit persistent microcontroller configuration (networking, access control, etc)
  - (planned) do a factory reset, upgrade the firmware
  - provide an easy access to outgoing help links to the system documentation and programming guides
- As a unique feature, it powers a powerful **visual programming experience** for configuring the
  analog wiring in the LUCIDAC straight out of the browser, featuring various completely synchronized
  and editable *views*, including
  - a graphical circuit editor
  - a graphical matrix editor
  - (planned) probably a DDA code editor in the future
- Both settings and circuit configuration can be imported and exported as JSON files.
- The application ships with a built-in set of example circuits as well as help texts.

## Usage: On the notation of endpoints

A TCP/IP socket "endpoint" is characterized by an IP-address/hostname and a port, for instance
`192.168.1.2` and `573`. This standard is of course also used in traditional LUCIDAC JSON-Lines "raw TCP protocol"
clients. In contrast, this client uses HTTP websockets which define their endpoints as URLs. In websocket world,
these URLs have the schema `ws` or `wss` (if SSL is used). As LUCIDACs currently do not support SSL, `ws`
is the only supported schema. The websocket URL is basically what comes out when your replace the `http`
in something like `http://192.168.1.2/some/path` with `ws`. The path in the URL is, by definition, always
`/websocket` in the embedded LUCIDAC webserver. However, it can (in future) also be explored by the network
status query or settings.

Furthermore, if you want to connect to a LUCIDAC without websocket support, you can elevate the protocol
by yourself. This works the same as a serial2tcp converter/proxy. Suitable codes shall presented here in the
future.

## About the code

The code was written in [Typescript](https://www.typescriptlang.org/), which compiles to Javascript,
the defacto programming language for applications running in web browsers. It ships with a standalone
Typescript hybrid controller client called `lucicon` which serves
as a **javascript client for the JSONL lucidac protocol**.
This client can also be used in other Javascript/Typescript clients in any modern Javascript ecosystem such as 
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

The *HTTP endpoint* is a simple adapter which *elevates* the JSONL "raw" TCP/IP protocol via HTTP/1.1
to the websocket protocol. The LUCIDAC-embedded webserver serves a few static files and allows the HTTP
protocol upgrade. Note that both JSONL and websockets are message oriented protocols which allow true bidirectional
communication, so there is little work involved matching these two protocols.

The following design decision have been made in terms of security:

- As a guiding principle, the firmware webserver has no HTTPS, which is always dysfunctional in non-public
  networks.
- **Cross-Origin Resource Sharing** (CORS) is the primary security measure for protecting the LUCIDAC HTTP
  endpoint against unwanted access. It is one more configuration option for the LUCIDAC networking.
- The simple user-password access system is straightforwardly elevated on the websocket protocol.

### License

This is an open source code released under *MIT OR GPL* license. The code is copyright
by anabrid, see https://www.anabrid.com/licensing/ or [LICENSE.md](LICENSE.md) for details.

### Code managament

We currently follow this model:

* "Vendor code" comes from https://lab.analogparadigm.com/lucidac/software/lucidac-gui
  where there is also an issue tracker and the continous integration.
* Open source release happens at https://github.com/anabrid/lucidac-gui as a gitlab-to-github mirror
  which however only covers the git repository, not the issues and CI. This is not perfect, but
  allows people to fork, open issues and even put push requests anyway.

### Deployment strategies

There are two deployment routes:

- The headless "variant" of the code built and uploaded to https://lucidac.online/ by Gitlab-CI.
- The LUCIDAC "variant" is made available as Gitlab-CI build artifacts and integrated into the firmware
  at firmware build time. This is made by embedding individual gzipped files as bytestring objects.

The different behaviour is steered by variables defined at "svelte startup time" in the [index.html](index.html)
file. Therefore, in principle only one svelte built is neccessary for the two variants, despite this is
implemented as two different build in [.gitlab-ci.yml](.gitlab-ci.yml) for convenience.

Gzipped code size of the compiled project is currently about 500kB. We strongly try to keep this as low
as possible (the magical barrier is 1MB of zipped build size).

## Getting started as developer

Make sure you have a running version of nodejs or in particular `npm`, the node package manager.

* Clone the repository (for instance from https://github.com/anabrid/lucidac-gui)
* Go to the repository root directory and run `npm install` in order to install the project dependencies locally.
* In order to start the development webserver and open your web browser: `npm run dev --open`

If you want to build the compiled code locally, run  `npm run build`.
Afterwards, you can serve the code without any node dependency for instance with `cd dist && python -m http.server`.

For documenting, we use the [TSDoc](https://tsdoc.org/) standard. For unit testing,
we use the [vitest](https://vitest.dev/) testing framework (`npm run test`).

### Useful commands

* `npm run release` -- creates a release (`git tag` + `package.json`; Gitlab-Release is done in CI)
* `npx vite-bundle-visualizer` -- allows to inspect a bundle and identify wasteful dependencies or problems in tree shaking

### Debugging and Developing tips
If you want to use an IDE, we suggest to use vscode or IntelliJ with the svelte plugins for developing.

When debugging in browser, the JavaScript console is your friend. While Svelte components are not easy to examine,
our modules expose some variables in the `window` scope, that means you can do something like

```
hc.remote.query("status)
get(hc.endpoint)
```

and similar. Note that you can also load ECMASCript modules via something like

```
var hc; import("http://localhost:5173/src/HybridController/connection.ts").then(module => { hc = module; })
await hc.query("status)
```
