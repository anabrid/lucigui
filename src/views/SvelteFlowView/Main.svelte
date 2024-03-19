<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
  import { writable } from "svelte/store";
  import {
    SvelteFlow,
    useSvelteFlow,
    MiniMap,
    Background,
    BackgroundVariant,
    Controls,
  } from "@xyflow/svelte";

  const flow = useSvelteFlow()
  
  import "@xyflow/svelte/dist/style.css";

  import { type FlowViewCallback } from "./Provider.svelte";
  import Sidebar from "./Sidebar.svelte";
  import AnalogNode from './Node.svelte'
  // import PotiEdge from './Edge.svelte'

  import { routes2matrix, LogicalLane, type ElementName, AssignedElement } from '@/HybridController/programming'
  import { CircuitStore, type CircuitNode, circuit, edges, nodes, type ExportFormat } from './Store'

  // have to be declared in node as 'type':'analog'
  const nodeTypes = {
    analog: AnalogNode
  }

  const edgeTypes = {
//    analog: PotiEdge // for potentiometer
  }


  ////// TODO: General improvements
  //////    1) useNodesData() nutzen um weniger haeufige Syncs zu verursachen.

  /* Drag and Drop from the sidebar */
  const { screenToFlowPosition } = useSvelteFlow();
  const onDragOver = (event) => {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    if (!event.dataTransfer) return null;
    const typeName = event.dataTransfer.getData("application/svelteflow") as ElementName;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode = {
      id: new AssignedElement(typeName, $circuit.next_free_logical(typeName)).toString(),
      position,
      origin: [0.5, 0.0],
      type: "analog",
      data: undefined
    } satisfies CircuitNode;

    console.info("onDrop: New node ", newNode);

    $nodes.push(newNode);
    $nodes = $nodes;
  };

  /* New connections: Assign real elements */
  const onConnect = (connection) => {

    return; // No need for all that -- now we have potentiometer nodes.

    // Manually drawn edge, need to rename it
    // Since edges are lanes, there should be only up to 32 edges in the graph, not taking into
    // account virtual elements. However, in logical language, there are unlimited amount of edges.
    
    console.log("onConnect: starting")

    // Weird API: Have to lookup edge from connection :-(
    const eidx = $edges.findIndex(e => e.source == connection.source && e.target == connection.target
      && !e.id.match(/lane\d+/) /* try to restrict to find real new connection*/)

    if(eidx == undefined) {
      console.error("onConnect: Cannot find the edge", connection, $edges)
      throw new Error("onConnect: Cannot find the edge")
    }

    const target_is_virtual = AssignedElement.fromString($edges[eidx].target).type().is_virtual

    // Find next free lane
    const new_lane = next_free_logical_lane($edges)
    $edges[eidx].id = new LogicalLane(new_lane).toString()
    $edges[eidx].label = `${$edges[eidx].id} (connected)` // Currently only debugging
    $edges[eidx].data ||= { weight: target_is_virtual ? "virtual" : 1.0 }
    $edges[eidx].type = "analog"

    console.info("onConnect: Successfully updated", connection, eidx, $edges)

    $edges = $edges // enforce reactivity
  }

  export let callbacks : FlowViewCallback
  callbacks = new class implements FlowViewCallback {
    export() { return flow.toObject() }
    import(records:ExportFormat) {
      if(!("edges" in records && "nodes" in records))
        throw Error("Cannot import FlowView: Missing edges and/or nodes")
      $nodes = records.nodes
      $edges = records.edges
      flow.setViewport(records.viewport)
    }
  }
</script>

<main style="height: 100%; min-height: 300px; min-width: 500px">
  <SvelteFlow {nodes} {nodeTypes} {edges} {edgeTypes}
    fitView 
    onconnect={onConnect}
    on:dragover={onDragOver} on:drop={onDrop}
  >
    <Controls />
    <Background variant={BackgroundVariant.Dots} />
    <MiniMap />
  </SvelteFlow>
  <Sidebar />
</main>

<style>
  main {
    height: 100vh;
    display: flex;
    flex-direction: column-reverse;
  }
</style>
