import { type Route, LogicalComputeElement, LogicalLane, type LogicalRoute, UniqueCounter } from './HybridController.ts'
import { config, routes } from './HybridControllerStores.ts'

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

const node2logical = (c: CircuitNode) : LogicalComputeElement => LogicalComputeElement.fromString(c.id)
const logical2node = (l: LogicalComputeElement) : CircuitNode => ({
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
export type CircuitEdge = Edge<EdgeData>

let global_next_edge_counter = new UniqueCounter()

const edge2logical = (e: CircuitEdge) : LogicalRoute => ({
  source: LogicalComputeElement.fromString(e.source),
  target: LogicalComputeElement.fromString(e.target),
  source_output: e.sourceHandle,
  target_input: e.targetHandle,
  coeff: e.data.weight,
  lane: LogicalLane.fromString(e.id)
})
const logical2edge = (l: LogicalRoute) : CircuitEdge => ({
  id: LogicalLane.any().toString(),
  source: l.source.toString(),
  target: l.target.toString(),
  sourceHandle: l.source_output,
  targetHandle: l.target_input,
  data: { weight: l.coeff }
})

type CircuitStore = { nodes: CircuitNode[], edges: CircuitEdge[] }

export function lucidac2graph(routes: LogicalRoute[], prev: CircuitStore) : CircuitStore {
  console.log("lucidac2graph starting with ", routes);
  try {
    // A Set of node ids, such as "Mul0"
    const existing_nodes = new Set(prev.nodes.map(n => n.id))

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
      nodes: prev.nodes.concat(new_nodes),
      edges: routes.map(logical2edge)
    }
    console.info("lucidac2graph success: ", ret_val)
    return ret_val
  } catch (err) {
    console.error("lucidac2graph: ", err, routes, prev);
    throw err
  }
}

////////////////////////// WORK UNTIL HERE //////////////////////////////

function graph2lucidac(graph: CircuitStore) : Route[] {
  // This is also called when dragging stuff.
  // Should probably debounce in order to reduce load

  console.log("graph2lucidac starting with ", $nodes, $edges);
  const routes = $edges.map((e, edge_idx) => {
    let laneid_matches = e.id.match(/lane(\d+)/);
    if (!laneid_matches) {
      console.error("edge=", e)
      throw Error(`Unknown edge id: ${e.id}`)
    }

    // The 4-tuple defining a route
    const lane = Number(laneid_matches[1]);
    const uin = Mname2clane(e.source);
    const cval = 1.0;
    const iout = Mname2clane(e.target);

    return { lane, uin, cval, iout };
  });

  $cluster = routes2matrix(routes)
  console.log("Routes, Matrix: ", routes, $cluster);
}

export const circuit = writableDerived<Writable<Route[]>, CircuitStore>(
  routes,
  (base, set, update) => update(cur_derived => lucidac2graph(base, cur_derived)),
  graph2lucidac
)