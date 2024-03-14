<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
    import DeviceTreeNode from './DeviceTreeNode.svelte'

    import { hc } from "@/lib/HybridControllerStores";
    
  </script>

  <div class="entities">
      <ul>
        <DeviceTreeNode k="DeviceTree" v={hc.config.$value} />
      </ul>
  </div>
