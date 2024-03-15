<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
  import Status from '@/lib/Status.svelte'
  import {fade} from 'svelte/transition'
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faNetworkWired } from '@fortawesome/free-solid-svg-icons'
  import { hc, endpoint, endpoint_status, hc_status, hc_status_avail, entities } from '@/lib/HybridControllerStores'
  import { hostname, globals } from '@/lib/utils';
  import Endpoint from "@/lib/Endpoint.svelte"
  import DebugView from '@/views/DebugView.svelte';
  import { onMount } from 'svelte';

  onMount(() => { hc.status.download() })

  let gettingStarted = false
  let connected = false
  $: connected = $endpoint_status == "online"

  // Download status whenever endpoint changes (to non-null).
  $: $endpoint, $endpoint && hc.status.download()

</script>

<main in:fade="{{duration: 100}}">
  <section class="hero" class:is-fullheight-with-navbar={!connected} class:is-medium={connected}><!-- style="flex-direction: row"> -->
    <div class="hero-body">
      <div class="columns">
        <div class="column is-half">
          <p class="title">
            Configure {globals.headless_build&&!connected?"any":"your"} luci with ease
          </p>
          <div class="subtitle">
            {#if globals.headless_build}
            Program circuits for re-configurable analog-digital hybrid computers.

            <p class="buttons" style="margin-top: 1em">
              <button class="button is-primary" on:click={()=>gettingStarted=true} class:is-hidden={gettingStarted}>Getting Started</button>
              {#if gettingStarted}<Endpoint/> &nbsp;{/if}
              <a href="#/starting" class="button is-secondary">Learn more</a>
            </p>
            {/if}
          </div>

          <div style="max-width: 70%">
              {#if $endpoint_status == "connecting"}
              <span class="icon-text">
                <span class="icon"><FontAwesomeIcon icon={faNetworkWired} beat /></span>
                <span>Connecting...</span>
              </span>
              {:else if $endpoint_status == "failed"}
              <div class="notification is-danger">
                <strong>Connecting to the LUCIDAC endpoint failed</strong>.
                {#if globals.headless_build}
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
              {:else}<!-- offline -->
              {/if}

              {#if gettingStarted && $endpoint_status == "offline"}
              <div class="notification content">
                <!--<button class="delete"></button>-->
                <p>This web application allows you to configure and control
                  suitable LUCIDACs which have a <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">CORS</a> setting
                  that allows access from anywhere or at least from <tt>{hostname}</tt>.
                  The application also works without access to a real
                  LUCIDAC. In this case, the <a href="#/editor">Graphical Circuit Editor</a>
                  is of most interest.
                </p>

                <p>If you want to push analog programs to a LUCIDAC, enter its web
                  endpoint URL in the form above.
              </div>
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
  {#key $hc_status}
  <div class="tile is-ancestor">
    <div class="tile is-parent">
      <div class="tile is-child box content">
        <dl>
          <dt>Uptime</dt>
          <dd>{$hc_status.time.uptime_millis}</dd>

          <dt>Uptime as lookup</dt>
          <dd>{hc.status.lookup(["time", "uptime_millis"])}</dd>

          <dt>Total OP time (not yet existent)</dt>
          <dd>{hc.status.lookup(["stats","total_optime_ms"])}</dd>
        </dl>
      </div>
      <div class="tile is-child box content">
        <dl>
          <dt>Firmware version</dt>
          <dd>{$hc_status.dist.FIRMWARE_VERSION}</dd>
          <dt>Firmware date</dt>
          <dd>{$hc_status.dist.FIRMWARE_DATE}</dd>
          <dt>Flash image</dt>
          <dd>size: {$hc_status.flashimage.size}, sha256short: {$hc_status.flashimage.sha256sum.substring(0,8)}</dd>
        </dl>
      </div>
      <div class="tile is-child box">
        <DebugView view={$hc_status} />
      </div>
    </div>
  </div>
  {/key}
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