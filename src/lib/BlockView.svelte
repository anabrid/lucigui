<script>
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

    // real matrix representation for u and i, col-major: [cols... [rows], ...]
    // A valid matrix has zero or one element per row.
    // The reactive code basically emulates a radio button group
    let matrix = { "u": times(nlanes, []), "c":times(nlanes, 0), "i":times(nlanes, []) }
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
      {#await entities_promise}
      <p>Loading entities...</p>
      {:then entities}
          <table>
            {#each "uci" as uci}<!-- either u, c or i block-->
            <tr>
              <th colspan=2>
                {#if uci == "u"}
                LUCIDAC Matrix Chart
                {/if}
              </th>
              <th colspan={nlanes}>{uci} Block</th>
            </tr>

            {#if uci == "u" || uci == "i"}
            {#each Array(nMblock).keys() as m}<!-- either M0 or M1 block-->
            {#each Array(nMout).keys() as i}<!-- rows -->
            {#if uci == "u" || uci == "i"}
            <tr>
              {#if i==0 }
              <th rowspan={nMout}>M{m}</th>
              {/if}
              <td>M{m}_{i}</td>
              {#each Array(nlanes).keys() as j}<!-- columns or lanes -->
              <td>
                <!-- Could not use radios because it is hard to uncheck a complete radio group -->
                <input type="checkbox" name="{uci}_ONE_{j}"
                  bind:group={matrix[uci][j]}
                  id="{uci}_{nMout*m+i}_{j}" value={nMout*m+i}>
                <label for="{uci}_{nMout*m+i}_{j}">{nMout*m+i}</label>
              </td>
              {/each}
            </tr>
            {/if}
            {/each}
            {/each}
            {:else}<!-- c block -->
            <tr>
              <td colspan=2><!-- empty --></td>
              {#each Array(nlanes).keys() as lane}
                <td><input type="number" id="c_{lane}" bind:value={matrix[uci][lane]} min="-20" max="20"/></td>
              {/each}
            </tr>
            {/if}
            {/each}
          </table>
      {/await}
  </div>

<style lang="scss">
  table { border-collapse: collapse; }
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
  
    &:hover {
      background-color: #c0d8ff;
      color: #aaa;
    }
  }

  input[type=number] {
    width: 3em;
  }

  input[type=checkbox] {
    display: none;

    &:checked + label {
      background-color: green;
    }
  }

  /* Row highlighting by mouse hover */
  table { overflow: hidden; }
  td, th { position: relative; }

  td:hover::after {
    content: "";
    position: absolute;
    background-color: #ffa;
    left: 0;
    top: -5000px;
    height: 10000px;
    width: 100%;
    z-index: -1;
  }


</style>