<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
    import { hc } from "@/lib/HybridControllerStores.ts";

    // a few helpful names here that will be populated later 
    /*
    export let hostname = "lucidac"

    status_promise.then((ident) => {
        hostname = ident.ethernet.otp_mac
    })
    */
  </script>

  <div class="status">
      {#if hc.status.$status != "set"}
      <p>Loading status...</p>
      {:else}
          <ul>
          {#each Object.entries(hc.status.$value) as [k,v] }
              <li>{k}: {v}</li>
          {/each}
          </ul>

          <p>Most interesting information are actually:</p>
      {/if}
  </div>