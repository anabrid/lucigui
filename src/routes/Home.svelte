<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
  import Status from '@/lib/Status.svelte'
  import {fade} from 'svelte/transition'

  import { endpoint, endpoint_reachable } from '../lib/HybridControllerStores'
  import { hostname, globals } from '@/lib/utils';

  import About, { info_modal_open } from "@/lib/About.svelte"

</script>
<main in:fade="{{duration: 100}}">

    <div class="tile is-ancestor">
      <div class="tile is-parent is-vertical">
        <div class="tile is-child box">
          {#if globals.headless_build}
          <h1 class="title">A GUI to any LUCIDAC</h1>
          <h2 class="subtitle">This is {globals.application_name_and_version}</h2>

          <p>This web application allows you to configure and control
            suitable LUCIDACs which have a <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">CORS</a> setting
            that allows access from
            <tt>{hostname}</tt>.
          </p>
          {:else}
          <h1 class="title">A GUI to your LUCIDAC</h1>
          <h2 class="subtitle">This is {globals.application_name_and_version}</h2>

          <p>This web application allows to configure your LUCIDAC.</p>
          {/if}
          <div class="content">


          <p>The application also works without access to a real LUCIDAC. In this case,
            the <a href="#/editor">Graphical Circuit Editor</a> is of most interest.
          </p>

          <p>The LUCIDAC connection endpoint is currently set to: {$endpoint}</p>

            {#if $endpoint_reachable == "online" }
            <p>Connected.</p>
            <Status/>
            {:else if $endpoint_reachable == "connecting"}
            <p>Connecting...</p>
            {:else if $endpoint_reachable == "offline" }
            <p>Offline</p>
            {:else }<!-- failed -->
            <p>Connection Failed. Please inspect error log.
              Most likely host is down, not available in your network or
              does not accept <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">CORS</a>.
            </p>
            {/if}
          
          </div>
        </div>
        <div class="tile is-child box">
          <h2 class="title">On using this app</h2>
          <h3 class="subtitle">Readme for first time users</h3>
          <div class="content">
            <p>Please note that this application is in early development (you are in fact
              using version {globals.application_name_and_version}). You are very much invited
              to test out what is already possible and report problems, expectations, inconsistencies
              bugs, etc in form of a <a href="https://lab.analogparadigm.com/lucidac/software/lucidac-gui/-/issues/new">new ticket</a>
              on our <a href="https://lab.analogparadigm.com/lucidac/software/lucidac-gui/-/issues">bug tracker</a>.
              You can also submit a
              <a href="mailto:gitlab+lucidac-software-lucidac-gui-257-d1ykn0opqs6ae6xzq8v71ibwa-issue@anabrid.dev">new ticket by mail</a>.
            </p>
            <p>
              To simplify user reports even further, we use the
              Application Perfromance Monitoring & Error Tracking Software
              <a href="https://sentry.io/">sentry</a>. This allows you to report a bug
              even easier by clicking the <em>report a bug</em> button in the lower right,
              which will automatically also include a screenshot and internal debugging details.
              A few comments about sentry:
            </p>
            <ul>
              <li>Sentry may be blocked by your adblocker because it can also be used for tracking users (which we don't do).
                  Consider disabling your adblocker for this page.</li>
              <li>Sentry is known not to work too well with Firefox (it silently ignores your bug reports).
                  Consider using Chrome or similar browsers (Edge, Safari).
              </li>
              <li>We will provide an opt-in/opt-out for sentry performance monitoring in the future to comply with
                  GDPR. Currently the software is in development. We probably also will get rid of sentry in favour
                  of another solution.
              </li>
            </ul>
            <p>This application is open source. The code is hosted at
              <a href="https://lab.analogparadigm.com/lucidac/software/lucidac-gui">gitlab: lucidac/software/lucidac-gui</a>.
              You may also consider to have a look at the <a on:click={info_modal_open.toggle}>project README file</a> for further details.
              The project was initiated by Sven in Feb/March 2024.
            </p>
          </div>
        </div>
      </div>
      <div class="tile is-child box">
        <img src="Lucidac_vektor.svg" style="width:100%" alt="Lucidac vector illustration">
      </div>
    </div>




</main>