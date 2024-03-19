<script lang="ts">
    import lorentz from "@/circuits/lorenz.routes.json"
    import test from "@/circuits/mutual-test.flow.json"

    // Function to be called to load stuff
    export let load : () => void
</script>

<section class="box">
    <h3>Example Circuits</h3>
    <h3 class="subtitle">Getting started</h3>

    <ul>
        <li><a on:click={load(lorentz)}>Lorenz</a></li>
        <li><a on:click={load(test)}>Mutual flow test</a></li>
    </ul>
</section>