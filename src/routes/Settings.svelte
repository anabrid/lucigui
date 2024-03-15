<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script lang="ts">
    import { onMount, setContext } from 'svelte';
    import { fade } from "svelte/transition"
    import { hc, bufferedStore, endpoint, settings_avail, settings_error, permissivePropertyStore } from "@/lib/HybridControllerStores"
    import Setting from "@/views/SettingsNode.svelte"
    import Endpoint from "@/lib/Endpoint.svelte"
    import { writable } from 'svelte/store';
    import { slide } from 'svelte/transition';
    import { toggle } from '@/lib/utils';

    onMount(() => { hc.settings.download() })
    // Download settings whenever endpoint changes (to non-null).
    $: $endpoint, $endpoint && hc.settings.download()

    // The settings editor is basically a big input form for delayed editing
    // on a complex (JSON) object.
    const new_settings = bufferedStore(hc.settings.value)
    //$: $new_settings, console.log("New local settings: ", $new_settings)

    // Whether a change would result in a reboot
    // const requires_reboot = writable({})

    // we use svelte context to inform SettingsNodes and thus save typing props.
    setContext("new_settings", new_settings)
    // setContext("requires_reboot", requires_reboot)

    let disabled = false
    $: disabled = $settings_avail != "set"

    // this is a candidate for some permanent storage / client config.
    let advanced = toggle(false)

    //section_static_ip_visible = permissivePropertyStore(new_settings, [""]) hc.settings.$value || !hc.settings.$value.use_dhcp
    let section_static_ip_visible = true
    $: section_static_ip_visible = ! $new_settings?.ethernet?.use_dhcp
</script>

