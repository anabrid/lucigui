<!--
Copyright (c) 2024 anabrid GmbH
Contact: https://www.anabrid.com/licensing/
SPDX-License-Identifier: MIT OR GPL-2.0-or-later
-->
<script>
    import { fade } from "svelte/transition";
    import SettingsNode from "@/views/SettingsNode.svelte";
    const Setting = SettingsNode; // alias
    import { settings } from "@/lib/HybridControllerStores";
</script>

<main in:fade={{ duration: 100 }}>
    <h1 class="title">Settings</h1>
    <p class="subtitle">
        Configure basic permanent settings of the connected LUCIDAC device
    </p>

    <nav class="level">
        <div class="level-left">
            <p class="level-item">
                <button class="button is-primary">Apply & Reboot</button>
            </p>
            <p class="level-item">
                <button class="button">Undo changes</button>
            </p>
        </div>
        <div class="level-right">
            <p class="level-item">
                <button class="button">Reset to factory settings</button>
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

    <div class="box">
        <h2 class="title is-3">Networking</h2>
        <p>All these settings describe basic TCP/IPv4 networking.</p>

        <Setting name="IP" bind:value={$settings.something.nested.myname}>
            IPv4 Address of the device, used in case DHCP is disabled
        </Setting>

        <Setting
            name="DHCP"
            type="checkbox"
            requires_reboot
            bind:value={$settings.use_dhcp}
        >
            Whether to use DHCP for automatic IP adress configuration.
        </Setting>

        <Setting
            name="A secret"
            type="password"
            bind:value={$settings.some_password}
        >
            Testing Password (Should be uncoverable)
        </Setting>
    </div>

    


</main>
