import { onMount } from 'svelte';
import { readable, writable, get, derived } from 'svelte/store';
import { HybridController, output2reduced, reduced2output } from './HybridController.ts'

// This is basically a svelte kind of interface to the HybridController class,
// where the store is basically synced with the XHR endpoint.

// this is just global but not a store variable
export let hc = new HybridController()

export const endpoint = writable(globals.default_lucidac_endpoint)

// basically hc.get_entities(), is only write for being updated
export const entities_loaded = writable(false)
export const entities = writable({})

// basically get_status()
export const status_loaded = writable(false)
export const status = writable({})
export function onmount_fetch_status() {
    onMount(async () => {
        if(!hc.connected()) await hc.connect(get(endpoint))
        status.set(await hc.query("status"))
        status_loaded.set(true)
    })
}

// basically get_config() and set_config() in OutputCentricFormat format
export const config_loaded = writable(false)
export const config = writable({})
export function onmount_fetch_config(callback=null) {
    onMount(async () => {
        console.log("onmount_fetch_config starting")
        if(!hc.connected()) await hc.connect(get(endpoint))
        console.log("onmount_fetch_config connected")
        config.set(await hc.get_config())
        console.log("set config to", get(config))
        config_loaded.set(true)
        if(callback) {
            callback(get(config))
        }
    })
}

// this would work but the derived store is not writable.
// export const cluster_config = derived(config, ($config) => output2reduced($config[hc.mac]["/0"]))

// config in ReducedConfig Format
export const cluster = writable({})



    // https://stackoverflow.com/a/72418699
