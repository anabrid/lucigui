<script>
  import Status from '../lib/Status.svelte'
  import DeviceTree from '../lib/DeviceTree.svelte'
  import {fade} from 'svelte/transition'

  // export const title = "Home" // leave empty
</script>
<main in:fade="{{duration: 100}}">
    <h1>LUCIDAC Home</h1>

    <h2>Status</h2>
    <Status/>

    <h2>Device Tree</h2>
    <DeviceTree/>

</main>