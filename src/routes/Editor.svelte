<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
   import {fade} from 'svelte/transition'
   import { toggle } from '@/lib/utils';

   import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
   import { faFileExport, faFileImport, faExpand, faDownload, faUpload, faCircleNodes, faTableCellsLarge } from '@fortawesome/free-solid-svg-icons'

   import BlockView from '@/views/BlockView.svelte'
   import DeviceTree from '@/views/DeviceTree.svelte'
   import FlowView from '@/views/SvelteFlowView/Provider.svelte';
   import DebugView from '@/views/DebugView.svelte';
   import ExampleCircuits from '@/views/ExampleCircuits.svelte';

   import { logical_routes, physical_routes } from '@/HybridController/svelte-stores'
   import { edges, nodes, circuit } from '@/views/SvelteFlowView/Store'

   let show_examples = toggle(true)

   let show_flow = toggle(true)
   let show_matrix = toggle(true)
   let show_code = toggle(false)
   let show_tree = toggle(false)

   let show_debug_graph = toggle(true)
   let show_debug_logical = toggle(true)
   let show_debug_physical = toggle(true)

   let compact_matrix = false
   $: console.log("Editor Compact: ", compact_matrix==true, compact_matrix==false)


</script>

<main in:fade={{ duration: 100 }} class="container is-fluid" style="margin-top: 1.5rem">

    <div class="block">
        <h1 class="title">Analog Programming</h1>
        <p class="subtitle">
            View and edit the programmable analog circuit.
        </p>
    </div>

    <nav class="level block">
        <div class="level-left">
            <div class="level-item">
                <div class="buttons has-addons">
                    <button class="button is-primary">
                        <!-- Write configuration to Lucidac ("upload") -->
                        <span class="icon"><FontAwesomeIcon icon={faDownload} /></span>
                        <span>Configure</span>
                    </button>
                    <button class="button">
                        <!-- Read new configuration from Lucidac--> 
                        <span class="icon"><FontAwesomeIcon icon={faUpload} /></span>
                        <span>Readout</span>
                    </button>
                </div>
            </div>
            <div class="level-item">
                <div class="buttons">
                    <button class="button" class:is-selected={$show_examples} on:click={show_examples.toggle}>
                        <span>Examples</span>
                    </button>
                </div>
            </div>
            <div class="level-item">
                <div class="buttons has-addons">
                    <button class="button" class:is-selected={$show_flow} on:click={show_flow.toggle}>
                        <span class="icon"><FontAwesomeIcon icon={faCircleNodes} /></span>
                        <span>Flow</span>
                    </button>
                    <button class="button" class:is-selected={$show_matrix} on:click={show_matrix.toggle}>
                        <span class="icon"><FontAwesomeIcon icon={faTableCellsLarge} /></span>
                        <span>Matrix</span>
                    </button>
                    <button class="button" class:is-selected={$show_code} on:click={show_code.toggle}>Code</button>
                    <button class="button" class:is-selected={$show_tree} on:click={show_tree.toggle}>Tree</button>
                </div>
            </div>
            <div class="level-item">
                <div class="buttons has-addons">
                    <button class="button" class:is-selected={$show_debug_graph} on:click={show_debug_graph.toggle}>Debug Graph</button>
                    <button class="button" class:is-selected={$show_debug_logical} on:click={show_debug_logical.toggle}>Logical</button>
                    <button class="button" class:is-selected={$show_debug_physical} on:click={show_debug_physical.toggle}>Physical</button>
                </div>
            </div>
        </div>
        <div class="level-right">
            <div class="level-item">
                <div class="buttons has-addons">
                    <button class="button">
                        <span class="icon"><FontAwesomeIcon icon={faFileExport} /></span>
                        <!--Save-->
                    </button>
                    <button class="button">
                        <span class="icon"><FontAwesomeIcon icon={faFileImport} /></span>
                    </button>
                    <button class="button">
                        <span class="icon"><FontAwesomeIcon icon={faExpand} /></span>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class="views">
            <!--
            <DeviceTree />
            -->

        {#if $show_examples}
        <div class="examples">
            <ExampleCircuits/>
        </div>
        {/if}

        {#if $show_flow}
        <div class="flow">
            <FlowView/>
        </div>
        {/if}

        {#if $show_matrix}
        <div class="matrix">
            <h2>Physical Matrix
                (<label for="compact-physical-matrix">
                    <input id="compact-physical-matrix" type="checkbox" bind:checked={compact_matrix}>
                Compact</label>)
            </h2>
            <BlockView bind:compact={compact_matrix} />
        </div>
        {/if}

        {#if $show_debug_graph}
        <div class="debug">
            <h2>Edges</h2>
            <DebugView bind:view={$edges} />
        </div>
        <div class="debug">
            <h2>Nodes</h2>
            <DebugView bind:view={$nodes} />
        </div>
        {/if}

        {#if $show_debug_logical}
        <div class="debug">
            <h2>Logical Routes</h2>
            <DebugView bind:view={$logical_routes} />
        </div>
        {/if}

        {#if $show_debug_physical}
        <div class="debug">
            <h2>Physical Routes</h2>
            <DebugView view={$physical_routes} />
        </div>
        {/if}
    </div><!--/views-->
</main>

<style lang="scss">
    .level .button {
        margin-bottom: 0 !important
    }

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