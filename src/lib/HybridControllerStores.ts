// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

/**
 * @file Svelte stores to access the Hybrid Controller states
 */

import { onMount } from 'svelte';
import { readable, writable, get, derived, type Writable } from 'svelte/store';

import { HybridController, type OutputCentricConfig, type LogicalRoute, 
    type ReducedConfig, type PhysicalRouting, 
    logical2physical} from './HybridController'
import default_messages from './default_messages.json'
import writableDerived from 'svelte-writable-derived';

/// \file
/// This module is basically a svelte kind of interface to the HybridController class.
/// Most stores are synced with the XHR endpoint. There are also a number of derived
/// stores and standard data types.
///
/// Data types and functions which are *not* dependant on svelte (and in particular
/// non-trivial algorithsm) shall go into HybridController.ts while everything else
/// goes here.

// this is just global but not a store variable
export let hc = new HybridController()

export const endpoint = writable(globals.default_lucidac_endpoint)
type endpoint_reachability = "offline" | "connecting" | "online" | "failed"
export const endpoint_reachable = readable<endpoint_reachability>("offline",
    (set) => {
        if (hc.connected()) set("online")
        else {
            set("connecting")
            hc.connect(get(endpoint)).then(() => set("online"))
                .catch(() => set("failed"))
        }
    })

// Device settings are only a mockup so far
export const settings = writable(default_messages.get_settings)

// basically hc.get_entities(), is only write for being updated
export const entities_loaded = writable(false)
export const entities = writable(default_messages.get_entities)

// basically get_status()
export const status_loaded = writable(false)
export const status = writable(default_messages.status)
export function onmount_fetch_status() {
    onMount(async () => {
        if (!hc.connected()) await hc.connect(get(endpoint))
        status.set(await hc.query("status"))
        status_loaded.set(true)
    })
}

// basically get_config() and set_config() in OutputCentricFormat format
export const config_loaded = writable(false)
export const config = writable<OutputCentricConfig>(default_messages.get_config)
export function onmount_fetch_config(callback = null) {
    onMount(async () => {
        console.log("onmount_fetch_config starting")
        if (!hc.connected()) await hc.connect(get(endpoint))
        console.log("onmount_fetch_config connected")
        config.set(await hc.get_config())
        console.log("set config to", get(config))
        config_loaded.set(true)
        if (callback) {
            callback(get(config))
        }
    })
}

// this would work but the derived store is not writable.
// export const cluster_config = derived(config, ($config) => output2reduced($config[hc.mac]["/0"]))

// config in ReducedConfig Format
export const cluster = writable<ReducedConfig>({ u: [], c: [], i: [] })


export const routes = writable<LogicalRoute[]>([])

//export const routes = writableDerived<Writable<ReducedConfig[]>, LogicalRoute[]>(
    ///* base    */ cluster,
    ///* derive  */ matrix2routes,
    ///* reflect */ routes2matrix,
    ///* default */ null
  //)

// two way data binding: https://stackoverflow.com/a/72418699

// physical routes
export const physical_routes = derived(routes, lrs => logical2physical(lrs))



