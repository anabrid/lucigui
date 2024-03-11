<script>
   import BlockView from '../lib/BlockView.svelte'
   import DeviceTree from '../lib/DeviceTree.svelte'
   import DebugView from './DebugView.svelte';
   import FlowView from './FlowView.svelte';

   // required for ... well just required.
   import { SvelteFlowProvider } from '@xyflow/svelte';

   import { routes, physical_routes } from './HybridControllerStores'
   import { edges, nodes, circuit } from './FlowViewStore.ts'
</script>

<table><tr><td>
    <!--
    <DeviceTree />
    -->

    <SvelteFlowProvider>
        <FlowView />
    </SvelteFlowProvider>

</td><td>
    <!-- <BlockView /> -->
    <h2>Edges</h2>
    <DebugView bind:view={$edges} />
</td><td>
    <h2>Nodes</h2>
    <DebugView bind:view={$nodes} />
</td><td>
    <h2>Logical Routes</h2>
    <DebugView bind:view={$routes} />
</td><td>
    <h2>Physical Routes</h2>
    <DebugView view={$physical_routes} />
</td></tr></table>