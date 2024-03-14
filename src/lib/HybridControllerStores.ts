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
    physical2logical,
    type endpoint_reachability
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

/**
 * A "store" syncable with async getter/setters.
 * 
 * This is written to be synced with XHR/AJAX fetch() targets in mind, therefore the
 * naming "download" and "upload" for "get" and "set", respectively. Similar suited
 * names would be "pull" and "push" (git lingua).
 * 
 * For convenience, this function does not return a store but instance a map of stores.
 * Usage is then like instance.$value to access the actual value or for instance
 * instance.$status to obtain status information, whereas instance.download() or
 * instance.upload() will trigger (actually queue) the sync.
 * 
 * Note that this "store" starts with a "undefined" value.
 */
export function syncable<T>(download_action: () => Promise<T>, upload_action?: (val:T) => Promise<any>) {
    const value = writable<T|undefined>(undefined)
    const error = writable()
    const lock = writable<Promise<unknown> | undefined>()

    type statusmsg = "syncing"|"error"|"set"
    const status = derived([value, error, lock],
        ([$v, $e, $l]) => {
            if($l) return "syncing"
            if($e) return "error"
            if($v) return "set"
            else   return "unknown"
        }, "unknown")

    const success = (v) => value.update(() => v)
    const failure = (e) => error.update(() => e)
    const download = () => lock.set(download_action().then(success, failure))
    const queue = (action: () => void) => get(lock)?.then(action) || action()

    if(upload_action) {
        const upload = () => lock.set(upload_action(get(value)).then(success, failure))
        return { value, error, status, download: queue(download), upload: queue(upload) }
    } else
        return { value, error, status, download: queue(download) }
}

/**
 * A "buffering" Hybrid Controller that is full of svelte stores.
 * It mimics how the actual HybridController works (which does not save so many
 * things).
 */
class SvelteHybridController {
    remote = new HybridController()
    
    status = syncable(() => this.remote.query("status"))
    entities = syncable(this.remote.get_entities)
    config = syncable(this.remote.get_config, this.remote.set_config)
    settings = syncable(() => this.remote.query("settings")) // for SAFTETY not yet writable

    endpoint = writable<URL>()
    mac = writable<string>()
    endpoint_status = writable<endpoint_reachability>()

    constructor(endpoint? : URL) {
        if(endpoint) this.remote.connect(endpoint)
    }
}

export const hc = new SvelteHybridController(new URL(globals.default_lucidac_endpoint))

// TODO:
// each msgbuffer should be downloaded as soon as possible (i.e. at startup or 
//  onMount latest).
// They also need to be downloaded any time the hc endpoint changes.

/*

// Device settings are only a mockup so far
export const settings = writable(default_messages.get_settings)

// basically hc.get_entities(), is only write for being updated
export const entities_loaded = writable(false)
export const entities = writable(default_messages.get_entities)

// basically get_status()
export const status_loaded = writable(false)
export const status = writable(default_messages.status)


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

*/

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





