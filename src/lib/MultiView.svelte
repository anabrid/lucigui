<script>
   import BlockView from '../lib/BlockView.svelte'
   import DeviceTree from '../lib/DeviceTree.svelte'
   import FlowView from './FlowView.svelte';

   // required for ... well just required.
   import { SvelteFlowProvider } from '@xyflow/svelte';
</script>

<table><tr><td>
    <!--
    <DeviceTree />
    -->

    <SvelteFlowProvider>
        <FlowView />
    </SvelteFlowProvider>

</td><td>
    <BlockView />
</td></tr></table>