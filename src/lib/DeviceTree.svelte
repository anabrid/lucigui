<script>
    import Tree from './Tree.svelte'

    import { query } from '../lib/HybridController.js'
    const entities_promise = query("get_config")
  </script>

  <div class="entities">
      {#await entities_promise}
      <p>Loading entities...</p>
      {:then entities}
          <ul>
            <Tree k="DeviceTree" v={entities} />
          </ul>
      {/await}
  </div>