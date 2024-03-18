<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
    import { type ComputeElementName, ComputeElement } from '@/HybridController/programming'



    const onDragStart = (event: DragEvent, nodeTypeName: ComputeElementName) => {
        if (!event.dataTransfer) {
            return null;
        }

        event.dataTransfer.setData("application/svelteflow", nodeTypeName);
        event.dataTransfer.effectAllowed = "move";
    };
</script>

<aside>
    <!--<div class="label">You can drag these nodes to the pane below.</div>-->
    <div class="nodes-container">
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        {#each Object.entries(ComputeElement.registry) as [element_name, element] }
            <div
                class="input-node node"
                on:dragstart={(event) => onDragStart(event, element_name)}
                draggable={true}
            >
                {element_name}
            </div>
        {/each}
    </div>
</aside>

<style>
    aside {
        width: 100%;
        background: #f4f4f4;
        font-size: 12px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .label {
        margin: 1rem 0;
        font-size: 0.9rem;
    }

    .nodes-container {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .node {
        margin: 0.5rem;
        border: 1px solid #111;
        padding: 0.5rem 1rem;
        font-weight: 700;
        border-radius: 3px;
        cursor: grab;
        display: inline-block;
    }
</style>
