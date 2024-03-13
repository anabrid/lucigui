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

export let name : string; // Settings Name to show
type form_element = "input" | "url" | "number" | "checkbox" | "password" | "select" | "user-pass"
export let type : form_element = "input"; // input type
export let value : any; // should be bound
export let requires_reboot : boolean = false;
export let options : any = {}; // Object/map potential Keys => Values
export let legend : string;

</script>

<div class="field is-horizontal">
    <div class="field-label is-normal">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="label">{name}</label>
    </div>
    <div class="field-body">
        {#if type == "user-pass" }
        <div class="field">
            <div class="control">
                <input class="input" type="text"><!-- bind:key -->
            </div>
        </div>
        {/if}
        <div class="field">
            <div class="control">
                {#if type == "input" || type == "url" }
                <input class="input" type="text" bind:value>
                {:else if type == "number" }
                <input class="input" type="number" bind:value>
                {:else if type == "password" || type == "user-pass" }
                <input class="input" type="password" bind:value>
                {:else if type == "checkbox" }
                <label class="checkbox">
                    <input type="checkbox" bind:value>
                    {legend}
                </label>
                {:else if type == "radio"}
                    {#each Object.entries(options) as [k,v]}
                        <p><label class="radio">
                            <input type="radio" name={htmlid_prefix} value={v}>
                            {k}
                        </label></p>
                    {/each}
                {:else if type == "select" }
                <span class="select">
                    <select bind:value>
                        {#each Object.entries(options) as [k,v]}
                        <option value={v}>{k}</option>
                        {/each}
                    </select>
                </span>
                {:else}
                <b>Type not supported: {type}</b>
                {/if}
                <!-- ugly workaround for 
                    https://stackoverflow.com/questions/57392773/error-type-attribute-cannot-be-dynamic-if-input-uses-two-way-binding
                    i.e. the problem is that for different input element types,
                    different watch handlers have to be applied by svelte.
                -->
                <!--
                <input {... {type}} bind:value />
                -->
                <!--
                    TODO: Should instead make a switch here for types.render
                -->

                {#if requires_reboot} 
                <span class="tags is-normal has-addons" style="display: flex; float: right">
                    <span class="tag is-dark"><i class="fa fa-plug"></i></span>
                    <span class="tag is-warning">requires reboot</span>
                </span>
                {/if}
    
            </div>
            <p class="help"><slot><!-- help messages can be passed here --></slot></p>
        </div>
    </div>
</div>

<style lang="scss">
    .field:hover {
        background-color: #fafafa;
    }
</style>
