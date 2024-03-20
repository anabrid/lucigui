<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
  import { setContext } from "svelte";
  import { get } from "svelte/store";
  import { slide, fade } from "svelte/transition";
  import Router, { link, querystring } from "svelte-spa-router";
  import active from "svelte-spa-router/active";

  import { toggle, slugify } from "@/lib/utils";
  import ClientDefaults from '@/lib/client_defaults';
  import { lazy_load_sentry } from '@/lib/sentry.js'

  import Endpoint from "@/lib/Endpoint.svelte"
  import { SvelteHybridController } from "@/HybridController/svelte-stores";
  //import SystemAvailability from './lib/SystemAvailability.svelte';

  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faLink, faLinkSlash } from '@fortawesome/free-solid-svg-icons'

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

  // This is for fullscreen display, allows to completely hide the navbar.
  let navbar_visible = toggle(true)
  setContext("navbar_visible", navbar_visible) // allow any children to toggle

  // this is for mobile devices, with a collapsible navigation bar
  const navbar_burger_active = toggle(true)

  if(ClientDefaults.sentry_dsn)
    lazy_load_sentry(ClientDefaults.sentry_dsn)

//  const navbar_online_labels = { offline: "Headless", connecting: "Connecting...", online: "Connected", failed: "Connection failure" }
//  let navbar_online_label = ""
//  $: navbar_online_label = navbar_online_labels[$endpoint_status]
  const navbar_show_endpoint_widget = toggle(false)


  /**
   * This is the Svelte-flaveoured HybridController global app singleton.
   * It is not a store but a collection of many stores (@see Syncable<T> for
   * details).
   **/
  const hc = new SvelteHybridController(ClientDefaults.endpoint_url)

  // expose to global window for fabulous debugging in browser console
  window.hc = hc
  window.get = get // svelte store get

  // expose to all child components
  setContext("hc", hc)

  // aliasing neccessary for svelte reactivity
  const endpoint = hc.endpoint
  const endpoint_status = hc.endpoint_status

  // debugging
  hc.endpoint.subscribe((val) => console.info("hc.endpoint = ", val))
  hc.endpoint_status.subscribe((val) => console.info("hc.endpoint_status = ", val))
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
      class:is-active={!$navbar_burger_active}
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
      <div class="navbar-item">
        {#if !$navbar_show_endpoint_widget}
        <a role="button" on:click={navbar_show_endpoint_widget.toggle} class="navbar-link">
          <span class="icon">
            {#if $endpoint_status == "offline"}<FontAwesomeIcon icon={faLinkSlash} />
            {:else if $endpoint_status == "connecting"}<FontAwesomeIcon icon={faLink} fade />
            {:else if $endpoint_status == "online"}<FontAwesomeIcon icon={faLink} />
            {:else if $endpoint_status == "failed"}<FontAwesomeIcon icon={faLinkSlash} style={{color:"red"}} />
            {/if}
          </span>
          <span>{{ offline: "Headless", connecting: "Connecting...", online: "Connected", failed: "Connection failure" }[$endpoint_status]}</span>
        </a>
        {:else}
        <Endpoint/>
        &nbsp;
        <button class="button" on:click={navbar_show_endpoint_widget.toggle}>Close</button>
        {/if}
      </div>
      <div class="navbar-item">
        <a class="navbar-item" on:click={info_modal_open.toggle}>About</a>
      </div>
      <!--
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
          {#if $endpoint_status == "online"}
          <a class="navbar-item">
            Login
          </a>
          <hr class="navbar-divider">
          {/if}
          <a class="navbar-item" on:click={info_modal_open.toggle}>
            About this application
          </a>
        </div>
      -->
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