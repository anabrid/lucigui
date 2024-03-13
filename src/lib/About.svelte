<script>
  // Works but is... plain text.
  //import { default as readme_markdown_string } from  '@/assets/README.md?raw'
  import { hostname } from "@/lib/utils";

  // instead, we access a global variable prepared by vite.config.js.
  const README = textfiles.README_HTML


  export let info_modal_open;
</script>

<div class="modal is-active" id="about-the-app">
    <div class="modal-background"></div>
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