<main in:fade={{ duration: 100 }} class="container is-fullhd" style="margin-top: 1.5rem">
    <div class="block">
        <h1 class="title">Settings</h1>
        <p class="subtitle">
            Configure basic permanent settings of the connected LUCIDAC device
        </p>
    </div>

    <nav class="level block">
        <div class="level-left">
            <div class="level-item buttons"> <!-- Group: has-addons -->
                <button class="button is-primary" {disabled}><!--{$requires_reboot ? "Apply & Reboot" : "Apply"}-->Apply & Reboot</button>
                <button class="button" {disabled} on:click={() => hc.settings.download()}>Undo changes</button>
                <button class="button" {disabled}>Reset to factory settings</button>
            </div>
        </div>
        <div class="level-right">
            <p class="level-item buttons">
                <button class="button"
                    class:is-danger={$advanced} class:is-light={$advanced}
                    on:click={advanced.toggle}>{$advanced?"Hide":"Show"} advanced settings</button>
                <button class="button">Download to file</button>
                <button class="button">Restore from file</button>
            </p>
        </div>
    </nav>
    <!--
    <p>
        <button>Undo changes</button> (should reset against the last downloaded version)
    <p>
        <button>Apply Settings</button> (should perform the <tt>set_settings</tt> Query)
    <p>
        <button>Reset to factory settings</button> (should read factory settings and apply them here)
    </p>
    -->

    {#if $settings_avail == "syncing"}
    <div class="notification is-warning">
        <strong>Settings not yet loaded</strong> We are trying to reach the endpoint.
        As soon as the current settings were loaded, the form can be edited.
    </div>
    {:else if $settings_avail == "error"}
    <div class="notification is-danger">
        <strong>Endpoint not reachable</strong> We cannot reach the endpoint but you can
        have a glance at this form to see the possible settings options.
        <details>
            <summary>Read detailed error message</summary>
            {$settings_error}
        </details>
    </div>
    {:else if $settings_avail == "offline"}
    <div class="notification">
        <strong>Offline</strong> We have not tried to reach any endpoint <Endpoint/> yet but you can
        have a glance at this form to see the possible settings options.
    </div>
    {/if}

    <div class="tile is-ancestor">
        <div class="tile is-parent is-vertical">
            <div class="tile is-child">
                <div class="box">
                    <h2 class="title is-5">Personalization and Managament</h2>
                    <p class="subtitle is-5">These custom settings are only displayed to clients.</p>

                    <Setting name="Contact name" path={["custom", "contact"]}>
                        Name of owner or mainly responsible user of device.
                    </Setting>

                    <Setting name="Location" path={["custom", "location"]}>
                        Location of device
                    </Setting>
                </div>


                <div class="box">
                    <h2 class="title is-5">Networking: Basics</h2>
                    <p class="subtitle is-5">All these settings describe basic TCP/IPv4 networking.</p>

                    <Setting
                        name="DHCP"
                        type="select"
                        options={{ "Use DHCP": true , "Use static IP": false }}
                        requires_reboot
                        path={["ethernet", "use_dhcp"]}
                    >
                        Whether to use DHCP for automatic IP adress configuration.
                    </Setting>

                    <Setting
                        name="Hostname"
                        type="input"
                        path={["ethernet", "hostname"]}
                    >
                        Hostname of device, used for DHCP and for display purposes
                    </Setting>
                </div>

                {#if section_static_ip_visible}
                <div class="box" transition:slide={{ duration: 300, axis: 'y' }}>
                    <h2 class="title is-5">Networking: Static Configuration</h2>
                    <p class="subtitle is-5">The following settings are only relevant because DHCP is not used.</p>

                    <Setting name="IP Address" path={["ethernet", "static_ipaddr"]}>Static IPv4 Address of the device.</Setting>
                    <Setting name="Netmask" path={["ethernet", "static_netmask"]}>Static IPv4 Netmask.</Setting>
                    <Setting name="Gateway" path={["ethernet", "static_gw"]}>Static IPv4 Gateway address.</Setting>
                    <Setting name="DNS Server" path={["ethernet", "static_dns"]}>Static IPv4 DNS address. Only one DNS server accepted.</Setting>
                </div>
                {/if}

                {#if $advanced}
                <div class="box">
                    <h2 class="title is-5">Networking: Advanced</h2>
                    <p class="subtitle is-5">Change these settings only if you know what you do.</p>

                    <Setting
                        name="MAC address"
                        type="input"
                        path={["ethernet", "mac"]}
                    >
                        Ethernet MAC address of the device in the format
                        <tt>AA-BB-CC-DD-EE-FF</tt>. It is suggested not to change this setting
                        if there is no pressing need. Changing this address is helpful for instance for
                        certain DHCP configurations.
                    </Setting>

                    <Setting
                        name="TCP Port"
                        type="number"
                        path={["ethernet", "server_port"]}
                    >
                        TCP/IP port of default raw TCP/IP JSONL service.
                        Valid is any number bigger 0 and smaller 2^16.
                    </Setting>

                    <Setting
                        name="Webserver"
                        type="radio"
                        options={{ "Enable embedded webserver": true , "Disable embedded webserver": false }}
                        path={["ethernet", "use_webserver"]}
                    >
                        Whether to use activate the internal webserver in the LUCIDAC or not.
                        Attention: When you disable the webserver, this GUI is no more usable.
                    </Setting>
                </div>
                {/if}
            </div>
        </div>
        <div class="tile is-parent is-vertical">
            <div class="tile is-child">
                <div class="box">
                    <h2 class="title is-5">Access restrictions</h2>
                    <p class="subtitle is-5">Control who can access the LUCIDAC in the network</p>

                    <Setting name="User/Password" type="radio" path={["user", "enable_whatever"]}
                        options={{ "Require login with username/password": true , "Grant anybody with access administrator rights": false }}>
                        Disabling the user/password access system is only recommended in safe networks
                        such as home networks, internal ad-hoc networks and restricted company subnets.
                    </Setting>

                    <Setting name="Firewall" type="checkbox"
                        legend="Use simple Whitelist/Blacklist based firewall"
                        path={["whatever", "fixme"]}
                        >
                        Based on connecting IP addresses.
                        <em>Warning</em>: Can lock out.
                    </Setting>

                    <!-- third setting: CORS -->
                </div>


                <div class="box">
                    <h2 class="title is-5">Access restrictions: User/Password store</h2>
                    <p class="subtitle is-5">Control who can access the LUCIDAC in the network</p>

                    <!-- TODO: This will never show up the "virtual" admin user. Visual workaround would be nice -->

                    <!-- TODO: Component that displays table username/password with add/remove rows -->
                    <Setting name="Users" type="user-pass" path={["whatever", "fixme"]}>
                    </Setting>
                </div>
            </div>
        </div>
    </div>
</main>
