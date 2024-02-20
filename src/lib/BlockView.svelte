<script context="module">
  // HTML ids must be unique. Iff multiple instances of this component are embedded,
  // ensure that they remain unique with the htmlid_prefix.
  let component_instance_counter = 0;
</script>

<script>
    const htmlid_prefix = `BlockView${component_instance_counter++}`

    //import { query } from './HybridController.js'
    //const entities_promise = query("get_config")

    import { cluster, status, config, config_loaded, hc, onmount_fetch_config } from "./HybridControllerStore.ts";
    import { reduced2output, output2reduced, xrange, nlanes, ncrosslanes, Mname } from "./HybridController.ts";
   
    // real matrix representation for u and i, col-major: [cols... [rows], ...]
    // A valid matrix has zero or one element per row.
    // The Matrix representation is the data model directly mapped to the view,
    // however it is not the data model used by the LUCIDAC jsonl protocol.
    // This requires a transformation when using two way data binding.
    //export const default_matrix = { "u": times(nlanes, []), "c":times(nlanes, 0), "i":times(nlanes, []) }
    //export let matrix = clone(default_matrix)

    function cluster2config($cluster) { 
      if(!$config_loaded) return;
      $config = reduced2output($cluster)
      console.log("cluster2config", $cluster, $config)
    }
    function config2cluster($config) {
      if(!$config_loaded) return;
      $cluster = output2reduced($config)
      console.log("config2cluster", $config, $cluster)
    }

    $: cluster2config($cluster)
    $: config2cluster($config)

    const empty = (yourObject) => Object.keys(yourObject).length==0

    onmount_fetch_config( (config) => {
      config2cluster(config);
//      prev = clone($cluster)
    })


</script>

<div class="entities">
  {#if !$config_loaded}
    <p>Attention, working with defaults, will be overwritten when loading from server</p>
  {/if}
    <table>
      {#each xrange(nlanes) as lane}
        <tr class:active={$cluster.c[lane] != 0}>
          {#each "uci" as uci}
            {#if uci == "u" || uci == "i"}
              {#each xrange(ncrosslanes) as clane}
                <td>
                  <!--
                    Hack to enable uncheckable radio buttons: In case it is selected,
                    replace it with a checkbox which is uncheckable. Thanks to CSS
                    they are styled the same way.
                  -->
                  {#if $cluster[uci][lane] == clane}
                  <input
                    type="checkbox"
                    on:click={ $cluster[uci][lane] = null }
                    id="{htmlid_prefix}_{uci}_{lane}_{clane}"
                    checked
                    >
                  {:else}
                  <input
                    type="radio"
                    name="{uci}_lane_{lane}"
                    bind:group={$cluster[uci][lane]}
                    id="{htmlid_prefix}_{uci}_{lane}_{clane}"
                    value={clane}
                  />
                  {/if}
                  <label for="{htmlid_prefix}_{uci}_{lane}_{clane}"
                    >{@html Mname(clane)}</label
                  >
                </td>
              {/each}
            {:else}
              <td
                ><input
                  type="number"
                  id="c_{lane}"
                  bind:value={$cluster[uci][lane]}
                  min="-20"
                  max="20"
                /></td
              >
            {/if}
          {/each}
        </tr>
      {/each}
    </table>
</div>

<style lang="scss">
  table {
    border-collapse: collapse;
    line-height: 1.3em;
  }
  td,
  th {
    border: 1px solid #dedede;
    padding: 0;
  }

  label {
    /* Filling whole td */
    cursor: pointer;
    display: block;
    text-align: center;
    color: #fff;
    width: 1.3em;
    height: 1.3em;

    &:hover {
      background-color: #c0d8ff;
      color: #aaa;
    }
  }

  input[type="number"] {
    width: 6em;
    text-align: right; /* Would be nice to be comma aligned! */
    border: none;
  }

  input[type="radio"], input[type="checkbox"] {
    display: none;

    &:checked + label {
      background-color: #bfc1d7;
      color: #2b307b;
    }
  }

  /* Row highlighting by mouse hover */
  table {
    overflow: hidden;
  }
  td,
  th {
    position: relative;
  }

  td:hover::after {
    content: "";
    position: absolute;
    background-color: #fefedb;
    left: 0;
    top: -5000px;
    height: 10000px;
    width: 100%;
    z-index: -1;
  }

  /* regular row hovering */
  tr:hover {
    &,
    label {
      background-color: #fefedb;
    }
  }

  tr.active {
    background-color: #eaeaf2;
    label {
      color: #eaeaf2;
    }
    input[type="number"] {
      color: #2b307b;
      background-color: #bfc1d7;
    }
  }

  /* No spin button */
  /* Chrome, Safari, Edge, Opera */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type="number"] {
    -moz-appearance: textfield;
  }
</style>
