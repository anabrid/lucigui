// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

/**
 * @file Svelte stores to access the Hybrid Controller states
 */

import { onMount } from 'svelte';
import { readable, writable, get, derived, type Writable } from 'svelte/store';
import { globals } from './utils';

import {
    HybridController, type OutputCentricConfig, type LogicalRoute,
    type ReducedConfig, type PhysicalRouting,
    type ClusterConfig, default_empty_cluster_config,
    config2routing, routing2config,
    logical2physical,
    physical2logical
} from './HybridController'
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

// TODO consider making this store of type URL instead of string
export const endpoint = writable(globals.default_lucidac_endpoint)

// TODO This kind of connection tracking should be part of the HybridController itself.
type endpoint_reachability = "offline" | "connecting" | "online" | "failed"

// TODO: Derived is only useful when the endpoint is not something what the
//       user is about to enter. There must be additional logic, i.e. a "connect now"
//       button. This should not happen automatically as with the derived store.
//       Maybe the frontend view logic needs another internal buffer which writes to the
//       store only after completion:

//   current endpoint:   [ <readonly> ] <- is $store ; show line only if is not empty
//   enter new endpoint: [ <input>    ] [ <connect> ] -> writes to $store

export const endpoint_reachable = derived<typeof endpoint, endpoint_reachability>(endpoint,
    (endpoint, set) => {
        //if(hc.is_connectable()) set("offline") // does not really matter
        set("connecting")
        hc.connect(new URL(endpoint))
            .then(() => set("online"))
            .catch(() => set("failed"))
    },
    /* initial value */ "offline"
)

/*export const endpoint_reachable = readable<endpoint_reachability>("offline",
    (set) => {
        if (hc.connected()) set("online")
        else {
            set("connecting")
            hc.connect(get(endpoint)).then(() => set("online"))
                .catch(() => set("failed"))
        }
    })*/

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

        // TODO THIS LOGIC MUST BE REWORKED.
        
        const cur_connection_status = get(endpoint_reachable)
        if(cur_connection_status == "connecting" || cur_connection_status == "online") {

        }
        if (!hc.is_connectable()) await hc.connect(new URL(get(endpoint)))
        status.set(await hc.query("status"))
        status_loaded.set(true)
    })
}

// TODO: Do not expose this as store.
//       Or make it as a derived store of cluster_config.
// TODO: Rename it to something like output_config or lucidac_config.

// basically get_config() and set_config() in OutputCentricFormat format
export const config_loaded = writable(false)
export const config = writable<OutputCentricConfig>(default_messages.get_config)
export function onmount_fetch_config(callback = null) {
    onMount(async () => {
        console.log("onmount_fetch_config starting")
        if (!hc.is_connectable()) await hc.connect(new URL(get(endpoint)))
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

/**
 * Base store for the UCI configuration in ClusterConfig format (includes ReducedConfig
 * for UCI matrix).
 * 
 * We use this representation of LUCIDAC configuration as the base in the overall
 * client application and convert to upstream OutputCentricConfig only on request
 * (i.e. when writing to the hardware).
 * 
 * This also means this configuration is the root in the hierarchy of derived stores
 * in this Svelte application.
 **/
export const cluster_config = writable<ClusterConfig>(default_empty_cluster_config())

/**
 * Lane-picture representation of the configuration, derived from matrix picture.
 * 
 * Note how the mapping from physical lanes to matrix misses routing errors which
 * itself appeared as part of the mapping from LogicalRoute[]. However, this store
 * has not type PhysicalRoute[] as it would still require to provide the alt_signals
 * which result in the compilation process.
 **/
export const physical_routes = writableDerived<Writable<ClusterConfig>, PhysicalRouting>(
    /* origins  */ cluster_config,
    /* derive   */ config2routing,
    /* reflect  */(reflecting: PhysicalRouting, old: ClusterConfig) => routing2config(reflecting, old.MInt)
)
// export const physical_routes = derived(routes, lrs => logical2physical(lrs))

/**
 * Unrouted Logical Connection picture representation.
 * 
 * The reflection step is the compilation or pick&place assignment.
 * Given the small size of the LUCIDAC, this can be computed many times a second.
 **/
export const logical_routes = writableDerived<Writable<PhysicalRouting>, LogicalRoute[]>(
    /* origins */ physical_routes,
    /* derive  */ (physical: PhysicalRouting) => physical2logical(physical.routes, physical.alt_signals),
    /* reflect */ logical2physical
)
// export const logical_routes = writable<LogicalRoute[]>([])





