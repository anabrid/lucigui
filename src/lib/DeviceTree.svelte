<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
    import { getContext } from 'svelte';
    import DeviceTreeNode from './DeviceTreeNode.svelte'
    import type { SvelteHybridController } from '@/HybridController/svelte';

    const hc = getContext("hc") as SvelteHybridController
    const value = hc.config.value
    
  </script>

  <div class="entities">
      <ul>
        <DeviceTreeNode k="DeviceTree" v={$value} />
      </ul>
  </div>
