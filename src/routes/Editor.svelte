<script>
   import {fade} from 'svelte/transition'

   import MultiView from '../lib/MultiView.svelte'

   import BlockView from '../lib/BlockView.svelte'
   import DeviceTree from '../lib/DeviceTree.svelte'
   import FlowView from '../lib/FlowView.svelte';

   let show_flow = true
   let show_matrix = false
   let show_code = false
   let show_tree = false

   const toggle = (v) => (() => {v = !v})

</script>

<main in:fade="{{duration: 100}}">

    <nav class="level">
        <div class="level-left">
            <div class="level-item">
                <h1 class="title">Analog Programming</h1>
            </div>
        </div>
        <div class="level-right">
            <div class="level-item">
                <div class="buttons has-addons">
                    <button class="button" class:is-selected={show_flow} on:click={()=>{show_flow = !show_flow}}>Flow</button>
                    <button class="button" class:is-selected={show_matrix} on:click={()=>{show_matrix = !show_matrix}}>Matrix</button>
                    <button class="button" class:is-selected={show_code} on:click={()=>{show_code = !show_code}}>Code</button>
                    <button class="button" class:is-selected={show_tree} on:click={()=>{show_tree = !show_tree}}>Tree</button>
                </div>
            </div>
        </div>
    </nav>

    <p>Hier geht es um getting started und sowas.

    <!-- cannot bind to awaited, therefore subblock; https://stackoverflow.com/a/76525573 -->
    <MultiView />
  
</main>