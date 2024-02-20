<script>
    import DeviceTreeNode from './DeviceTreeNode.svelte'

    import { config, onmount_fetch_config } from "./HybridControllerStore.ts";
    onmount_fetch_config();
    
  </script>

  <div class="entities">
      <ul>
        <DeviceTreeNode k="DeviceTree" v={$config} />
      </ul>
  </div>
