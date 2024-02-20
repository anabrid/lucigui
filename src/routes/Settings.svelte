<script>
    import { fade } from "svelte/transition";
    import SettingsNode from "../lib/SettingsNode.svelte";
    const Setting = SettingsNode // alias
    import { settings } from "../lib/HybridControllerStore";
</script>

<main in:fade={{ duration: 100 }}>
    <h2>Settings</h2>

    <p>Testing settings, here against fixed json at load time, but reactive</p>
    <p>
        <button>Undo changes</button> (should reset against the last downloaded version)
    <p>
        <button>Apply Settings</button> (should perform the <tt>set_settings</tt> Query)
    <p>
        <button>Reset to factory settings</button> (should read factory settings and apply them here)
    </p>

    <Setting name="IP" bind:value={$settings.something.nested.myname}>
        IPv4 Address of the device, used in case DHCP is disabled
    </Setting>

    <Setting name="DHCP" type="checkbox" requires_reboot bind:value={$settings.use_dhcp}>
        Whether to use DHCP for automatic IP adress configuration.
    </Setting>
    
    <Setting name="A secret" type="password" bind:value={$settings.some_password}>
        Testing Password (Should be uncoverable)
    </Setting>

</main>
