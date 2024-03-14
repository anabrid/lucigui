<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
    import { fade } from "svelte/transition"
    import { hc } from "@/lib/HybridControllerStores"
    import Setting from "@/views/SettingsNode.svelte"
    import Endpoint from "@/lib/Endpoint.svelte"

    let disabled = false
    $: disabled = hc.config.$status != "set"
</script>

<main in:fade={{ duration: 100 }}>
    <h1 class="title">Settings</h1>
    <p class="subtitle">
        Configure basic permanent settings of the connected LUCIDAC device
    </p>

    <nav class="level">
        <div class="level-left">
            <div class="level-item buttons"> <!-- Group: has-addons -->
                <button class="button is-primary" {disabled}>Apply & Reboot</button>
                <button class="button" {disabled}>Undo changes</button>
                <button class="button" {disabled}>Reset to factory settings</button>
            </div>
        </div>
        <div class="level-right">
            <p class="level-item buttons">
                <button class="button">Show advanced settings</button>
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

    {#if hc.config.$status != "set" }
    <div class="notification is-warning">
        {#if hc.config.$status == "syncing"}
        <strong>Settings not yet loaded</strong> We are trying to reach the endpoint.
        As soon as the current settings were loaded, the form can be edited.
        {:else if hc.config.$status == "error"}
        <strong>Endpoint not reachable</strong> We cannot reach the endpoint but you can
        have a glance at this form to see the possible settings options.
        {:else}
        <strong>Offline</strong> We have not tried to reach any endpoint <Endpoint/> yet but you can
        have a glance at this form to see the possible settings options.
        {/if}        
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

                {#if !hc.settings.$value || !hc.settings.$value.use_dhcp}
                <div class="box">
                    <h2 class="title is-5">Networking: Static Configuration</h2>
                    <p class="subtitle is-5">The following settings are only relevant because DHCP is not used.</p>

                    <Setting name="IP Address" path={["ethernet", "static_ipaddr"]}>Static IPv4 Address of the device.</Setting>
                    <Setting name="Netmask" path={["ethernet", "static_netmask"]}>Static IPv4 Netmask.</Setting>
                    <Setting name="Gateway" path={["ethernet", "static_gw"]}>Static IPv4 Gateway address.</Setting>
                    <Setting name="DNS Server" path={["ethernet", "static_dns"]}>Static IPv4 DNS address. Only one DNS server accepted.</Setting>
                </div>
                {/if}

                <div class="box">
                    <h2 class="title is-5">Networking: Advanced</h2>
                    <p class="subtitle is-5">Change these settings only if you know what you do.</p>

                    
                    <Setting
                        name="MAC address"
                        type="input"
                        path={["ethernet", "mac"]}
                    >
                        Ethernet MAC address of the device. It is suggested not to change this setting
                        if there is no pressing need. Changing this address is helpful for instance for
                        certain DHCP configurations.
                    </Setting>
                </div>
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

                    <!-- TODO: Component that displays table username/password with add/remove rows -->
                    <Setting name="Users" type="user-pass" path={["whatever", "fixme"]}>
                    </Setting>
                </div>
            </div>
        </div>
    </div>
</main>
