<script>
  import Status from '../lib/Status.svelte'
  import DeviceTree from '../lib/DeviceTree.svelte'
  import BlockView from '../lib/BlockView.svelte'
  import {fade} from 'svelte/transition'

  import { endpoint, endpoint_reachable } from '../lib/HybridControllerStore.ts'
</script>
<main in:fade="{{duration: 100}}">
    <h1>LUCIDAC Home</h1>
    <p>This is software version {globals.lucidac_gui_version},
        working against endpoint: {$endpoint}

    <h2>Status</h2>
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

<!--
    <h2>Device Tree</h2>
    <DeviceTree/>


    <h2>Matrix View</h2>
    <BlockView />
-->
</main>