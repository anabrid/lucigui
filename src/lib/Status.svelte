<script>
    import { status, onmount_fetch_status } from "./HybridControllerStore.ts";
    onmount_fetch_status();

    // a few helpful names here that will be populated later 
    /*
    export let hostname = "lucidac"

    status_promise.then((ident) => {
        hostname = ident.ethernet.otp_mac
    })
    */
  </script>

  <div class="status">
      {#if ! $status}
      <p>Loading status...</p>
      {:else}
          <ul>
          {#each Object.entries($status) as [k,v] }
              <li>{k}: {v}</li>
          {/each}
          </ul>

          <p>Most interesting information are actually:</p>
      {/if}
  </div>