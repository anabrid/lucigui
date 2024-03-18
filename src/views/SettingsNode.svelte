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
    const htmlid_prefix = `SettingsNode${component_instance_counter++}`

    import { slugify } from '@/lib/utils'
    import { hc, settings_avail, permissivePropertyStore } from "@/HybridController/svelte-stores"
    import { getContext } from 'svelte';
    import { writable } from 'svelte/store';
    import { slide } from 'svelte/transition';

    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faPlug } from '@fortawesome/free-solid-svg-icons'

    export let name : string; // Settings Name to show
    type form_element = "input" | "url" | "number" | "checkbox" | "password" | "select" | "user-pass"
    export let type : form_element = "input"; // input type
    export let path : string[]; // path to settings, where they actually are
    export let requires_reboot : boolean = false;
    export let options : any = {}; // Object/map potential Keys => Values
    export let legend : string;

    // Attention: This component requires a context which is currently
    //            (only) set by <Settings/> component.
    const new_settings = getContext("new_settings")
    export let value = permissivePropertyStore(new_settings, path)
    export let old_value = hc.settings.property(path)

    let has_changes = false
    $: has_changes = $value != $old_value

    export let disabled = true
    $: disabled = $settings_avail != "set"

    //const requires_reboot_flagged = getContext("requires_reboot") /* as SvelteStore */
    //$: $requires_reboot_flagged = has_changes && requires_reboot
</script>

<div class="field is-horizontal">
    <div class="field-label is-normal">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="label" class:changed={has_changes}>{name}</label>
    </div>
    <div class="field-body">
        {#if type == "user-pass" }
        <div class="field">
            <div class="control">
                <input class="input" type="text" {disabled}><!-- bind:key -->
            </div>
        </div>
        {/if}
        <div class="field">
            <div class="control">
                {#if type == "input" || type == "url" }
                <input class="input" class:is-info={has_changes} type="text" bind:value={$value} {disabled}>
                {:else if type == "number" }
                <input class="input" class:is-info={has_changes} type="number" bind:value={$value} {disabled}>
                {:else if type == "password" || type == "user-pass" }
                <input class="input" class:is-info={has_changes} type="password" bind:value={$value} {disabled}>
                {:else if type == "checkbox" }
                <label class="checkbox">
                    <input type="checkbox" class:is-info={has_changes} bind:checked={$value} {disabled}>
                    {legend}
                </label>
                {:else if type == "radio"}
                    {#each Object.entries(options) as [k,v]}
                        <p><label class="radio" class:is-info={has_changes}>
                            <!-- TODO BIND -->
                            <input type="radio" name={htmlid_prefix} value={v} bind:group={$value} {disabled}>
                            {k}
                        </label></p>
                    {/each}
                {:else if type == "select" }
                <span class="select">
                    <select bind:value={$value} class:is-info={has_changes} {disabled}>
                        {#each Object.entries(options) as [k,v]}
                        <option value={v}>{k}</option>
                        {/each}
                    </select>
                </span>
                {:else}
                <b>Type not supported: {type}</b>
                {/if}

                {#if requires_reboot} 
                <span class="tags is-normal has-addons" style="display: flex; float: right">
                    <span class="tag is-dark">
                        <span class="icon"><FontAwesomeIcon icon={faPlug} inverse /></span>
                    </span>
                    <span class="tag is-warning">requires reboot</span>
                </span>
                {/if}
    
            </div>
            <p class="help"><slot><!-- help messages can be passed here --></slot></p>
            {#if has_changes}<p class="help is-info" transition:slide={{ duration: 300, axis: 'y' }}>Changed from {$old_value}</p>{/if}
        </div>
    </div>
</div>

<style lang="scss">
    .field:hover {
        background-color: #fafafa;
    }

    .changed {
        color: rgb(38, 28, 219)
    }
</style>
