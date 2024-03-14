<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
  import Router, { link, querystring } from "svelte-spa-router";
  import active from "svelte-spa-router/active";
  import * as Sentry from "@sentry/svelte"

  import { toggle, globals, slugify } from "@/lib/utils";

  import { hc } from "@/lib/HybridControllerStores";
  //import SystemAvailability from './lib/SystemAvailability.svelte';

  import Home from "@/routes/Home.svelte";
  import Starting from "@/routes/Starting.svelte";
  import Settings from "@/routes/Settings.svelte";
  import Editor from "@/routes/Editor.svelte";
  
  import About, { info_modal_open } from "@/lib/About.svelte"

  const nav = [Home, Settings, Editor, Starting];
  const urls = ["/", "/settings", "/editor", "/starting"];
  const titles = ["Home", "Settings", "Editor", "Getting Started"];

  const zip = (rows) => rows[0].map((_, c) => rows.map((row) => row[c]));
  const routes = Object.fromEntries(zip([urls, nav]));

  let active_title = "";

  // treat document title at navigation
  function routeLoaded(event) {
    const route_id = urls.findIndex((e) => e == event.detail.route);
    if (route_id == -1) return;
    // inserting the device name would also be handy
    document.title = titles[route_id] + " (" + globals.application_name + ")";

    active_title = slugify(titles[route_id])
  }

  var endpoint_dropdown_active = false;
  
  Sentry.init({
    dsn: globals.senitry_dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      Sentry.feedbackIntegration({
        colorScheme: "system"
      })
    ],
  
    // Performance Monitoring
    tracesSampleRate: 0.2, // 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["*"], // ["localhost", /^https:\/\/anabrid\.dev/, /^((\d+)\.?){4}/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

  const navbar_burger_active = toggle(false)
</script>

<nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <a class="navbar-item" href="#/">
      <img src="lucidac-logo.svg" alt="LUCIDAC" />
    </a>

    <!-- svelte-ignore a11y-missing-attribute -->
    <!-- svelte-ignore a11y-interactive-supports-focus -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <a
      role="button"
      class="navbar-burger"
      aria-label="menu"
      aria-expanded="false"
      data-target="navbarBasicExample"
      class:is-active={$navbar_burger_active}
      on:click={navbar_burger_active.toggle}
    >
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
  </div>
  <div class="navbar-menu is-primary" class:is-active={!$navbar_burger_active}>
    <div class="navbar-start">
      {#each zip([urls, titles]) as [href, title]}
        <a {href} use:link use:active class="navbar-item">{title}</a>
      {/each}
    </div>
    <div class="navbar-end">
      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-link">
          Headless
        </a>
    
        <div class="navbar-dropdown is-right">
          <div class="navbar-item">
            Endpoint URL: {hc.$endpoint}
          </div>
          <div class="navbar-item">
            Reachable: {hc.$endpoint_status}
          </div>
          <hr class="navbar-divider">
          <a class="navbar-item">
            Login (if connected...)
          </a>
          <hr class="navbar-divider">
          <a class="navbar-item" on:click={info_modal_open.toggle}>
            About
          </a>
        </div>
      </div>
    </div>

        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!--
        <div
          class="dropdown"
          class:is-active={endpoint_dropdown_active}
          on:click={() =>
            (endpoint_dropdown_active = !endpoint_dropdown_active)}
        >
        -->


</nav>
<main class="wrapper page-{active_title}">

  <Router {routes} on:routeLoaded={routeLoaded} />

</main>

{#if $info_modal_open}
  <About />
{/if}

<style type="scss">
</style>
