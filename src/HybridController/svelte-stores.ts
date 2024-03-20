// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

/**
 * @file Svelte stores to access the Hybrid Controller states
 */

import { readable, writable, get, derived, type Writable } from 'svelte/store';
import { writableDerived, type MinimalWritable } from 'svelte-writable-derived';

import type {
    OutputCentricConfig, LogicalConnection,
    ReducedConfig, PhysicalRouting,
    ClusterConfig, CircuitFileFormat
} from './types'
import {
    default_empty_cluster_config,
    config2routing, routing2config,
    logical2physical,
    physical2logical
} from './programming'
import { HybridController, type endpoint_reachability  } from './connection';

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

export function permissiveLookup(value, propName) {
    const props = propName.concat();
    if(!value) return undefined
    for (let i = 0; i < props.length; ++i) {
        if(props[i] in value)
            value = value[ props[i] ];
        else   
            return undefined
    }
    return value;
}

/**
 * This is basically a friendlier version of the propertyStore from the svelte-writable-derived
 * package. It create a store for a property value in an object contained in another store
 * and allows a path of properties in nested objects.
 * 
 * If the property does not exist or the path does not resolve, it just maps to undefined.
 * 
 * At writing (reflection), it will create missing paths on the go.
 * 
 * @note This is not properly typed because it can get a mess, see index.d.ts in svelte-writable-derived.
 **/
export function permissivePropertyStore(origin, propName:string|number|symbol|Array<string|number|symbol>) {
	if (!Array.isArray(propName)) {
		return writableDerived(
			origin,
			(object) => object && propName in object ? object[propName] : undefined,
			(reflecting, object) => {
                if(object)
				    object[propName] = reflecting;
				return object;
			},
		);
	} else {
		let props = propName.concat();
		return writableDerived(
			origin,
			(value) => {
                if(!value) return undefined
				for (let i = 0; i < props.length; ++i) {
                    if(value && props[i] in value)
					    value = value[ props[i] ];
                    else   
                        return undefined
				}
				return value;
			},
			(reflecting, object) => {
                //console.log("permissivePropertyStore, reflect", reflecting, object, props)
				let target = object;
				for (let i = 0; i < props.length - 1; ++i) {
                    if(target) {
                        if(!(props[i] in target)) {
                            if(i+1<props.length) {
                                // create a nested container
                                if(typeof props[i+1] === 'string')
                                    target[ props[i] ] = {}
                                else if(typeof props[i+1] === 'number')
                                    target[ props[i] ] = []
                                else
                                    throw new Error("Unexpected type in props")
                            } else {
                                break
                            }
                        }
                        target = target[ props[i] ];
                    } else
                        break
				}
                if(target)
				    target[ props[props.length - 1] ] = reflecting;
				return object;
			},
		);
	}
}

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
    error = writable(undefined)
    lock = writable<Promise<unknown> | undefined>(Promise.resolve())

    /** Access a property as a store. Will fall back to 'undefined' if path non-existent */
    property = (propName:string|number|symbol|Array<string|number|symbol>) => permissivePropertyStore(this.value, propName)

    /** Looks up a value, does not return a store but the value or undefined. */
    lookup = (propName:string|number|symbol|Array<string|number|symbol>) => permissiveLookup(get(this.value), propName)

    reset() {
        this.value.set(undefined)
        this.error.set(undefined)
        this.lock.set(undefined)
    }
    
    readonly status = derived([this.value, this.error, this.lock],
        ([$v, $e, $l]) => {
            if($l) return "syncing"
            if($e) return "error"
            if($v) return "set"
            else   return "offline"
        }, "offline")

    private readonly result = (p:Promise<any>) =>
        p.then(
            (v) => this.value.update(() => v),
            (e) => { console.error("Syncable failure:", e); this.error.update(() => e) }
        ).finally(
            () => this.lock.set(undefined)
        )

    download_action : () => Promise<T>
    upload_action? : (val:T) => Promise<any>

    constructor(download_action: () => Promise<T>, upload_action?: (val:T) => Promise<any>) {
        this.download_action = download_action
        this.upload_action = upload_action
    }

    readonly download_now = () => this.lock.set(this.result(this.download_action()))
    readonly upload_now = () => {
        if(!this.upload_action) throw new Error("Syncable can only download")
        const value = get(this.value)
        if(!value) throw new Error("Syncable cannot upload nonexisting value")
        this.lock.set(this.result(this.upload_action(value)))
    }

    readonly queue = (action: () => void) => get(this.lock)?.finally(action) || action()

    readonly upload = () => this.queue(this.upload_now)
    readonly download = () => this.queue(this.download_now)
}

/**
 * A "buffering" Hybrid Controller that is full of svelte stores.
 * It mimics how the actual HybridController works (which does not save so many
 * things).
 * 
 * Note that the default API to this class are the stores, typically you
 * don't need any method invocation. See implementation for details.
 * 
 * Further note: In Svelte, you typically have to make store aliases because
 * <input bind:value={$something}> works, but bind:value={hc.$something} does
 * not work reactively. The same is true with reactive statements such as
 * $: foo = hc.$bar (does not work but foo=$bar does).
 * A typical usage pattern in *.svelte files is therefore:
 * 
 *    const my_alias = instance.status.value
 * 
 * and then use $my_alias for binding and reactivity.
 * 
 * @note An instance of this class is used as singleton in App.svelte,
 *       accessible in all nested *.svelte files as getContext("hc").
 **/
