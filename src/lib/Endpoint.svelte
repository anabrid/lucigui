<!--
    A view for editing the endpoint (store)
    in a defered way
-->
<script lang="ts">
    import { hc, endpoint, endpoint_status } from "./HybridControllerStores";
    import { type endpoint_reachability } from "./HybridController"
    import { isValidHttpUrl } from "./utils"
    import { get } from 'svelte/store'

    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faRedo } from '@fortawesome/free-solid-svg-icons'
    import About from "./About.svelte";
    import { ConnectionLineType } from "@xyflow/svelte";

    // initialize in a non-reactive way
    let current_endpoint = get(hc.endpoint)
    let new_endpoint = current_endpoint
    function reset() { new_endpoint = current_endpoint }

    $: current_endpoint = $endpoint; reset()
    $: console.log("New value: ", $endpoint)

    let editing = false
    $: editing = new_endpoint != current_endpoint

    // for me the <input type=url> validation does not work out of box,
    // so we basically redo it in svelte
    let url_valid = true
    $: url_valid = isValidHttpUrl(new_endpoint.toString())

    // this are all the different states this component can be in
    type component_state = "editing"|"invalid"|endpoint_reachability

    let leftButtonClasses = ""
    let rightButtonClasses = ""
    const rightButtonCommunicationClasses = { "offline": "is-primary", "connecting": "is-primary is-light", "online": "is-light", "failed": "is-warning" }
    $: leftButtonClasses = editing ? (url_valid ? "" : "") : ""
    $: rightButtonClasses = editing ? (url_valid ? "is-success" : "is-warning") : rightButtonCommunicationClasses[$endpoint_status]

    let leftButtonLabel = "LUCIDAC at"
    let rightButtonLabel = "bla"
    const leftButtonCommunicationLabels  = {
        editing: "Valid URL:",
        invalid: "Invalid URL:",

        // TODO: Continue here, make things a bit more clear.

        offline: "LUCIDAC @",
        connecting: "Connecting...",
        online: "Host @",
        failed: "Unreachable:",
    }
    const rightButtonCommunicationLabels = {"offline": "Connect", "connecting": "Cancel", "online": "Ping", "failed": "Retry", }

    $: leftButtonLabel = editing ? (url_valid ? "Valid URL: " : "Invalid URL: ") : leftButtonCommunicationLabels[$endpoint_status]
    $: rightButtonLabel = editing ? (url_valid ? "Connect" : "Cancel" ) : rightButtonCommunicationLabels[$endpoint_status]

    let rightButtonIcon = undefined

    const leftButtonAction = () => {}
    const rightButtonAction = () => (editing ? (url_valid ? connect() : reset()) : null)

</script>

<span class="field has-addons" style="display: inline-flex; vertical-align: middle">
    <span class="control">
        <button class="button is-static {leftButtonClasses}" on:click={leftButtonAction}>
            {leftButtonLabel} -- {$endpoint_status}
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
    <span class="control is-expanded has-icons-right">
      <input class="input" class:is-success={url_valid} class:is-danger={!url_valid} type="url"
        on:click={(e)=>e.target.select()}
        placeholder="http://1.2.3.4/api" bind:value={new_endpoint}>
    <!--
      <span class="icon is-small is-right" on:click={reset} style="cursor:pointer">
        <FontAwesomeIcon icon={faRedo}  />
      </span>
    -->
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
        <!--
      {#if editing}
        {#if url_valid}
        <button class="button is-success">
            <span>Connect</span>
        </button>
        {:else}
        <button class="button is-danger" disabled>
            <span class="icon">
                <i class="fa fa-check"></i>
            </span>
            <span>
                Invalid URL
            </span>
        </button>
        {/if}
      {:else}
        {#if hc.$endpoint_status == "offline" } connecting online failed
         <button class="button is-success">
            Connect
         </button>
         {:else if hc.$endpoint_status == "online" }
         <button 
      {/if}
        -->
    </span>
</span>
