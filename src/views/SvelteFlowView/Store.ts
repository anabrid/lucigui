// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

/**
 * @file Stores suitable for svelteflow, derived from the central stores.
 *
 */

import { type ElementName, AssignedElement, AssignedElementPort,
  type LogicalConnection, type IntState, type PotState, type CircuitFileFormat } from '@/HybridController/types'
import { range, next_free, tryOr, UniqueCounter } from "@/HybridController/utils"
import { SvelteHybridController } from '@/HybridController/svelte-stores'

import { type Writable } from 'svelte/store'
import { type Node, type Edge, type Viewport } from '@xyflow/svelte'

// 3rd party: https://www.npmjs.com/package/svelte-writable-derived
import { writableDerived, propertyStore } from 'svelte-writable-derived'

/**
 * These NodeData attributes are only relevant for the visualization,
 * i.e. SvelteFlowView-"internal" and not supposed to be promoted to
 * the HybridController functions.
 */
export type NodeDisplay = {
  /** Flipped/mirrored visualization, with right-to-left flow
   *  instead of left-to-right
   */
  rtl?: boolean
}

/**
 * Nodes represent compute elements, @see AssignedElement.
 * These are potentially unrouted or even virtual compute elements.
 * The @see ElementName and id are encoded in the Node id string.
 * The Node Data stores state variables for stateful elements
 * such as Int or Pot.
 */
export type NodeData = IntState | PotState | NodeDisplay | undefined
export type CircuitNode = Node<NodeData, "analog">

const default_position = { x: 0, y: 0 }

/**
 * Edges hold no information in the current incarnation of the code.
 * 
 * Edges may be mapped to a physical route.
 *
 * The following text is most likely @deprecated:
 *  
 * We use the edge handles to encode information about computing elements with
 * multiple inputs and/or outputs. The names directly map to the FlowViewNode names,
 * for instance the Mul computing element has targetHandles (=two inputs) "a" and "b".
 * All computing elements currently have only one output, so the sourceHandle is always
 * null.
 * 
 **/
export type EdgeData = {}
export type CircuitEdge = Edge<EdgeData>

let global_next_edge_counter = new UniqueCounter()

const default_svelte_new_edge = /xy-edge__(?<source>[^-]+)-(?<target>[^-]+)/

export class CircuitStore {
  nodes: CircuitNode[]
  edges: CircuitEdge[]

  constructor(nodes:CircuitNode[]=[], edges:CircuitEdge[]=[]) { this.nodes=nodes; this.edges=edges }

  static node2logical(c: CircuitNode): AssignedElement { return AssignedElement.fromString(c.id) }
  static logical2node (l: AssignedElement): CircuitNode { return {
    id: l.toString(),
    position: default_position,
    data: (l.state as NodeData) || {},
    type: "analog"
  }}

  /**
   * This collects the stateful data, if neccessary, from the
   * respective nodes.
   * 
   * Note: Can be speed up by looking up data only for stateful elements.
   */
  edge2logical(e: CircuitEdge) : LogicalConnection  {
    const r = default_svelte_new_edge.exec(e.id)
    let source : AssignedElementPort
    let target : AssignedElementPort
    if(r?.groups) {
      source = AssignedElementPort.fromStringWithPort(r.groups.source)
      target = AssignedElementPort.fromStringWithPort(r.groups.target)
    } else {
      source = AssignedElementPort.fromStringWithPort(e.source, e.sourceHandle)
      target = AssignedElementPort.fromStringWithPort(e.target, e.targetHandle)
    }
    const sourceId = source.toString()
    const targetId = target.toString()
    const sourceNode = this.nodes.find(n => n.id == sourceId)
    const targetNode = this.nodes.find(n => n.id == targetId)
    source.state = sourceNode?.data
    target.state = targetNode?.data
    return { source, target }
  }

  static logical2edge(l: LogicalConnection): CircuitEdge { return {
    //id: LogicalLane.any().toString(),
    id: global_next_edge_counter.next().toString(),
    source: l.source.toString(),
    target: l.target.toString(),
    sourceHandle: l.source.port,
    targetHandle: l.target.port,
  //  data: { weight: l.target.type().is_virtual ? "virtual" : l.coeff },
  //  type: "analog"
  }}

  /** Retrieves next free id in a list of nodes.
   * This will always return an id, even if it is bigger then the number of lanes/clanes,
   * as we argue in the logical compute element space which is of infinite size. */
  next_free_logical(typeName: ElementName): number {
    const occupied = this.nodes.map(CircuitStore.node2logical).filter(lc => lc.typeName == typeName).map(lc => lc.id)
    return next_free(occupied)
  }

  static fromRoutes(routes: LogicalConnection[], prev: CircuitStore): CircuitStore {
    console.log("lucidac2graph starting with ", routes);
    const prev_nodes = prev ? prev.nodes : [];
    try {
      // A Set of node ids, such as "Mul0"
      const existing_nodes = new Set(prev_nodes.map(n => n.id))
  
      const new_nodes = routes.flatMap((/*element*/lr, /*idx*/_lane) => {
          const source_str = lr.source.toString()
          const target_str = lr.target.toString()
          return [
            existing_nodes.has(source_str) ? undefined : CircuitStore.logical2node(lr.source),
            existing_nodes.has(target_str) || source_str == target_str ? undefined : CircuitStore.logical2node(lr.target)
          ]
        }).filter(k => k !== undefined) as CircuitNode[]

      //console.info("lucidac2graph success: ", ret_val)
      return new CircuitStore(
        prev_nodes.concat(new_nodes),
        routes.map((e) => this.logical2edge(e))
      )
    } catch (err) {
      console.error("lucidac2graph failure: ", err, routes, prev);
      throw err
    }
  }

  toRoutes() : LogicalConnection[] {
    // This is also called when dragging stuff.
    // Should probably debounce in order to reduce load
    const routes = this.edges.map((e) => this.edge2logical(e))
    //console.info("graph2lucidac:", graph, routes);
    return routes
  }
}

/** Basically spilled out by useSvelteFlow().toObject().
 * Note that { nodes, edges } is also the CircuitStore signature. */
export type ExportFormat = { nodes: CircuitNode[], edges: CircuitEdge[], viewport: Viewport }

export interface FlowCircuitFileFormat extends CircuitFileFormat {
  SvelteFlowView?: ExportFormat
}

/**
 * The svelteflow circuit store, storing edges and routes suitable for svelteflow.
 * It is derived from the LogicalRoute store and can write back thanks to the
 * mappings defined in this file.
 */
export const deriveCircuitFrom = (hc: SvelteHybridController) => 
  writableDerived<Writable<LogicalConnection[]>, CircuitStore>(
    /* base    */ hc.logical_routes,
    /* derive  */ (base, _set, update) => update(cur_derived => CircuitStore.fromRoutes(base, cur_derived)),
    /* reflect */ (reflecting) => reflecting.toRoutes(),
    /* initial */ new CircuitStore()
  )
