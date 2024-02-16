<script>
   import BlockView from '../lib/BlockView.svelte'
   import DeviceTree from '../lib/DeviceTree.svelte'
   import FlowView from './FlowView.svelte';

   // required for ... well just required.
   import { SvelteFlowProvider } from '@xyflow/svelte';

   export let entities;
</script>

<table><tr><td>
    <!--<DeviceTree bind:entities={entities} />-->
    <SvelteFlowProvider>
        <FlowView bind:cluster_config={entities.config} />
    </SvelteFlowProvider>
</td><td>
    <BlockView bind:cluster_config={entities.config} />
</td></tr></table>