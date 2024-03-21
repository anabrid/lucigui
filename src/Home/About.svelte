<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->

<!--
 This component represents an "About" panel as a modal.
 It can be opened by other components by importing something like

    import { info_modal_open } from '@/lib/About.svelte'
    info_modal_open.toggle()  or
    <a on:click={info_modal_open.toggle}>open about panel</a>

-->
<script context="module">
  import { toggle } from "@/lib/utils";
  export const info_modal_open = toggle(false)
</script>

<script lang="ts">
  import * as tr from "svelte/transition";

  // Works but is... plain text.
  import { hostname } from "@/lib/utils";
  import type { ProgramConstants } from '@/lib/client_defaults';
  import type { SvelteHybridController } from "@/lucicon/svelte";
  import { getContext } from "svelte";

  const hc = getContext("hc") as SvelteHybridController
  const endpoint = hc.endpoint

  const client_defaults = getContext("client_defaults") as ProgramConstants

  let infos = {}
  $: infos = {
    Version: client_defaults.app_version, // todo, would be nice to have Gitlab links
    Commit: client_defaults.app_githash,
    Date: client_defaults.app_build_date,
    "Hosted on": hostname,
    "Default endpoint": client_defaults.endpoint || "Headless (no default endpoint)",
    "Current endpoint": $endpoint || "Not connected"
  }

</script>

<div class="modal is-active" id="about-the-app" transition:tr.fade>
    <div class="modal-background" on:click={info_modal_open.toggle}></div>
    <div class="modal-content">
      <div class="card">
        <!--
        <div class="card-image">
          <figure class="image is-128x128">
            <img src="Lucidac_vektor.svg" alt="Placeholder image">
          </figure>
        </div>
        -->
        <div class="card-content">
          <div class="media">
            <div class="media-left">
              <figure class="image is-96x96">
                <img src="anabrid-claim.svg" alt="Placeholder image">
              </figure>
            </div>
            <div class="media-content">
              <p class="title is-4">{client_defaults.app_name}</p>
              <div class="subtitle is-6">
                A web application for managing LUCIDACs and editing
                analog circuits.
              </div>
            </div>
          </div>
      
          <div class="content">
            <table class="table is-bordered is-striped is-narrow is-hoverable is-size-7">
              {#each Object.entries(infos) as [k,v]}
                <tr><th>{k}:</th><td>{v}</td></tr>
              {/each}
              </table>
        </div>
        </div><!--/card content-->
        <footer class="card-footer">
          <p class="card-footer-item">
            <span>
              Read <a href="#/help/readme">in-depth explanation</a>
            </span>
          </p>
          <p class="card-footer-item">
            <span>
              Open <a href="https://lab.analogparadigm.com/lucidac/software/lucidac-gui/-/issues">issue tracker</a>
            </span>
          </p>
        </footer>
        </div>
    </div>
    <button on:click={info_modal_open.toggle} class="modal-close is-large" aria-label="close"></button>
  </div>

<style>
  .modal-background {
    backdrop-filter: blur(3px)
  }
  .modal-content {
    box-shadow: 0 3px 30px 16px rgba(0,0,0,.5)
  }
</style>