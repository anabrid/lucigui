<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
  import { setContext } from "svelte";
  import { slide, fade } from "svelte/transition";
  import Router, { link, querystring } from "svelte-spa-router";
  import active from "svelte-spa-router/active";

  import { toggle, slugify } from "@/lib/utils";
  import ClientDefaults from '@/lib/client_defaults';
  import { lazy_load_sentry } from '@/lib/sentry.js'

  import { hc, endpoint, endpoint_status } from "@/HybridController/svelte-stores";
  //import SystemAvailability from './lib/SystemAvailability.svelte';

  import Home from "@/routes/Home.svelte";
  import Help from "@/routes/Help.svelte";
  import Settings from "@/routes/Settings.svelte";
  import Editor from "@/routes/Editor.svelte";
  
  import About, { info_modal_open } from "@/lib/About.svelte"

  const nav = [Home, Settings, Editor, Help];
  const urls = ["/", "/settings", "/editor", "/help"];
  const titles = ["Home", "Settings", "Editor", "Getting Started"];

  const zip = (rows) => rows[0].map((_, c) => rows.map((row) => row[c]));
  let routes = Object.fromEntries(zip([urls, nav]));

  // add some special rules
  routes["/help/:topic?"] = Help

  let active_title = "";

  // treat document title at navigation
  function routeLoaded(event) {
    const route_id = urls.findIndex((e) => e == event.detail.route);
    if (route_id == -1) return;
    // inserting the device name would also be handy
    document.title = `${titles[route_id]} (${ClientDefaults.app_name})`;

    active_title = slugify(titles[route_id])
  }

  var endpoint_dropdown_active = false;

  let navbar_visible = toggle(true)
  setContext("navbar_visible", navbar_visible) // allow any children to toggle

  const navbar_burger_active = toggle(false)

  if(ClientDefaults.sentry_dsn)
    lazy_load_sentry(ClientDefaults.sentry_dsn)

</script>

{#if $navbar_visible}
<nav transition:slide class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <a class="navbar-item" href="#/">
      <img src="lucidac-logo-klein.svg" alt="LUCIDAC" />
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
            Endpoint URL: {$endpoint}
          </div>
          <div class="navbar-item">
            Reachable: {$endpoint_status}
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
{/if}

<!-- From a CSS/styling point of view, there is no need for an
     additional wrapper for the routed main element. -->
<Router {routes} on:routeLoaded={routeLoaded} />

{#if $info_modal_open}
  <About />
{/if}