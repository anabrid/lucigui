<script>
   import {fade} from 'svelte/transition'

   import MultiView from '../lib/MultiView.svelte'

   import BlockView from '../lib/BlockView.svelte'
   import DeviceTree from '../lib/DeviceTree.svelte'
   import FlowView from '../lib/FlowView.svelte';
   import DebugView from '../lib/DebugView.svelte';

   import { SvelteFlowProvider } from '@xyflow/svelte';

   import { routes, physical_routes } from '../lib/HybridControllerStores'
   import { edges, nodes, circuit } from '../lib/FlowViewStore.ts'

   let show_flow = true
   let show_matrix = false
   let show_code = false
   let show_tree = false

   let show_debug_graph = true
   let show_debug_logical = true
   let show_debug_physical = true

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
                    <button class="button" class:is-selected={show_debug_graph} on:click={()=>{show_debug_graph = !show_debug_graph}}>Debug Graph</button>
                    <button class="button" class:is-selected={show_debug_logical} on:click={()=>{show_debug_logical = !show_debug_logical}}>Logical</button>
                    <button class="button" class:is-selected={show_debug_physical} on:click={()=>{show_debug_physical = !show_debug_physical}}>Physical</button>
                </div>
            </div>
        </div>
    </nav>
   
    <div class="views">
            <!--
            <DeviceTree />
            -->

        {#if show_flow}
        <div class="flow">
            <SvelteFlowProvider>
                <FlowView />
            </SvelteFlowProvider>
        </div>
        {/if}

        {#if show_debug_graph}
        <div class="debug">
            <h2>Edges</h2>
            <DebugView bind:view={$edges} />
        </div>
        <div class="debug">
            <h2>Nodes</h2>
            <DebugView bind:view={$nodes} />
        </div>
        {/if}

        {#if show_debug_logical}
        <div class="debug">
            <h2>Logical Routes</h2>
            <DebugView bind:view={$routes} />
        </div>
        {/if}

        {#if show_debug_physical}
        <div class="debug">
            <h2>Physical Routes</h2>
            <DebugView view={$physical_routes} />
        </div>
        {/if}
    </div><!--/views-->
</main>

<style lang="scss">
    .views {
        display: flex;
        flex-direction: row;

        .flow {
            flex-grow: 2;
        }

        h2 {
            text-align: center;
            padding: 0 1em;
            font-weight: bold;
        }

        &>div:not(:last-child) {
            border-right: 1px solid #000;
        }
    }

    :global(pre) {
        padding: 0;
        max-width: 20em;
        overflow: scroll;
    }
</style>