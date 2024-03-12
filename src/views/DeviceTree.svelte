<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
    import DeviceTreeNode from './DeviceTreeNode.svelte'

    import { config, onmount_fetch_config } from "@/lib/HybridControllerStores";
    onmount_fetch_config();
    
  </script>

  <div class="entities">
      <ul>
        <DeviceTreeNode k="DeviceTree" v={$config} />
      </ul>
  </div>