export class SvelteHybridController {
    private remote = new HybridController()

    // TODO:
    // Consider using the mockup messages like default_messages.get_settings
    // as placeholder or default or make placeholder access easy.

    // TODO:
    // each msgbuffer should be downloaded as soon as possible (i.e. at startup or 
    //  onMount latest).
    // They also need to be downloaded any time the hc endpoint changes.

    // TODO:
    // The stores currently have no protection against !this.remote.is_connected().
    // If not connected, the hc.query() just will raise an Error. Mabye this should
    // be better guarded

    status = new Syncable(() => this.remote.query("status"))
    entities = new Syncable(() => this.remote.get_entities())
    config = new Syncable(() => this.remote.get_config(), () => this.remote.set_config())
    settings = new Syncable(() => this.remote.query("get_settings")) // for SAFTETY not yet writable

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
    endpoint_status = writable<endpoint_reachability>("offline")

    /**
     * Internally handles connection and disconnection (endpoint=null)
     * Use $endpoint=<whatever> for public API.
     **/
    private connect(endpoint?: URL ){
        this.status.reset()
        this.entities.reset()
        this.config.reset()
        this.settings.reset()

        this.remote.endpoint = endpoint // manual double bind ;)
        // we don't call this.remote.connect() but instead
        // let the entities store gather the get_entities result,
        // ie. do this way the same as this.remote.connect() does.
        if(endpoint) this.entities.download()
    }
        
    constructor(endpoint? : URL) {
        this.remote.endpoint_status_update = () => this.endpoint_status.set(this.remote.endpoint_status)
        if(endpoint) this.endpoint.set(endpoint)
        this.endpoint.subscribe(e => this.connect(e))
    }


    //// Derived cluster configurations

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
    cluster_config = writable<ClusterConfig>(default_empty_cluster_config())

    /**
     * Lane-picture representation of the configuration, derived from matrix picture.
     * 
     * Note how the mapping from physical lanes to matrix misses routing errors which
     * itself appeared as part of the mapping from LogicalRoute[]. However, this store
     * has not type PhysicalRoute[] as it would still require to provide the alt_signals
     * which result in the compilation process.
     **/
    physical_routes = writableDerived<Writable<ClusterConfig>, PhysicalRouting>(
        /* origins  */ this.cluster_config,
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
    logical_routes = writableDerived<Writable<PhysicalRouting>, LogicalConnection[]>(
        /* origins */ this.physical_routes,
        /* derive  */ (physical: PhysicalRouting) => physical2logical(physical.routes, physical.alt_signals),
        /* reflect */ logical2physical
    )
    // export const logical_routes = writable<LogicalRoute[]>([])


    /**
     * Allow to read from a serialization file format.
     * 
     * @todo: Codebase should generate JSON schemas for various types
     *  such as the CircuitFileFormat and then test against that schema
     *  for easy verification.
     * 
     * Currently no verification is done!
     */
    read_from(obj: CircuitFileFormat) {
        if("RoutesConfig" in obj) {
            console.info("SvelteHybridController.read_from: Interpreting as RoutesConfig")
            this.physical_routes.set(obj["RoutesConfig"])
        } else if("ClusterConfig" in obj) {
            console.info("SvelteHybridController.read_from: Interpreting as ClusterConfig")
            this.cluster_config.set(obj["ClusterConfig"])
        } else if("SendEnvelope" in obj) {
            console.info("SvelteHybridController.read_from: Interpreting as SendEnvelope")
            if(obj["type"] != "set_config")
                throw Error("SendEnvelope must be of type=set_config")
            const msg = obj["msg"] as OutputCentricConfig
            const reduced = output2reduced(msg)
            this.cluster_config.set(reduced)
        } else {
            throw Error("Missing any suitable serialization format.")
        }
    }
}


/**
 * A buffered store is like a writable-derived store but with delayed write back.
 * The sync only happens when you manually call save() or reset()
 * OR when there is an new value in the upstream store, which results in a reset().
 * 
 * The check if the buffered store has changes is simply by
 * has_changes = $upstream != $buffered. If you feel to do so, you can create a
 * derived store for that with derived([a, b], ([a,b]) => a != b) with
 * a=upstream and b=buffered.
 */
export function bufferedStore<T>(upstream : MinimalWritable<T>) {
    // Initialize current value in non-reactive way and a stage buffer
    let stage = writable(get<T>(upstream))

    // helper functions enriching this store
    function save() { upstream.set(get<T>(stage)) } // delayed storage write
    function reset() { stage.set(get<T>(upstream)) }

    // clumsy way to track upstream changes without leaking store subscriptions
    let subscribers = 0
    let upstream_unsubscribe : (()=>void)
    function subscribe(subscription: (value: any) => void) : (() => void) {
        if(++subscribers) upstream_unsubscribe = upstream.subscribe((val:T) => stage.set(val))
        const unsubscribe = stage.subscribe(subscription)
        return () => {
            if(0==--subscribers && upstream_unsubscribe) upstream_unsubscribe()
            unsubscribe()
        }
    }

    return { subscribe, update:stage.update, set:stage.set, save, reset }
}


// this would work but the derived store is not writable.
// export const cluster_config = derived(config, ($config) => output2reduced($config[hc.mac]["/0"]))


