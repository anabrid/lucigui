<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
    import {
      getBezierPath,
      getSmoothStepPath,
      BaseEdge,
      type EdgeProps,
      EdgeLabelRenderer,
      useEdges
    } from '@xyflow/svelte';

    import { type EdgeData } from './Store'
    import { LogicalLane } from '@/lib/HybridController'
    import writableDerived from 'svelte-writable-derived';
  
    type $$Props = EdgeProps;
  
    export let id: $$Props['id'];
    export let sourceX: $$Props['sourceX'];
    export let sourceY: $$Props['sourceY'];
    export let sourcePosition: $$Props['sourcePosition'];
    export let targetX: $$Props['targetX'];
    export let targetY: $$Props['targetY'];
    export let targetPosition: $$Props['targetPosition'];
    export let markerEnd: $$Props['markerEnd'] = undefined;
    export let style: $$Props['style'] = undefined;
    export let data: EdgeData = undefined;
    export let selected: $$Props["selected"]

    // either [path, labelX, labelY, offsetX, offsetY] = getSmoothStepPath
    // or [edgePath, labelX, labelY] = getBezierPath
    const getEdgePath = getSmoothStepPath

    $: path = getEdgePath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition
       });

    let old_id = null
    $: old_id=id; console.log("FlowViewEdge: My ID changed from->to ", old_id, id)
  
    const edges = useEdges(); // gives a store

    // a lot of effort to two-way-project a current edge data attribute out as a
    // store itself. Maybe there is a more svelte way of doing it...
    const weight = writableDerived(edges,
        base => {
            const edge = base.find(edge => edge.id == id)
            return edge ? edge.data.weight : undefined
            // undefined happens in case of being deleted.
        },
        (reflecting, base) => {
            if(reflecting == 0) { // coefficient == 0 means removing.
                return base.filter(edge => edge.id != id) // remove edge
            } else {
                const edge_idx = base.findIndex(edge => edge.id == id)
                base[edge_idx].data.weight = reflecting
                return base
            }
        }
    )


    const onEdgeClick = () => edges.update((eds) => eds.filter((edge) => edge.id !== id));
</script>

<BaseEdge path={path[0]} {markerEnd} {style} />
<EdgeLabelRenderer>
  <div
    class="edgeButtonContainer nodrag nopan"
    class:selected={selected}
    class:unselected={!selected}
    style:transform="translate(-50%, -50%) translate({path[1]}px,{path[2]}px)"
  >
  {#if $weight != "virtual"}
    <div class="heading">
      {id}
      <button class="edgeButton" on:click={onEdgeClick}> × </button>
    </div>
      {#if selected}
      <input type="number" bind:value={$weight} style="width:3em" />
      {:else}
      {$weight}
      {/if}
  {/if}
  </div>
</EdgeLabelRenderer>

<style lang="scss">
  .edgeButtonContainer {
    position: absolute;
    font-size: 12pt;

    &.unselected {
      border-radius: 100%;
      border: 1px solid rgb(193, 193, 193);
      background: white;
      width: 1.6em;
      height: 1.6em;
      text-align: center;

      .heading { display: none; }

    }

    &.selected {
      /* everything inside EdgeLabelRenderer has no pointer events by default */
      /* if you have an interactive element, set pointer-events: all */
      pointer-events: all;


      /* similar to node containers */
      padding: .4em;
      border-radius: 3px;
      border: 1px solid blue; // #1a192b;
      background-color: white;
    }
  }

  .edgeButton {
    width: 20px;
    height: 20px;
    background: #eee;
    border: 1px solid #fff;
    cursor: pointer;
    border-radius: 50%;
    font-size: 12px;
    line-height: 1;

    display: none;
  }

  .selected .edgeButton { display: inline-block; }

  .edgeButton:hover {
    box-shadow: 0 0 6px 2px rgba(0, 0, 0, 0.08);
  }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"] {
    -webkit-appearance: none;
    -moz-appearance: textfield;
    margin: 0;
  }
</style>
