<script lang="ts">

export let name : string; // Settings Name to show
type form_element = "input" | "url" | "number" | "checkbox" | "password"
export let type : form_element = "input"; // input type
export let value : any; // should be bound
export let requires_reboot : boolean = false;

</script>

<div class="field">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="label">{name}
        {#if requires_reboot} 
        <span class="tags has-addons" style="display: inline-flex">
            <span class="tag is-dark"><i class="fa fa-plug"></i></span>
            <span class="tag is-warning">requires reboot</span>
        </span>
        {/if}
    </label>
    <div class="control">
        <!-- ugly workaround for 
            https://stackoverflow.com/questions/57392773/error-type-attribute-cannot-be-dynamic-if-input-uses-two-way-binding
            i.e. the problem is that for different input element types,
            different watch handlers have to be applied by svelte.
        -->
        <input {... {type}} bind:value />
    </div>
    <p class="help"><slot><!-- help messages can be passed here --></slot></p>
</div>
