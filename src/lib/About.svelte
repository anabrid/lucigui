<!--
 This component represents an "About" panel as a modal.
 It can be opened by other components by importing something like

    import { info_modal_open } from '@/lib/About.svelte'
    info_modal_open.toggle()  or
    <a on:click={info_modal_open.toggle}>open about panel</a>

-->
<script context="module">
  import { toggle } from "@/lib/utils";
  export const info_modal_open = toggle(false)
</script>

<script>
  // Works but is... plain text.
  import { hostname } from "@/lib/utils";
  import ClientDefaults from '@/lib/client_defaults';
  import { endpoint } from "../HybridController/svelte-stores";

  const infos = {
    Version: ClientDefaults.app_version, // todo, would be nice to have Gitlab links
    Commit: ClientDefaults.app_githash,
    Date: ClientDefaults.app_build_date,
    "Hosted on": hostname,
    "Default endpoint": ClientDefaults.endpoint || "Headless (no default endpoint)",
    "Current endpoint": $endpoint || "Not connected"
  }

  // we access a global string variable prepared by vite.config.js.
  const README = vite_replaced.textfiles.README_HTML
</script>

<div class="modal is-active" id="about-the-app">
    <div class="modal-background" on:click={info_modal_open.toggle}></div>
    <div class="modal-content">
      <div class="card">
        <!--
        <div class="card-image">
          <figure class="image is-128x128">
            <img src="Lucidac_vektor.svg" alt="Placeholder image">
          </figure>
        </div>
        -->
        <div class="card-content">
          <div class="media">
            <div class="media-left">
              <figure class="image is-96x96">
                <img src="anabrid-claim.svg" alt="Placeholder image">
              </figure>
            </div>
            <div class="media-content">
              <p class="title is-4">{ClientDefaults.app_name}</p>
              <div class="subtitle is-6">
                <table class="table is-bordered is-striped is-narrow is-hoverable is-size-7">
                {#each Object.entries(infos) as [k,v]}
                  <tr><th>{k}:</th><td>{v}</td></tr>
                {/each}
                </table>
              </div>
            </div>
          </div>
      
          <div class="content">
            {@html README}
          </div>
        </div><!--/card content-->
  <!--
        <footer class="card-footer">
          <p class="card-footer-item">
            <span>
              View on <a href="https://twitter.com/codinghorror/status/506010907021828096">Twitter</a>
            </span>
          </p>
          <p class="card-footer-item">
            <span>
              Share on <a href="#">Facebook</a>
            </span>
          </p>
        </footer>
  -->
      </div>
    </div>
    <button on:click={info_modal_open.toggle} class="modal-close is-large" aria-label="close"></button>
  </div>

