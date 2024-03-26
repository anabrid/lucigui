<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->

<!--
    A view for editing the endpoint (store)
    in a defered way
-->
<script lang="ts">
    import { SvelteHybridController, bufferedStore } from "@/lucicon/svelte";
    import { type connectionState } from "@/lucicon/connection"
    import { isValidHttpUrl } from "@/lib/utils"
    import { getContext } from "svelte";

    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faRedo } from '@fortawesome/free-solid-svg-icons'
    
    const hc = getContext("hc") as SvelteHybridController
    const endpoint = hc.endpoint
    const endpoint_status = hc.endpoint_status

    // This component is basically a fancy input box for a delayed write
    const new_endpoint = bufferedStore(hc.endpoint)

    let editing = false // derived: whether Component is in an "editing" state
    let input_focus = false // whether <input> has focus
    $: editing = input_focus || $new_endpoint != $endpoint

    // for me the <input type=url> validation does not work out of box,
    // so we basically redo it in svelte
    let url_valid = true
    $: url_valid = isValidHttpUrl($new_endpoint)

    // this are all the different states this component can be in, just for tracking.
    type component_state = "editing"|"invalid"|connectionState

    let leftButtonClasses = ""
    let rightButtonClasses = ""
    const rightButtonCommunicationClasses = { offline: "is-primary", connecting: "is-primary is-light", online: "is-light", failed: "is-warning" }
    $: leftButtonClasses = editing ? (url_valid ? "" : "") : ""
    $: rightButtonClasses = editing ? (url_valid ? "is-success" : "is-warning") : rightButtonCommunicationClasses[$endpoint_status]

    let leftButtonLabel = ""
    let rightButtonLabel = ""
    const leftButtonCommunicationLabels  = { offline: "LUCIDAC @", connecting: "Connecting...", online: "Connected:", failed: "Unreachable:" }
    const rightButtonCommunicationLabels = { offline: "Connect", connecting: "Cancel", online: "Ping", failed: "Retry" }

    $: leftButtonLabel = editing ? (!$new_endpoint ? "Connect to:" : (url_valid ? "Valid URL: " : "Invalid URL: ")) : leftButtonCommunicationLabels[$endpoint_status]
    //$: leftButtonLabel = editing ? (url_valid ? "Valid URL: " : "Invalid URL: ") : leftButtonCommunicationLabels[$endpoint_status]
    $: rightButtonLabel = editing ? (url_valid ? "Connect" : "Cancel" ) : rightButtonCommunicationLabels[$endpoint_status]

    let rightButtonIcon = undefined

    export let cancel_callback : (() => void)|undefined

    function submit() { new_endpoint.save() }
    function cancel() {
        new_endpoint.reset()
        if(cancel_callback) cancel_callback()
    }

    const communicationAction = {
        offline() { submit() },
        connecting() { window.alert("Ha. Currently things are not cancable.")  },
        online() { window.alert("Will implement ping function in future") },
        failed() { hc.remote.reconnect() }
    }

    const leftButtonAction = () => {}
    const rightButtonAction = () => (editing ? (url_valid ? submit() : cancel()) : communicationAction[$endpoint_status]())

    export let show_only_action_button = false

</script>

<span class="field has-addons" style="display: inline-flex; vertical-align: middle">
    <span class="control" class:is-hidden={show_only_action_button}>
        <button class="button is-static {leftButtonClasses}" on:click={leftButtonAction}>
            {leftButtonLabel}
        </button>
        <!--
        <button class="button" on:click={reset}>
            <span class="icon is-small">
                <FontAwesomeIcon icon={faRedo}  />
            </span>
            <span>Cancel</span>
        </button>
        -->
    </span>
    <span class="control is-expanded" class:is-hidden={show_only_action_button}>
      <input class="input" class:is-success={url_valid} class:is-danger={!url_valid && $new_endpoint} type="url"
        on:click={(e)=>e.target.select()}
        on:focus={() => input_focus = true}
        on:blur={() => input_focus = false}
        placeholder="http://1.2.3.4/api" bind:value={$new_endpoint}>
    </span>
    <span class="control">
        <button class="button {rightButtonClasses}" on:click={rightButtonAction}>
            {#if rightButtonIcon}
            <span class="icon">
                <FontAwesomeIcon icon={rightButtonIcon} />
            </span>
            {/if}
            <span>{rightButtonLabel}</span>
        </button>
    </span>
</span>

<style>
  /* Avoid margins which make it hard to embed into button rows and texts */
  .field, .field > * {
    margin-bottom: 0
  }
</style>