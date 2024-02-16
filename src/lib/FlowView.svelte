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

  const Mname = (clane) => (clane < 8 ? `I${clane}` : `M${clane - 8}`);
  const Mname2clane = (name) => {
    const [all, im, idx] = name.match(/(I|M)(\d+)/);
    return (im == "M" ? 8 : 0) + Number(idx);
  };

  const unique = (items) => [...new Set(items)];
  const non_empty = (obj) => Object.keys(obj).length !== 0;
  const xrange = (N) => Array(N).keys() // iterator
  const range = (N) => [...xrange(N)] // array

  function graph2lucidac(_nodes, _edges) {
    // This is also called when dragging stuff.
    // Should probably debounce in order to reduce load

    console.log("graph2lucidac starting with ", $nodes, $edges);
    const routes = $edges.map((e, edge_idx) => {
      let laneid_matches = e.id.match(/lane(\d+)/);
      if (!laneid_matches) {
        console.error("Unknown connection", e)
      }

      // The 4-tuple defining a route
      const lane = Number(laneid_matches[1]);
      const uin = Mname2clane(e.source);
      const cval = 1.0;
      const iout = Mname2clane(e.target);

      return { lane, uin, cval, iout };
    });

    console.log("Routes: ", routes);

    // classical Routes -> UCI-Block translation

    // TODO: Continue with the mapping in HybridController.js.

    // $cluster_config["/0"]["/U"] = range(32).map(lane => { const r=routes.find(r => r.lane == lane); return R===undefined?[]:r.uin; })
    // $cluster_config["/0"]["/I"] = range(16).map(clane => routes.filter(r => r.iout == clane).map(r => r.lane))
    // $cluster_config["/0"]["/C"] = range(32).map(lane => { routes.find(r => r.lane == lane).cval }))

  }
  function lucidac2graph(cluster_config) {
    console.log("lucidac2graph starting with ", cluster_config);
    try {
      const U = cluster_config["/0"]["/U"]["outputs"];
      const C = cluster_config["/0"]["/C"]["elements"];
      const I = cluster_config["/0"]["/I"]["outputs"];

      const existing_nodes = new Set($nodes.map((n) => n.id));
      const position = { x: 0, y: 0 };

      const new_nodes = C.filter((val) => val > 0)
        .flatMap((val, lane) => {
          const uin = Mname(U[lane]);
          const iout = Mname(I[lane]);
          return [
            existing_nodes.has(uin)
              ? undefined
              : { id: uin, data: { label: uin }, position },
            existing_nodes.has(iout) || uin == iout
              ? undefined
              : { id: iout, data: { label: iout }, position },
          ];
        })
        .filter((k) => k !== undefined);
      console.log("New nodes: ", new_nodes);

      $nodes = $nodes.concat(new_nodes);

      $edges = C.filter((val) => val > 0).map((val, lane) => {
        const id = `lane${lane}`;
        return {
          id,
          label: id,
          source: Mname(U[lane]),
          target: Mname(I[lane]),
          type: "smoothstep",
        };
      });
      console.log("Completed with ", $nodes, $edges);
    } catch (err) {
      console.log("lucidac2graph: ", err, cluster_config);
    }
  }
  // https://stackoverflow.com/a/72418699
  $: graph2lucidac($nodes, $edges);
  $: lucidac2graph(cluster_config);

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

    if (!event.dataTransfer) {
      return null;
    }

    const type = event.dataTransfer.getData("application/svelteflow");

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const existing_nodes = $nodes.map((n) => n.id);
    const all_Melements = Array.from({ length: 16 }, (v, i) => Mname(i));
    const free_nodes = all_Melements.filter((e) => !existing_nodes.includes(e));
    //debugger
    const id = free_nodes.find((e) => e.includes(type));

    console.log("Assigning new element id: ", id);

    const newNode = {
      id,
      position,
      data: { label: id },
      origin: [0.5, 0.0],
    }; // satisfies Node;

    console.log("New node ", newNode);

    $nodes.push(newNode);
    $nodes = $nodes;
  };

  /* New connections: Assign real elements */
  const onConnect = (connection) => {
    // Manually drawn edge, need to rename it
    const existing_edges = $edges.map((n) => n.id);
    const all_edges = Array.from({ length: 32 }, (v, i) => `lane${i}`);
    const free_edges = all_edges.filter((e) => !existing_edges.includes(e));
    // Cornercase: If no  free edges left, need to indicate unrepresentable state
    const new_laneid = free_edges[0]

    // Have to search for edge from connection :-(
    const eidx = $edges.findIndex(e => e.source == connection.source && e.target == connection.target
      && !e.id.match(/lane\d+/) /* try to restrict to find real new connection*/)

    $edges[eidx].id = new_laneid
    $edges[eidx].label = new_laneid
    $edges = $edges // enforce reactivity
  }
</script>

<main style="min-height: 500px; width: 900px">
  <SvelteFlow {nodes} {edges}
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
