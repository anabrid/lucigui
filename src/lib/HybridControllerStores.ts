// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

/**
 * @file Svelte stores to access the Hybrid Controller states
 */

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

/**
 * @file
 * This module is basically a svelte kind of interface to the HybridController class.
 * Most stores are synced with the XHR endpoint. There are also a number of derived
 * stores and standard data types.
 *
 * Data types and functions which are *not* dependant on svelte (and in particular
 * non-trivial algorithms) shall go into HybridController.ts while everything else
 * goes here.
 **/

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
class Syncable<T> {
    value = writable<T|undefined>(undefined)
    error = writable()
    lock = writable<Promise<unknown> | undefined>()
    
    readonly status = derived([this.value, this.error, this.lock],
        ([$v, $e, $l]) => {
            if($l) return "syncing"
            if($e) return "error"
            if($v) return "set"
            else   return "unknown"
        }, "unknown")

    readonly success = (v) => this.value.update(() => v)
    readonly failure = (e) => this.error.update(() => e)

    download_action : () => Promise<T>
    upload_action? : (val:T) => Promise<any>

    constructor(download_action: () => Promise<T>, upload_action?: (val:T) => Promise<any>) {
        this.download_action = download_action
        this.upload_action = upload_action
    }

    readonly download_now = () => this.lock.set(this.download_action().then(this.success, this.failure))
    readonly upload_now = () => {
        if(!this.upload_action) throw new Error("Syncable can only download")
        const value = get(this.value)
        if(!value) throw new Error("Syncable cannot upload nonexisting value")
        this.lock.set(this.upload_action(value).then(this.success, this.failure))
    }

    readonly queue = (action: () => void) => get(this.lock)?.then(action) || action()

    readonly upload = () => this.queue(this.upload_now)
    readonly download = () => this.queue(this.download_now)
}

/**
 * A "buffering" Hybrid Controller that is full of svelte stores.
 * It mimics how the actual HybridController works (which does not save so many
 * things).
 */
class SvelteHybridController {
    private remote = new HybridController()

    // TODO:
    // Consider using the mockup messages like default_messages.get_settings
    // as placeholder or default or make placeholder access easy.

    // TODO:
    // each msgbuffer should be downloaded as soon as possible (i.e. at startup or 
    //  onMount latest).
    // They also need to be downloaded any time the hc endpoint changes.

    status = new Syncable(() => this.remote.query("status"))
    entities = new Syncable(this.remote.get_entities)
    config = new Syncable(this.remote.get_config, this.remote.set_config)
    settings = new Syncable(() => this.remote.query("settings")) // for SAFTETY not yet writable

    /**
     * This store masquerades the remote.endpoint.
     * This is the right place to change or observe the endpoint in this class.
     * No need to call remote.connect or similar.
     *
     * TODO: Consider resetting/updating all syncables on endpoint change.
     **/
    endpoint = writable<URL>()
    // mac = writable<string>() // can be read from $entities

    /**
     * Learn about the endpoint reachability the svelte way, fully
     * synchronized with the "dumb" remote.endpoint_status.
     **/
    endpoint_status = writable<endpoint_reachability>()

    constructor(endpoint? : URL) {
        this.remote.endpoint_status_update = () =>
            this.endpoint_status.update(_ => this.remote.endpoint_status)
        this.endpoint.subscribe(val => this.connect)
        if(endpoint) this.endpoint.update(_ => endpoint)
    }

    private connect(endpoint : URL) {
        // we don't call remote.connect but instead this function to gather the get_entities result.
        this.entities.download()
    }
}

/**
 * This is the Svelte-flaveoured HybridController global app singleton.
 * It is not a store but a collection of many stores (@see Syncable<T> for
 * details).
 **/
export const hc = new SvelteHybridController(new URL(globals.default_lucidac_endpoint))


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





