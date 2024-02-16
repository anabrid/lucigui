<script>
    import Tree from './Tree.svelte'

    export let entities;
/*
    import { query } from '../lib/HybridController.js'
    const entities_promise = query("get_config")
*/
  </script>

  <div class="entities">
          <ul>
            <Tree k="DeviceTree" v={entities} />
          </ul>
  </div>