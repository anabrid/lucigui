<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script context="module">
  // HTML ids must be unique. Iff multiple instances of this component are embedded,
  // ensure that they remain unique with the htmlid_prefix.
  let component_instance_counter = 0;
</script>
<script lang="ts">
    const htmlid_prefix = `BlockView${component_instance_counter++}`

    import { getContext } from 'svelte';
    import { slide, fade } from 'svelte/transition'
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faArrowDown, faTableColumns } from '@fortawesome/free-solid-svg-icons'

    import { SvelteHybridController } from "@/HybridController/svelte";
    import { xrange } from "@/HybridController/utils"
    import { nlanes, ncrosslanes, type InformationDirection } from "@/HybridController/types"
    import { StandardLUCIDAC } from "@/HybridController/programming";

    import { toggle } from '@/lib/utils';

    const hc = getContext("hc") as SvelteHybridController
    const cluster_config = hc.cluster_config
   
    // real matrix representation for u and i, col-major: [cols... [rows], ...]
    // A valid matrix has zero or one element per row.
    // The Matrix representation is the data model directly mapped to the view,
    // however it is not the data model used by the LUCIDAC jsonl protocol.
    // This requires a transformation when using two way data binding.
    //export const default_matrix = { "u": times(nlanes, []), "c":times(nlanes, 0), "i":times(nlanes, []) }
    //export let matrix = clone(default_matrix)

    // NOTE: The following code maps between OutputCentric Config and ClusterConfig.
    //       It is deprecated and in future only neccessary at hardware upload.
    /*
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
    */

  export let compact = toggle(false)
  export let headers = toggle(false)

  const shortTypes = { "Int": "I", "Mul": "M", "Const": "C" }
  const Mname = (clane:number, mblock_as:InformationDirection)  => {
    const e = StandardLUCIDAC.clane2port(clane, mblock_as)
    const shortTypeName = e.typeName in shortTypes ? shortTypes[e.typeName] : e.typeName
    const interestingInOut =  !(e.port == "in" || e.port == "out")
    return { shortTypeName, interestingInOut, port: e.port, id: e.id }
    /*if(interestingInOut)
      return `<math><mo>${shortTypeName}</mo><><sup>${e.port}</sup><sub>${e.id}</sub></span>`
    else
      return `<i>${shortTypeName}</i><sub>${e.id}</sub>`*/
  }

</script>

<section>

<nav class="level">
  <!-- Left side -->
  <div class="level-left">
    <div class="level-item">
      <p class="subtitle is-5">
        Physical <strong>UCI-Matrix</strong> View
      </p>
    </div>
  </div>

  <!-- Right side -->
  <div class="level-right">
    <div class="level-item">
      <div class="buttons has-addons">
        <button class="button" class:is-selected={$headers} on:click={headers.toggle}>
          <span class="icon"><FontAwesomeIcon icon={faTableColumns} /></span>
          <span>Header</span>
        </button>
        <button class="button" class:is-selected={$compact} on:click={compact.toggle}>Compact</button>
      </div>
    </div>
  </div>
</nav>


    <table class:compact={$compact}>
      {#if $headers && !$compact}
      <thead transition:slide>
        <tr class="blocks">
          {#each xrange(StandardLUCIDAC.num_slots) as i}
            <td colspan={StandardLUCIDAC.clanes_per_slot}>M<b>{ StandardLUCIDAC.slot2type[i] }</b>Block</td>
          {/each}
          <td>
            C
          </td>
          {#each xrange(StandardLUCIDAC.num_slots) as i}
            <td colspan={StandardLUCIDAC.clanes_per_slot}>M<b>{ StandardLUCIDAC.slot2type[i] }</b>Block</td>
          {/each}
        </tr>
        <tr>
          {#each "uci" as uci}
            {#if uci == "u" || uci == "i"}
              {#each xrange(ncrosslanes) as clane}
                {@const label = Mname(clane, uci == "u" ? "Source" : "Sink") }
                <td><label><i>{label.shortTypeName}</i>{#if label.interestingInOut}<sup>{label.port}</sup>{/if}<sub>{label.id}</sub></label>
                  <span style="display:block"><FontAwesomeIcon icon={faArrowDown} rotation={uci == "u" ? 0 : 180} /></span>
                </td>
              {/each}
            {:else}
                <td>coeff
                  <span style="display:block"><FontAwesomeIcon icon={faArrowDown} rotation={270} /></span>
                </td>
            {/if}
          {/each}
        </tr>
      </thead>
      {/if}
      <tbody>
      {#each xrange(nlanes) as lane}
        <!-- this active condition checks on undefined/null and real numerical 0 -->
        <tr class:active={$cluster_config.c[lane]}>
          {#each "uci" as uci}
            {#if uci == "u" || uci == "i"}
              {#each xrange(ncrosslanes) as clane}
                {@const label = Mname(clane, uci == "u" ? "Source" : "Sink") }
                <td>
                  <!--
                    Hack to enable uncheckable radio buttons: In case it is selected,
                    replace it with a checkbox which is uncheckable. Thanks to CSS
                    they are styled the same way.
                  -->
                  {#if $cluster_config[uci][lane] == clane}
                  <input
                    type="checkbox"
                    on:click={ $cluster_config[uci][lane] = undefined }
                    id="{htmlid_prefix}_{uci}_{lane}_{clane}"
                    checked
                    >
                  {:else}
                  <input
                    type="radio"
                    name="{uci}_lane_{lane}"
                    bind:group={$cluster_config[uci][lane]}
                    id="{htmlid_prefix}_{uci}_{lane}_{clane}"
                    value={clane}
                  />
                  {/if}
                  <label for="{htmlid_prefix}_{uci}_{lane}_{clane}"><!--
                    requires no whitespace
                    -->{#if !$compact}<i>{label.shortTypeName}</i>{#if label.interestingInOut}<sup>{label.port}</sup>{/if}<sub>{label.id}</sub>{:else}&nbsp;{/if}
                  </label>
                </td>
              {/each}
            {:else}
              <td
                ><input
                  type="number"
                  id="c_{lane}"
                  bind:value={$cluster_config[uci][lane]}
                  min="-20"
                  max="20"
                /></td
              >
            {/if}
          {/each}
        </tr>
      {/each}
      </tbody>
    </table>
</section>

<style lang="scss">
  section {
    margin-left: 32px;
  }

  table {
    border-collapse: collapse;
    line-height: 1.3em;
  }
  td,
  th {
    padding: 0;

    tbody & { border: 1px solid #dedede; }
  }

  thead {
    text-align: center !important;
    .blocks td {
      border: 1px solid #dedede;
    }
  }

  label {
    /* Filling whole td */
    display: block;
    text-align: center;
    width: 1.3em;
    height: 1.3em;
    position: relative;

    tbody & {
      cursor: pointer;
      color: #fff;
    }

    table.compact & {
      width: .3em;
      height: auto;
    }

    tbody &:hover {
      background-color: #c0d8ff;
      color: #aaa;
    }

    sup {
      position: absolute;
      left: 1.1em;
      top: -.4em;
    }
  }

  input[type="number"] {
    width: 3.5em;
    text-align: right; /* Would be nice to be comma aligned! */
    border: none;

    table.compact & {
      width: 1.5em
    }
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

  tbody td:hover::after {
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
  tbody tr:hover {
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
