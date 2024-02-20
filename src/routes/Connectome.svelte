<script>
   import {fade} from 'svelte/transition'

   import MultiView from '../lib/MultiView.svelte'

   export const title = "Connectome"
</script>

<main in:fade="{{duration: 100}}">
    <h1>Analog Programming</h1>
    <p>Hier geht es um getting started und sowas.

    <!-- cannot bind to awaited, therefore subblock; https://stackoverflow.com/a/76525573 -->
    <MultiView />
  
</main>