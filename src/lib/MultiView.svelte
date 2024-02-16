<script>
   import BlockView from '../lib/BlockView.svelte'
   import DeviceTree from '../lib/DeviceTree.svelte'

   export let entities;
</script>

<table><tr><td>
    <DeviceTree bind:entities={entities} />
</td><td>
    <BlockView bind:cluster_config={entities.config} />
</td></tr></table>