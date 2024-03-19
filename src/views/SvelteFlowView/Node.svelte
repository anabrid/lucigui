<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
    import { Handle, Position, type NodeProps } from "@xyflow/svelte";

    import { AssignedElement } from "@/HybridController/programming";

    type $$Props = NodeProps;

    export let id: $$Props["id"];
    //export let data: $$Props["data"];
    export let isConnectable: $$Props["isConnectable"];
    export let selected: $$Props["selected"]

    const logicalElement = AssignedElement.fromString(id);
    const type = logicalElement.type()

    // TODO: Mark invalid elements, ie. not mappable on physical elements
    const valid = true
</script>

<div class="node-container" class:invalid={!valid} class:selected={selected}>
    <div class="node">
        <i>{ type.name }</i>
        <sub>
            {#if selected}
                <input bind:value={logicalElement.id}>
            {:else}
                {logicalElement.id}
            {/if}
        </sub>
    </div>

    {#if type.inputs.length == 2}
    <Handle
        type="target"
        position={Position.Left}
        id="a"
        style="top: 10px"
        {isConnectable}
    />
    <Handle
        type="target"
        position={Position.Left}
        id="b"
        style="bottom: 10px"
        {isConnectable}
    />
    {:else if type.inputs.length == 1}
    <Handle
        type="target"
        position={Position.Left}
        id="in"
        style="top: 15px"
        {isConnectable}
    />
    {/if}
    <!-- we currently only deal with known compute elements -->

    {#if type.outputs.length == 1 }
    <Handle type="source" position={Position.Right} id="out" {isConnectable} />
    {/if}
</div>

<style type="scss">
    .node-container {
        padding: .4em;
        border-radius: 3px;
        text-align: center;
        border: 1px solid #1a192b;
        background-color: white;

        &.selected {
            border-color: blue;
        }
    }

    input {
        width:2em
    }

    .invalid {
        color: red;
        border-color: red;
    }
</style>
