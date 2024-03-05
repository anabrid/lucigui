<script lang="ts">
    import { type LogicalComputingElementType } from './FlowViewStore.ts'

    const onDragStart = (event: DragEvent, nodeType: LogicalComputingElementType) => {
        if (!event.dataTransfer) {
            return null;
        }

        event.dataTransfer.setData("application/svelteflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };
</script>

<aside>
    <div class="label">You can drag these nodes to the pane below.</div>
    <div class="nodes-container">
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="input-node node"
            on:dragstart={(event) => onDragStart(event, "Int")}
            draggable={true}
        >
            Integrator
        </div>
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="default-node node"
            on:dragstart={(event) => onDragStart(event, "Mul")}
            draggable={true}
        >
            Multiplier
        </div>
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
        width: 50px;
    }
</style>
