<script>
    import { query } from '../lib/HybridController.js'
    const entities_promise = query("get_config")
  </script>

<!--
  <div class="entities">
      {#await entities_promise}
      <p>Loading entities...</p>
      {:then entities}
          <ul>
          {#each Object.entries(status) as [k,v] }
              <li>{k}: {v}</li>
          {/each}
          </ul>
      {/await}
  </div>
-->