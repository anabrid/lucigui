<script>
  export let k, v;

  const hasChildren = (v) => typeof v === 'object' && v !== null
</script>

  <li>
    {#if hasChildren(v)}
      <b>{k}</b>
      <ul>
      {#each Object.entries(v) as [k,v] }
       <svelte:self {k} {v} />
      {/each}
      </ul>
    {:else}
      <b>{k}</b> {v}
    {/if}
  </li>

