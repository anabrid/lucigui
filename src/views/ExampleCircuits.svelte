<script lang="ts">
    import lorentz from "@/circuits/lorenz.routes.json"
    import test from "@/circuits/mutual-test.flow.json"

    // Function to be called to load stuff
    export let load : (any) => void
    export let close : () => void = undefined
</script>

<section class="box">
    <button class="delete" style="float:right" on:click={()=>{if(close)close()}}></button>
    <h4 class="title">Example Circuits</h4>
    <h5 class="subtitle">
        Use our library of examples to learn and
        understand visual LUCIDAC programming.
    </h5>

    <article class="media">
        <figure class="media-left">
          <p class="image is-64x64">
            <img src="example-thumb-lorenz.svg">
          </p>
        </figure>
        <div class="media-content">
          <div class="content">
            <p>
              <strong>Lorenz attractor</strong> <small>(json)</small>
              <br>
              Simple three-dimensional attractor and standard example for demonstrating
              analog computers.
            </p>
          </div>
          <div class="buttons are-small">
             <a on:click={load(lorentz)} class="button is-primary is-link">Load Lorenz</a>
             <a class="button" href="https://analogparadigm.com/downloads/alpaca_2.pdf" target="_blank">
                Read more
             </a>
          </div>
        </div>
    </article>

    <article class="media">
        <figure class="media-left">
          <p class="image is-64x64">
            <img src="example-thumb-oscillator.svg">
          </p>
        </figure>
        <div class="media-content">
          <p class="content">
              <strong>Circular reference</strong> <small>(debugging)</small>
              <br>
              Example circuit for demonstrating circular references.
          </p>
          <div class="buttons are-small">
             <a on:click={load(test)} class="button is-primary is-link">Load testcase</a>
          </div>
        </div>
    </article>
</section>

<style lang="scss">
    section {
        margin-right: 2em;
        max-width: 27em;
    }

</style>