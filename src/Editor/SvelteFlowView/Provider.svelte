<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->

<!--
 SvelteFlow requires a global "wrapper" around the "main"
 element <SvelteFlow/> in order to work. Therfore this component
 is the right one to import in order to disentangle any parent
 component from svelteflow code and logic.

 The whole (sub-)component structure is only coupled to the remaining
 code by global stores provided by @/lib/HybridControllerStores.ts
-->
<script context="module" lang="ts">
  // delete me
    import { type ExportFormat } from './Store'
    export interface FlowViewCallback {
      export() : ExportFormat
      import(records : ExportFormat)
    }
</script>
<script lang="ts">
    import FlowView from '@/Editor/SvelteFlowView/Main.svelte';
    import { SvelteFlowProvider } from '@xyflow/svelte';

    export let view
 </script>
 
<SvelteFlowProvider>
    <FlowView bind:this={view} />
</SvelteFlowProvider>
