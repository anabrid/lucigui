<script>
    import Tree from './Tree.svelte'

    import { config, onmount_fetch_config } from "./HybridControllerStore.ts";
    onmount_fetch_config();
    
  </script>

  <div class="entities">
          <ul>
            <Tree k="DeviceTree" v={$config} />
          </ul>
  </div>
