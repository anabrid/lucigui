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
  import { hostname, globals } from "@/lib/utils";

  // instead, we access a global variable prepared by vite.config.js.
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
              <p class="title is-4">LUCIDAC-GUI</p>
              <p class="subtitle is-6">
                Version: {globals.application_name_and_version}
                <br>
                Hosted on: {hostname}
              </p>
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