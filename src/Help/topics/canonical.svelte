<script lang="ts">
  import { getContext } from "svelte";
  import type { GlobalConstants } from "@/lib/client_defaults";
  import type { SvelteHybridController } from "@/lucicon/svelte";
  import { hostname } from "@/lib/utils";

  const hc = getContext("hc") as SvelteHybridController
  const endpoint = hc.endpoint

  const client_defaults = getContext("client_defaults") as GlobalConstants
  const canonical_urls = client_defaults.canonical_urls
</script>

<h2 class="title">Canonical hosted URLs for Lucidac-GUI</h2>
<h3 class="subtitle">Where to find this app in the web</h3>
<div class="content">

<p>
   You are currently viewing this application hosted at <tt>{hostname}</tt>.
   The following canonical URLs are also known to host this application:
</p>

{#if !canonical_urls}
<p><em>No canonical URLs provided for this build</em></p>
{:else}
<ul>
    {#each canonical_urls as u}
    <li><a href={u}>{u}</a></li>
    {/each}
</ul>
{/if}

<p>
  In case of problems, it can be helpful to switch the version of this tool or to
  switch to a version hosted on a secure server (prefix <tt>https://</tt> in the URL)
  or also an insecure server (prefix <tt>http://</tt> in the URL).
</p>

{#if $endpoint}
<p>
  When changing the version, you may want to manually transfer the endpoint URL:
  <tt>{$endpoint}</tt>
</p>
{/if}

</div>