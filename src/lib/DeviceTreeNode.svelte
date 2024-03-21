<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
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

<!--
  <style lang="scss">
    ul, b {
      display: flex;
      flex-direction: column;
    }

  </style>
-->