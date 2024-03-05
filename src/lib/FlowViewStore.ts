import { type PhysicalRoute, LogicalComputeElement, LogicalLane,
  type LogicalRoute, UniqueCounter, type LogicalComputingElementType,
  range, next_free, tryOr } from './HybridController.ts'
import { config, routes } from './HybridControllerStores.ts'

import { type Writable } from 'svelte/store'
import svelteflow from '@xyflow/svelte'


// 3rd party: https://www.npmjs.com/package/svelte-writable-derived
import { writableDerived, propertyStore } from 'svelte-writable-derived'

/**
 * Nodes represent LogicalComputeElements, i.e. unrouted computing elements.
 * The information of the LogicalComputeElement is encoded in the Node id
 * string. This way, no aux data is required and thus NodeData={}.
 */
export type NodeData = null
export type CircuitNode = svelteflow.Node<NodeData, "analog">

const default_position = { x: 0, y: 0 }

export const node2logical = (c: CircuitNode): LogicalComputeElement => LogicalComputeElement.fromString(c.id)
export const logical2node = (l: LogicalComputeElement): CircuitNode => ({
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
  weight: number ///< Coefficient within the C block, float range [-20, +20]

  // this is encoded in the id:
  //lane: number, ///< Lane within the C block, int range [0..31]
}
export type CircuitEdge = svelteflow.Edge<EdgeData>

let global_next_edge_counter = new UniqueCounter()

const edge2logical = (e: CircuitEdge): LogicalRoute => ({
  source: LogicalComputeElement.fromString(e.source),
  target: LogicalComputeElement.fromString(e.target),
  source_output: e.sourceHandle,
  target_input: e.targetHandle,
  coeff: e.data ? e.data.weight : undefined,
  lane: LogicalLane.fromString(e.id) ?? undefined
})

const logical2edge = (l: LogicalRoute): CircuitEdge => ({
  id: LogicalLane.any().toString(),
  source: l.source.toString(),
  target: l.target.toString(),
  sourceHandle: l.source_output,
  targetHandle: l.target_input,
  data: { weight: l.coeff },
  type: "analog"
})

type CircuitStore = { nodes: CircuitNode[], edges: CircuitEdge[] }

/// Retrieves next free id in a list of nodes.
/// This will always return an id, even if it is bigger then the number of clanes,
/// as we argue in the logical compute element space which is of infinite size.
export function next_free_logical_clane(nodes: CircuitNode[], type: LogicalComputingElementType): number {
  const occupied_clanes = nodes.map(node2logical)
    .filter(lc => lc.type == type)
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
      .flatMap((/*element*/logical_route, /*idx*/lane) => {
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
    console.info("lucidac2graph success: ", ret_val)
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
  console.info("graph2lucidac:", graph, routes);
  return routes
}

export const circuit = writableDerived<Writable<LogicalRoute[]>, CircuitStore>(
  /* base    */ routes,
  /* derive  */(base, set, update) => update(cur_derived => lucidac2graph(base, cur_derived)),
  /* reflect */ graph2lucidac,
  /* default */ null
)

// stores to be used by SvelteFlow
export const edges = propertyStore(circuit, "edges")
export const nodes = propertyStore(circuit, "nodes")

