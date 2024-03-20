<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
   import { getContext, setContext } from "svelte";
   import { slide, fade } from 'svelte/transition'
   import { toggle, saveJsonAsFile } from '@/lib/utils';

   import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
   import { faFileExport, faFileImport, faExpand, faDownload, faUpload, faCircleNodes, faTableCellsLarge } from '@fortawesome/free-solid-svg-icons'

   import BlockView from '@/views/BlockView.svelte'
   import DeviceTree from '@/views/DeviceTree.svelte'
   import FlowView, { type FlowViewCallback } from '@/views/SvelteFlowView/Provider.svelte';
   import DebugView from '@/views/DebugView.svelte';
   import ExampleCircuits from '@/views/ExampleCircuits.svelte';

   import { hc_circuit_avail, logical_routes, physical_routes, cluster_config } from '@/HybridController/svelte-stores'
   import { edges, nodes, circuit } from '@/views/SvelteFlowView/Store'

   let show_examples = toggle(true)

   let show_flow = toggle(true)
   let flow_callbacks : FlowViewCallback
   let show_matrix = toggle(true)
   let show_code = toggle(false)
   let show_tree = toggle(false)

   let show_debug_graph = toggle(false)
   let show_debug_logical = toggle(false)
   let show_debug_physical = toggle(false)
   let show_debug_cluster_config = toggle(false)

   let headless = false
   $: headless = $hc_circuit_avail != "set"

   let not_fullscreen = getContext("navbar_visible") // well, expanded at least. Don't mess with real fullscreen.

   // This is just a stub, TODO export with other methods.
   function fileExport() {
      let data = {}
      if($show_flow) {
        data["SvelteFlowView"] = flow_callbacks.export()
      }

      saveJsonAsFile("lucidac-config.json", data)
   }

   let import_files : FileList
   function fileImport(data) {
      if("SvelteFlowView" in data) {
        console.info("Loading SvelteFlowView data", data)
        if(!$show_flow) show_flow.toggle()
        flow_callbacks.import(data["SvelteFlowView"])
      }
   }
   $: if(import_files) {
        import_files[0].text().then(t => {
            try {
                fileImport(JSON.parse(t))
            } catch(e) {
                alert(`Could not read uploaded file because ${e}: ${JSON.stringify(e)}`)
            }
        }, e => alert(`Could not read uploaded file: ${JSON.stringify(e)}`))
        // console.log(import_files) // fileImport(import_files[0])
      }
    
    



</script>

<main in:fade class="container is-fluid flex-grow" style="margin-top: 1.5rem">

    {#if $not_fullscreen}
    <div transition:slide class="block">
        <h1 class="title">Analog Programming</h1>
        <p class="subtitle">
            View and edit the programmable analog circuit.
        </p>
    </div>
    {/if}

    <nav class="level block">
        <div class="level-left">
            <div class="level-item">
                <div class="buttons has-addons">
                    <button class="button is-primary" disabled={headless}>
                        <!-- Write configuration to Lucidac ("upload") -->
                        <span class="icon"><FontAwesomeIcon icon={faDownload} /></span>
                        <span>Configure</span>
                    </button>
                    <button class="button" disabled={headless}>
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
                    <button class="button" class:is-selected={$show_debug_cluster_config} on:click={show_debug_cluster_config.toggle}>Cluster</button>
                </div>
            </div>
        </div>
        <div class="level-right">
            <div class="level-item">
                <div class="buttons has-addons">
                    <button class="button" on:click={fileExport}>
                        <span class="icon"><FontAwesomeIcon icon={faFileExport} /></span>
                        <span>Export</span>
                    </button>
                    <button class="button" on:click={()=>document.getElementById("editor-file-uploader").click()}><!-- on:click={()=> fileImport()}> -->
                        <span class="icon"><FontAwesomeIcon icon={faFileImport} /></span>
                        <input id="editor-file-uploader" type="file" bind:files={import_files} accept="text/json, application/json, text/plain" style="display:none">
                        <span>Import</span>
                    </button>
                    <button class="button" class:is-selected={!$not_fullscreen} on:click={not_fullscreen.toggle}>
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
        <div class="examples" transition:slide={{ axis: 'x' }}>
            <ExampleCircuits load={fileImport} close={show_examples.toggle}/>
        </div>
        {/if}

        {#if $show_flow}
        <div class="flow" transition:slide={{ axis: 'x' }}>
            <FlowView bind:callbacks={flow_callbacks} />
        </div>
        {/if}

        {#if $show_matrix}
        <div class="matrix" transition:slide={{ axis: 'x' }}>
            <BlockView />
        </div>
        {/if}

        {#if $show_debug_graph}
        <div class="debug" transition:slide={{ axis: 'x' }}>
            <h2>Edges</h2>
            <DebugView bind:view={$edges} />
        </div>
        <div class="debug" transition:slide={{ axis: 'x' }}>
            <h2>Nodes</h2>
            <DebugView bind:view={$nodes} />
        </div>
        {/if}

        {#if $show_debug_logical}
        <div class="debug" transition:slide={{ axis: 'x' }}>
            <h2>Logical Routes</h2>
            <DebugView bind:view={$logical_routes} />
        </div>
        {/if}

        {#if $show_debug_physical}
        <div class="debug" transition:slide={{ axis: 'x' }}>
            <h2>Physical Routes</h2>
            <DebugView view={$physical_routes} />
        </div>
        {/if}

        {#if $show_debug_cluster_config}
        <div class="debug" transition:slide={{ axis: 'x' }}>
            <h2>UCI-Cluster</h2>
            <DebugView view={$cluster_config} />
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

        &>div:not(:last-child):not(.examples) {
            // border-right: 1px solid #000;
        }
    }

    :global(.views pre) {
        padding: 0;
        max-width: 25em;
        overflow: scroll;
        position: relative;
        box-shadow: -2px 0 16px rgba(0,0,0,0.05);
        border-left: 1px solid #aaa;
        font-size: 82%;
        line-height: 115%;
    }
</style>