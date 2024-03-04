<script>
  import { writable } from "svelte/store";
  import {
    SvelteFlow,
    useSvelteFlow,
    MiniMap,
    Background,
    BackgroundVariant,
    Controls,
  } from "@xyflow/svelte";

  import "@xyflow/svelte/dist/style.css";

  import Sidebar from "./FlowViewSidebar.svelte";
  import AnalogNode from './FlowViewNode.svelte'

  import { routes2matrix } from './HybridController.ts'
  import { cluster, status, config, config_loaded, hc, onmount_fetch_config } from "./HybridControllerStores";

  export let cluster_config;

  const nodes = writable([
    /*
    { id: "M1_0", data: { label: "M1_0" }, position: { x: 0, y: 0 } },
    { id: "M1_1", data: { label: "M1_1" }, position: { x: 0, y: 100 } },
    */
  ]);

  const edges = writable([
    //{ id: "lane0", source: "M1_0", target: "M1_1", label: "lane0" },
  ]);

  // have to be declared in node as 'type':'analog'
  const nodeTypes = {
    analog: AnalogNode
  }

  const Mname = (clane) => (clane < 8 ? `I${clane}` : `M${clane - 8}`);
  const Mname2clane = (name) => {
    const nodeid_matches = name.match(/(I|M)(\d+)/)
    if(!nodeid_matches) {
      console.error("$nodes=",$nodes)
      throw Error(`Unknown node: ${name}`)
    }
    const [all, im, idx] = nodeid_matches;
    return (im == "M" ? 8 : 0) + Number(idx);
  };

  const unique = (items) => [...new Set(items)];
  const non_empty = (obj) => Object.keys(obj).length !== 0;
  const xrange = (N) => Array(N).keys() // iterator
  const range = (N) => [...xrange(N)] // array
  const single = (cand) => Array.isArray(cand) ? cand[0] : cand;

  function graph2lucidac(_nodes, _edges) {
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

  function lucidac2graph($cluster) {
    console.log("lucidac2graph starting with ", cluster_config);
    try {
      const existing_nodes = new Set($nodes.map((n) => n.data.clane));
      const position = { x: 0, y: 0 };

      const new_nodes = $cluster.c.filter((val) => val > 0)
        .flatMap((val, lane) => {
          const  uin_clane = $cluster.u[lane]
          const iout_clane = $cluster.i[lane]
          if(uin_clane==null || iout_clane==null) return undefined;
          const  uin = Mname(single(uin_clane))
          const iout = Mname(single(iout_clane))
          return [
            existing_nodes.has(uin)
              ? undefined
              : { id: uin, data: { clane: uin_clane, valid: true }, position, type: "analog" },
            existing_nodes.has(iout) || uin == iout
              ? undefined
              : { id: iout, data: { clane: iout_clane, valid: true }, position, type: "analog" },
          ];
        })
        .filter((k) => k !== undefined);
      //console.log("New nodes: ", new_nodes);

      $nodes = $nodes.concat(new_nodes);

      $edges = $cluster.c.filter((val) => val > 0).map((val, lane) => {
        if($cluster.u[lane]==null || $cluster.i[lane]==null) return undefined;
        const id = `lane${lane}`;
        return {
          id,
          label: id,
          data: { lane, coeff: $cluster.c[lane], valid: true },
          source: Mname(single($cluster.u[lane])),
          target: Mname(single($cluster.i[lane])),
          type: "smoothstep",
        };
      }).filter((k) => k !== undefined)
      console.log("lucidac2graph Completed with ", $nodes, $edges);
    } catch (err) {
      console.log("lucidac2graph: ", err, $cluster);
    }
  }

  // https://stackoverflow.com/a/72418699
  $: graph2lucidac($nodes, $edges);
  $: lucidac2graph($cluster);

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
    // type is "M" or "I"
    const type = event.dataTransfer.getData("application/svelteflow");

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // For next free Multiplier or Integrator
    const existing_nodes = $nodes.map((n) => n.data.clane);
    const free_nodes = range(15).filter((e) => !existing_nodes.includes(e));
    let clane = free_nodes.find((e) => Mname(e).includes(type));
    const valid = clane !== undefined
    const next_candidate_number = $nodes.filter(e => e.id.includes(type)).length + 1
    let id = valid ? Mname(clane) : `${type}${next_candidate_number}`
    /* Case: Need I8 and don't want to display it as M0 */
    /* This also won't fix the naming display, which needs to be more verbose */

    if(!valid) {
      console.error("on_drop: No free element found! In:", existing_nodes, free_nodes)
    }

    const newNode = {
      id,
      position,
      data: { clane, valid },
      origin: [0.5, 0.0],
      type: "analog"
    }; // satisfies Node;

    console.log("New node ", newNode);

    $nodes.push(newNode);
    $nodes = $nodes;
  };

  /* New connections: Assign real elements */
  const onConnect = (connection) => {
    // Manually drawn edge, need to rename it
    // Since edges are lanes, there are up to 32 edges in the graph, not taking into
    // account virtual elements.
    // Find next free lane
    /*
    const existing_edges = $edges.map((n) => n.data.lane);
    const free_edges = range(31).filter((e) => !existing_edges.includes(e));
    const valid = free_edges.length > 0
    */
    console.log("onConnect: starting")
    let lane = $cluster.c.findIndex(coeff => coeff == 0)
    const valid = lane !== -1

    // Cornercase: If no free edges left, need to indicate unrepresentable state
    if(!valid) lane = ($edges.length+1)

    // Have to lookup edge from connection :-(
    const eidx = $edges.findIndex(e => e.source == connection.source && e.target == connection.target
      && !e.id.match(/lane\d+/) /* try to restrict to find real new connection*/)

    if(eidx == undefined) {
      console.error("onConnect: Cannot find the edge", connection, $edges, $cluster)
    }

    $edges[eidx].id = `lane${lane}`
    $edges[eidx].label = `lane${lane}`
    $edges[eidx].data = { valid, lane }

    console.log("onConnect: Successfully updated", connection, eidx, $edges)

    $edges = $edges // enforce reactivity
  }
</script>

<main style="min-height: 500px; width: 900px">
  <SvelteFlow {nodes} {edges} {nodeTypes}
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
