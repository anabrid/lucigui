<script>
   import {fade} from 'svelte/transition'

   import MultiView from '../lib/MultiView.svelte'

   import { query } from '../lib/HybridController.js'
   const entities_promise = query("get_config")

   export const title = "Connectome"
</script>

<main in:fade="{{duration: 100}}">
    <h1>Analog Programming</h1>
    <p>Hier geht es um getting started und sowas.

    {#await entities_promise}
    <p>Loading entities...</p>
    {:then entities}
        <!-- cannot bind to awaited, therefore subblock; https://stackoverflow.com/a/76525573 -->
        <MultiView {entities} />
    {/await}
  
</main>