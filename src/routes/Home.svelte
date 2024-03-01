<script>
  import Status from '../lib/Status.svelte'
  import DeviceTree from '../lib/DeviceTree.svelte'
  import BlockView from '../lib/BlockView.svelte'
  import {fade} from 'svelte/transition'

  import { endpoint, endpoint_reachable } from '../lib/HybridControllerStore.ts'
</script>
<main in:fade="{{duration: 100}}">

    <div class="tile is-ancestor">
      <div class="tile is-child box">
        {#if globals.headless_build}
        <h1 class="title">A GUI to any LUCIDAC</h1>
        <h2 class="subtitle">This is {globals.application_name_and_version}</h2>

        <p>This web application allows you to configure and control
           suitable LUCIDACs which have a <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">CORS</a> setting
           that allows access from
           <tt>{window.location.protocol}//{window.location.hostname}:{window.location.port}</tt>.
        </p>
        {:else}
        <h1 class="title">A GUI to your LUCIDAC</h1>
        <h2 class="subtitle">This is {globals.application_name_and_version}</h2>

        <p>This web application allows to configure your LUCIDAC.</p>
        {/if}

        <p>The endpoint currently set is: {$endpoint}</p>

          {#if $endpoint_reachable == "online" }
          <p>Connected.</p>
          <Status/>
          {:else if $endpoint_reachable == "connecting"}
          <p>Connecting...</p>
          {:else if $endpoint_reachable == "offline" }
          <p>Offline</p>
          {:else }<!-- failed -->
          <p>Failed. Please inspect error log.
            Most likely host is down or does not accept CORS.
          </p>
          {/if}
      </div>
      <div class="tile is-child box">
        <img src="Lucidac_vektor.svg" style="width:100%" alt="Lucidac vector illustration">
      </div>
    </div>




</main>