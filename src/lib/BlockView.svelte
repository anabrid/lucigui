<script context="module">
    // HTML ids must be unique. Iff multiple instances of this component are embedded,
    // ensure that they remain unique with the htmlid_prefix.
    let component_instance_counter = 0
</script>
<script>
    const htmlid_prefix = `BlockView${component_instance_counter++}`

    import { query } from './HybridController.js'
    const entities_promise = query("get_config")

    const ncrosslanes = 16
    const nMblock = 2 // number of M blocks
    const nMout = ncrosslanes / nMblock // == 8
    const nlanes = 32

    const xrange = (N) => Array(N).keys() // iterator
    const range = (N) => [...xrange(N)] // array
    const times = (N, val) => Array.from({length: N}, (v,i) => val)
    // slow but safe. The clone shall not be reactive or so.
    // Maybe use sructured clone instead.
    const deepcopy = (obj) => JSON.parse(JSON.stringify(obj))
    const shallowcopy = (obj) => Object.assign({}, obj)
    const clone = deepcopy

    // map crosslanes into their input meaning
    // Todo, HML
    const Mname = (clane) => (clane <= 8) ? `<i>I</i><sub>${clane}</sub>` : `<i>M</i><sub>${clane-8}</sub>`

    
    // real matrix representation for u and i, col-major: [cols... [rows], ...]
    // A valid matrix has zero or one element per row.
    // The Matrix representation is the data model directly mapped to the view,
    // however it is not the data model used by the LUCIDAC jsonl protocol.
    // This requires a transformation when using two way data binding.
    export const default_matrix = { "u": times(nlanes, []), "c":times(nlanes, 0), "i":times(nlanes, []) }
    export let matrix = clone(default_matrix)

    // LUCIDAC transformation, looks something like
    /* 
    config: Object { "/0": {…} }
​​      "/0": Object { "/M0": {…}, "/M1": {}, "/U": {…}, … }
​​​         "/C": Object { elements: (32) […] }
​​​         "/I": Object { outputs: (16) […] }
​​​         "/M0": Object { elements: (8) […] }
​​​         "/M1": Object {  }
​​​         "/U": Object { outputs: (32) […] }
​​​    */
    export let cluster_config = {  "/0": {
      "/C":  times(nlanes, 0),
      "/I":  times(ncrosslanes, null),
      "/U":  times(nlanes, null),
      "/M0": times(nMout, { "ic": 0, "k": 1000 }),
      "/M1": {},
    } }
    function matrix2entities(matrix) {
      console.log("matrix2entities starting with ", matrix, cluster_config)
      cluster_config["/0"]["/U"] = matrix.u
      cluster_config["/0"]["/I"] = matrix.i
      cluster_config["/0"]["/C"] = matrix.c
    }
    function entities2matrix(cluster_config) {
      try {
        matrix.u = cluster_config["/0"]["/U"]
        matrix.i = cluster_config["/0"]["/I"]
        matrix.c = cluster_config["/0"]["/C"]
        console.log("entities2matrix: Success")
      } catch(err) {
        console.error("entities2matrix: Cluster Config is still unreadable")
      }
    }
    // https://stackoverflow.com/a/72418699
    $: matrix2entities(matrix)
    $: entities2matrix(cluster_config)


    // Emulate the radio button group
    let prev = clone(matrix)
    $: {
        for(const ui of "ui") {
          for(const lane of xrange(nlanes)) {
            let lnew = matrix[ui][lane]
            let lold = prev[ui][lane]

            if(lnew.length > 1) {
              let newvals = lnew.filter(x => !lold.includes(x))
              if(newvals.length != 1)
                console.error("Diffing failed at", ui, lane, lnew, lold, newvals)
              matrix[ui][lane] = newvals
            }
          }
        }
        matrix = matrix // trigger reactivity
        prev = clone(matrix)
    }
  </script>

  <div class="entities">
      <!--{#await entities_promise}
      <p>Loading entities...</p>
      {:then entities}-->
          <table>
            {#each xrange(nlanes) as lane}
              <tr class:active={matrix.c[lane]!=0}>
              {#each "uci" as uci}
                {#if uci == "u" || uci == "i"}
                  {#each xrange(ncrosslanes) as clane}
                    <td>
                      <input type="checkbox" name="{uci}_lane_{lane}"
                        bind:group={matrix[uci][lane]}
                        id="{htmlid_prefix}_{uci}_{lane}_{clane}"
                        value={clane}>
                      <label for="{htmlid_prefix}_{uci}_{lane}_{clane}">{@html Mname(clane)}</label>
                    </td>
                  {/each}
                {:else}
                  <td><input type="number" id="c_{lane}" bind:value={matrix[uci][lane]} min="-20" max="20"/></td>
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
  td, th {
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

  input[type=number] {
    width: 6em;
    text-align: right; /* Would be nice to be comma aligned! */
    border: none;
  }

  input[type=checkbox] {
    display: none;

    &:checked + label {
      background-color: #bfc1d7;
      color: #2b307b;
    }
  }

  /* Row highlighting by mouse hover */
  table { overflow: hidden; }
  td, th { position: relative; }

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
    &, label {
      background-color: #fefedb;
    }
  }

  tr.active {
    background-color: #eaeaf2;
    label { color: #eaeaf2; }
    input[type=number] {
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