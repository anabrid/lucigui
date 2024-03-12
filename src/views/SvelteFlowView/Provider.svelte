<!--
 SvelteFlow requires a global "wrapper" around the "main"
 element <SvelteFlow/> in order to work. Therfore this component
 is the right one to import in order to disentangle any parent
 component from svelteflow code and logic.

 The whole (sub-)component structure is only coupled to the remaining
 code by global stores provided by @/lib/HybridControllerStores.ts
-->
<script>
    import FlowView from '@/views/SvelteFlowView/Main.svelte';
    import { SvelteFlowProvider } from '@xyflow/svelte';
 </script>
 
<SvelteFlowProvider>
    <FlowView />
</SvelteFlowProvider>
