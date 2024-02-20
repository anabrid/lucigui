<script lang="ts">
    import { Handle, Position, type NodeProps } from "@xyflow/svelte";

    import { Mname } from "./HybridController";

    type $$Propos = NodeProps;

    export let id: $$Props["id"];
    id;
    export let data: $$Propos["data"];
    export let isConnectable: $$Props["isConnectable"];

    const { clane, valid } = data;
</script>

<div class="node-container" class:invalid={!valid}>
    <div class="node">
        {@html Mname(clane)}
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
