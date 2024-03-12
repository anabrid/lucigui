// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

/**
 * @file Stores suitable for svelteflow, derived from the central stores.
 *
 */

import { type ComputeElementName, AssignedComputeElement, AssignedComputeElementPort, LogicalLane,
  type LogicalRoute, UniqueCounter,
  range, next_free, tryOr } from '@/lib/HybridController'
import { config, logical_routes } from '@/lib/HybridControllerStores'

import { type Writable } from 'svelte/store'
import { type Node, type Edge } from '@xyflow/svelte'


// 3rd party: https://www.npmjs.com/package/svelte-writable-derived
import { writableDerived, propertyStore } from 'svelte-writable-derived'

/**
 * Nodes represent LogicalComputeElements, i.e. unrouted computing elements.
 * The information of the LogicalComputeElement is encoded in the Node id
 * string. This way, no aux data is required and thus NodeData={}.
 */
export type NodeData = null
export type CircuitNode = Node<NodeData, "analog">

const default_position = { x: 0, y: 0 }

export const node2logical = (c: CircuitNode): AssignedComputeElement => AssignedComputeElement.fromString(c.id)
export const logical2node = (l: AssignedComputeElement): CircuitNode => ({
  id: l.toString(),
  position: default_position,
  data: null,
  type: "analog"
})

/**
 * Edges hold all data neccessary to compute a LogicalRoute, i.e. an unrouted
 * connection between two LogicalComputeElements.
 * 
 * The edge ids encode lane ids which are used for mapping to the physical, routed
 * model, if applicable.
 * 
 * We use the edge handles to encode information about computing elements with
 * multiple inputs and/or outputs. The names directly map to the FlowViewNode names,
 * for instance the Mul computing element has targetHandles (=two inputs) "a" and "b".
 * All computing elements currently have only one output, so the sourceHandle is always
 * null.
 * 
 **/
export type EdgeData = {
  /**
   * Coefficient within the C block, float range [-20, +20].
   * 
   * The value "virtual" indicates that the edge is virtual and
   * no coefficient is possible, for instance when connecting to a
   * VirtualSink which is physically realized as M-Block output signal going
   * to U-Block and then leaving the U-C-I matrix without passing the C-Block.
   */
  weight: number|"virtual"

  // this is encoded in the id:
  //lane: number, ///< Lane within the C block, int range [0..31]
}
export type CircuitEdge = Edge<EdgeData>

let global_next_edge_counter = new UniqueCounter()

const default_svelte_new_edge = /xy-edge__(?<source>[^-]+)-(?<target>[^-]+)/

const edge2logical = (e: CircuitEdge): LogicalRoute => {
  const r = default_svelte_new_edge.exec(e.id)
  const coeff = e.data && e.data.weight != "virtual" ? e.data.weight : undefined
  if(r?.groups) {
    return {
      source: AssignedComputeElementPort.fromStringWithPort(r.groups.source),
      target: AssignedComputeElementPort.fromStringWithPort(r.groups.target),
      coeff,
      lane: undefined
    }
  }
  return {
    source: AssignedComputeElementPort.fromStringWithPort(e.source, e.sourceHandle),
    target: AssignedComputeElementPort.fromStringWithPort(e.target, e.targetHandle),
    coeff,
    lane: LogicalLane.fromString(e.id) ?? undefined
  }
}

const logical2edge = (l: LogicalRoute): CircuitEdge => ({
  id: LogicalLane.any().toString(),
  source: l.source.toString(),
  target: l.target.toString(),
  sourceHandle: l.source.port,
  targetHandle: l.target.port,
  data: { weight: l.target.is_virtual ? "virtual" : l.coeff },
  type: "analog"
})

type CircuitStore = { nodes: CircuitNode[], edges: CircuitEdge[] }

/// Retrieves next free id in a list of nodes.
/// This will always return an id, even if it is bigger then the number of clanes,
/// as we argue in the logical compute element space which is of infinite size.
export function next_free_logical_clane(nodes: CircuitNode[], typeName: ComputeElementName): number {
  const occupied_clanes = nodes.map(node2logical)
    .filter(lc => lc.typeName == typeName)
    .map(lc => lc.id)
  //return new LogicalComputeElement(type, /* id: */ next_free(occupied_clanes))
  return next_free(occupied_clanes)
}

export function next_free_logical_lane(edges: CircuitEdge[]) : number {
  const occupied_lanes = edges.map(edge2logical).filter(e => e.lane !== undefined).map(e => e.lane.id)
  //return { id: next_free(occupied_lanes), data: { weight: 1 } } as CircuitEdge
  return next_free(occupied_lanes)
}

export function lucidac2graph(routes: LogicalRoute[], prev: CircuitStore): CircuitStore {
  console.log("lucidac2graph starting with ", routes);
  const prev_nodes = prev ? prev.nodes : [];
  try {
    // A Set of node ids, such as "Mul0"
    const existing_nodes = new Set(prev_nodes.map(n => n.id))

    const new_nodes = routes.filter(r => r.coeff > 0)
      .flatMap((/*element*/logical_route, /*idx*/_lane) => {
        const source_str = logical_route.source.toString()
        const target_str = logical_route.target.toString()
        return [
          existing_nodes.has(source_str) ? undefined : logical2node(logical_route.source),
          existing_nodes.has(target_str) || source_str == target_str ? undefined : logical2node(logical_route.target)
        ]
      })
      .filter((k) => k !== undefined);

    const ret_val = {
      nodes: prev_nodes.concat(new_nodes),
      edges: routes.map(logical2edge)
    }
    //console.info("lucidac2graph success: ", ret_val)
    return ret_val
  } catch (err) {
    console.error("lucidac2graph failure: ", err, routes, prev);
    throw err
  }
}

function graph2lucidac(graph: CircuitStore): LogicalRoute[] {
  // This is also called when dragging stuff.
  // Should probably debounce in order to reduce load
  const routes = graph.edges.map(edge2logical)
  //console.info("graph2lucidac:", graph, routes);
  return routes
}


export default function writableDerived<S extends Stores, T>(
  origins: S,
  derive: (values: StoresValues<S>) => T,
  reflect: (reflecting: T, old: StoresValues<S>) => SetValues<S>,
  initial?: T
): Writable<T>;

export default function writableDerived<S extends Stores, T>(
  origins: S,
  derive: (values: StoresValues<S>, set: (value: T) => void, update: Updater<T>) => void,
  reflect: (reflecting: T, old: StoresValues<S>) => SetValues<S>,
  initial?: T
): Writable<T>;


/**
 * The svelteflow circuit store, storing edges and routes suitable for svelteflow.
 * It is derived from the LogicalRoute store and can write back thanks to the
 * mappings defined in this file.
 */
export const circuit = writableDerived<Writable<LogicalRoute[]>, CircuitStore>(
  /* base    */ logical_routes,
  /* derive  */ (base, _set, update) => update(cur_derived => lucidac2graph(base, cur_derived)),
  /* reflect */ graph2lucidac,
)

// stores to be used by SvelteFlow
export const edges = propertyStore(circuit, "edges")
export const nodes = propertyStore(circuit, "nodes")

