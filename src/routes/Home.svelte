<script>
  import Status from '../lib/Status.svelte'
  import DeviceTree from '../lib/DeviceTree.svelte'
  import BlockView from '../lib/BlockView.svelte'
  import {fade} from 'svelte/transition'

  import { endpoint } from '../lib/HybridControllerStore.ts'

  // export const title = "Home" // leave empty

  //let matrix = BlockView.default_matrix

</script>
<main in:fade="{{duration: 100}}">
    <h1>LUCIDAC Home</h1>
    <p>This is software version {globals.lucidac_gui_version},
        working against endpoint: {$endpoint}

    <h2>Status</h2>
    <Status/>

    <h2>Device Tree</h2>
    <DeviceTree/>


    <h2>Matrix View</h2>
    <BlockView />
</main>