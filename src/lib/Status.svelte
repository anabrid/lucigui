<script>
    import { query } from '../lib/HybridController.js'
    const status_promise = query("status")

    // a few helpful names here that will be populated later 
    export let hostname = "lucidac"

    status_promise.then((ident) => {
        hostname = ident.ethernet.otp_mac
    })

  </script>

  <div class="status">
      {#await status_promise}
      <p>Loading status...</p>
      {:then status}
          <ul>
          {#each Object.entries(status) as [k,v] }
              <li>{k}: {v}</li>
          {/each}
          </ul>

          <p>Most interesting information are actually:</p>
      {/await}
  </div>