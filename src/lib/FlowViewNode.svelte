<script lang="ts">
    import { Handle, Position, type NodeProps } from "@xyflow/svelte";

    import { Mname, LogicalComputeElement } from "./HybridController";
    import { node2logical } from './FlowViewStore.ts'

    type $$Props = NodeProps;

    export let id: $$Props["id"];
    //export let data: $$Props["data"];
    export let isConnectable: $$Props["isConnectable"];

    const logicalElement = LogicalComputeElement.fromString(id);

    // TODO: Mark invalid elements, ie. not mappable on physical elements
    const valid = true
</script>

<div class="node-container" class:invalid={!valid}>
    <div class="node">
        <i>{ logicalElement.type }</i>
        <sub>{ logicalElement.id }</sub>
    </div>

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
    <Handle type="source" position={Position.Right} id="c" {isConnectable} />
</div>

<style>
    .node-container {
        padding: .4em;
        border-radius: 3px;
        text-align: center;
        width: 4em;
        border: 1px solid #1a192b;
        background-color: white;
    }

    .invalid {
        color: red;
        border-color: red;
    }
</style>
