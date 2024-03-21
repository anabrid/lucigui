<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { slide, fade } from 'svelte/transition'

  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faNetworkWired } from '@fortawesome/free-solid-svg-icons'

  import { SvelteHybridController, permissiveLookup } from '@/HybridController/svelte'
  import { hostname, humanReadableTimeSpan, is_https } from '@/lib/utils';
  import type { GlobalConstants } from "@/lib/client_defaults";
  import Endpoint from "@/lib/Endpoint.svelte"
  import DebugView from '@/views/DebugView.svelte';

  const hc = getContext("hc") as SvelteHybridController
  const endpoint = hc.endpoint
  const endpoint_status = hc.endpoint_status
  const hc_status = hc.status.value
  const connected = derived(hc.endpoint_status, (status) => status == "online")
  const entities = hc.entities.value

  const client_defaults = getContext("client_defaults") as GlobalConstants

  // onMount(() => { hc.status.download() }) // needs guard against bool($endpoint), see below.

  let gettingStarted = false

  // Download status whenever endpoint changes (to non-null).
  $: $endpoint, $endpoint && hc.status.download()

  const stats = derived(hc.status.value, (status)=> ([
      {
        title: "Uptime",
        prop: ["time", "uptime_millis"],
        map: v => {
          if(v) {
            return humanReadableTimeSpan(new Date((new Date()).getTime() - v /* ms */))
          }
        }
      },
      {
        title: "Total OP time",
        prop: ["stats", "total_optime_ms"]
        // can use Intl.RelativeTimeFormat.formatToParts() to get sth like "15 minutes"
      },
      {
        title: "Firmware version",
        prop: ["dist", "FIRMWARE_VERSION"]
      },
      {
        title: "Firmware date",
        prop: ["dist", "FIRMWARE_DATE"]
      },
      {
        title: "Firmware sha256 short",
        prop: ["flashimage", "sha256sum"],
        map: v => v?.substring(0,8)
      }
    ].map(entry => {
      const map = entry?.map || (v=>v)
      entry.value = map(permissiveLookup(status, entry.prop))
      return entry
    })))

</script>

<main in:fade class="is-flex is-flex-direction-column">
  <section class="hero is-flex-grow-2" class:is-fullheight-with-navbar={!$connected} class:is-medium={$connected}><!-- style="flex-direction: row"> -->
    <div class="hero-body">
      <div class="columns" style="align-items: center">
        <div class="column is-half">
          <p class="title">
            Configure {!client_defaults.has_default_endpoint&&!$connected?"any":"your"} luci with ease
          </p>
          <div class="subtitle">
            {#if !client_defaults.has_default_endpoint}
            Program circuits for re-configurable analog-digital hybrid computers.

            <p class="buttons" style="margin-top: 1em">
              <button class="button is-primary" on:click={()=>gettingStarted=true} class:is-hidden={gettingStarted}>Getting Started</button>
              {#if gettingStarted}<Endpoint/> &nbsp;{/if}
              <a href="#/help" class="button is-secondary">Learn more</a>
            </p>
            {/if}
          </div>

          <div style="max-width: 70%">
              {#if $endpoint_status == "connecting"}
              <span class="icon-text" transition:fade>
                <span class="icon"><FontAwesomeIcon icon={faNetworkWired} beat /></span>
                <span>Connecting...</span>
              </span>
              {:else if $endpoint_status == "failed"}
              <div class="notification is-danger">
                <strong>Connecting to the LUCIDAC endpoint failed</strong>.
                {#if !client_defaults.has_default_endpoint}
                Here are a few possible reasons:
                <ul>
                  <li>Domain name not resolvable: Try IP address instead.</li>
                  <li>Malformed URL. Double check, it typically ends with <tt>/api</tt>.</li>
                  <li>Host is not reachable in your network. Try to ping it from a command line.</li>
                  <li>Host has not suitable <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">CORS</a>
                      settings, therefore the browser must not connect from <tt>{hostname}</tt>.
                      The only thing you can do is to try other instances of this application hosted
                      elsewhere or, most likely, change the settings of your LUCIDAC over some
                      other client or the Serial backup line.
                    </li>
                </ul>
                {:else}
                This can be because the LUCIDAC is busy serving other requests.
                You can try again to connect: <Endpoint show_only_action_button />
                {/if}
              </div>
              {:else if $endpoint_status == "online"}
                <p>You could name your LUCIDAC here...</p>
              {:else}<!-- offline -->
              {/if}

              {#if gettingStarted && $endpoint_status == "offline"}
              <div class="notification content" transition:slide>
                <button class="delete" on:click={()=>gettingStarted=false}></button>
                <p>This web application allows you to configure and control
                  suitable LUCIDACs which have a <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">CORS</a> setting
                  that allows access from anywhere or at least from <tt>{hostname}</tt>.
                  The application also works without access to a real
                  LUCIDAC. In this case, the <a href="#/editor">Graphical Circuit Editor</a>
                  is of most interest.
                </p>

                <p>If you want to push analog programs to a LUCIDAC, enter its web
                  endpoint URL in the form above.</p>
              </div>

                {#if true || is_https(hostname)}
                <div class="notification is-danger" transition:slide>
                  <p>
                    <strong>You may want to switch to a GUI version without SSL</strong>.
                    Typically, LUCIDAC endpoints are HTTP only. However, your GUI version is
                    hosted from HTTPS and it is not possible to connect to a HTTP endpoint
                    from a HTTP hosted site. Have a look at <a href="#/help/canonical">other
                    hosted versions of the lucidac-gui</a> known to this build.
                  </p>
                </div>
                {/if}
              {/if}



              <!--
                {#if $endpoint_status == "online" }
                Device is online
                {:else if $endpoint_status == "connecting"}
                  <span class="icon-text">
                    <span class="icon"><FontAwesomeIcon icon={faNetworkWired} beat /></span>
                    <span>Connecting...</span>
                  </span>
                {:else}
                {/if}
              -->
            </div>
        </div>
        <div class="column is-half">
          <img src="lucidac-3d-front2.png">
        </div>
      </div>
    </div>
  </section>
  
  {#if $endpoint_status == "online" && $hc_status}
  <section class="grid container is-fluid">
    {#each $stats as entry}
      <div class="cell">
        <h4 class="title is-4">{entry.title}</h4>
        <h4 class="subtitle is-4">{entry.value}</h4>
      </div>
    {/each}
    </section>

  <!-- include this if you want to inspect what is available -->
  <!--   <DebugView store={hc_status} /> -->
  {/if}

</main>

<style lang="scss">

.hero-image {
  vertical-align: middle;
  justify-content: right;
  align-items: center;
  display: flex;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  padding-left: 0 !important;
}


</style>