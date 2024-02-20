/**
 * A lean and mean minimal asynchronous LUCIDAC HybridController client
 * library in modern ECMAScript.
 **/

import { v4 as uuid } from 'uuid';

export const ncrosslanes = 16
export const nMblock = 2 // number of M blocks
export const nMout = ncrosslanes / nMblock // == 8
export const nlanes = 32

export const xrange = (N) => Array(N).keys() // iterator
export const range = (N) => [...xrange(N)] // array
export const times = (N, val) => Array.from({length: N}, (v,i) => val)
// slow but safe. The clone shall not be reactive or so.
// Maybe use sructured clone instead.
export const deepcopy = (obj) => JSON.parse(JSON.stringify(obj))
export const shallowcopy = (obj) => Object.assign({}, obj)
export const clone = deepcopy

// map crosslanes into their input meaning
export const Mname = (clane) => (clane < 8) ? `<i>I</i><sub>${clane}</sub>` : `<i>M</i><sub>${clane-8}</sub>`

/**
 * This is the type returned by HybridController.get_config() and also suitable for HybridController.set_config().
 *
* We call this an *output centric representation*, where U and I matrices look differently because
 * the one has 32 (fan-out) outputs and the other only 16 (fan-in) outputs. This representation is
 * not chosen in the internal one
 **/
export interface OutputCentricConfig {
    "entity": any, /* the MAC or [MAC, Carrier]; don't care */
    "config": {
        "/0": {
            "/M0": {
                "elements": Array<{ "ic": number, "k": number }>  /* fixed size: 8 */
            },
            "/M1": {},
            "/U": {
                "outputs": Array<number | null> /* fixed size: 32 */
            },
            "/C": {
                "elements": Array<number> /* fixed size: 32 */
            },
            "/I": {
                "outputs": Array<Array<number> | null> /* fixed size: 16 */
            }
        }
    }
}

/**
 * This representation is used internally in the HybridController javascript library or the
 * associated GUI.
 */
export interface ReducedConfig {
    "u": Array<number>, /* 32 numbers where each is in range [0,15] and defines the input crosslane for the given output lane */
    "c": Array<number>, /* 32 coefficients in value [-20,+20] */
    "i": Array<number>, /* 32 numbers where each is in range [0,15] and defines the output crosslane for the given input lane */
}

export function output2reduced(cluster_config: OutputCentricConfig): ReducedConfig {
    console.log("output2reduced: ", cluster_config)
    let matrix = {
        "u": cluster_config["config"]["/0"]["/U"]["outputs"],
        "i": cluster_config["config"]["/0"]["/I"]["outputs"],  /* TODO: TRANSLATION NECCESSARY!!!! */
        "c": cluster_config["config"]["/0"]["/C"]["elements"]
    }
    return matrix
}

export function reduced2output(matrix: ReducedConfig): OutputCentricConfig {
    let cluster_config = {
        "entity": "FIXME", // <- need to set real hc.mac here
        "config": {
            "/0": {
                "/M0": { "elements": [ { "ic": -1234, "k": 5678 } ] }, // FIXME
                "/M1": {},
                "/U": { "outputs": matrix.u },
                "/I": { "outputs": matrix.i }, /* TODO: TRANSLATION NECCESSARY!!!! */
                "/C": { "elements": matrix.c },
            }
        }
    }
    return cluster_config
}

/**
 * This 4-tuple defines a route: [ lane, uin, cval, iout ]
 * with lane:[0,32], uin:[0,16], iou:[0,16] and cval:[-20.0, 20.0]
 * This typescript type misses all that semantics.
 **/
export type Route = { "lane": number, "uin": number, "cval": number, "iout": number }

// Routine for computing the UCI matrix from a list of routes.
export const routes2matrix = (routes: Array<Route>): ReducedConfig => ({
    u: range(32).map(lane => routes.filter(r => r.lane == lane).map(r => r.uin)).flat(),
    i: range(16).map(clane => routes.filter(r => r.iout == clane).map(r => r.lane)).flat(),
    c: range(32).map(lane => { const c = routes.find(r => r.lane == lane); return c ? c.cval : 0; })
});


/**
 * The actual HybridController client class for the LUCIDAC.
 * Usage is like:
 * 
 *   const hc = new HybridController(new URL("http://1.2.3.4:5678/api"))
 *   await hc.query("status")
 * 
 **/
export class HybridController {
    endpoint: URL;
    mac: string = null; ///< Mac address, determined by get_entities()

    /*
    constructor(endpoint?: URL) {
        if(endpoint) {
            this.connect(endpoint)
        }
    }
    */

    async connect(endpoint: URL) {
        this.endpoint = endpoint
        await this.get_entities()
    }
    connected() { return Boolean(this.endpoint); }


    async query(msg_type: string, msg = {}) {
        const envelope_sent = {
            id: uuid(),
            type: msg_type,
            msg: msg
        }
        const json_sent = JSON.stringify(envelope_sent);
        const resp = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: json_sent
        })
        if (!resp.ok)
            throw new Error(`HybridController XHR failed, wanted to send ${json_sent}, received ${resp.text()}`)
        const envelope_recv = await resp.json()
        if ("error" in envelope_recv) {
            const json_recv = JSON.stringify(envelope_recv)
            throw new Error(`HybridController returned error, sent ${json_sent}, received ${json_recv}`)
        }
        if (envelope_recv['type'] == envelope_sent['type']) {
            return envelope_recv['msg'];
        } else {
            console.error("HybridController: Deviation from Query-Response principle. Sent this:", envelope_sent, "Received unexpected return message:", envelope_recv)
            return envelope_recv
        }
    }

    async get_entities() {
        const entities_msg = await this.query("get_entities")
        const entities = entities_msg["entities"]

        this.mac = Object.keys(entities)[0]
        console.log("HybridController MAC = ", this.mac)

        if (!Object.hasOwn(entities[this.mac], "/0")) {
            console.error("get_entities: Expected /0 within ", entities)
        }

        if (Object.hasOwn(entities[this.mac], "/1")) {
            console.warn("get_entities: Ignoring more then Cluster 0.")
        }

        return entities;
    }

    async get_config(): Promise<OutputCentricConfig> {
        const config = (await this.query("get_config"));

        if (!Object.hasOwn(config["config"], "/0")) {
            console.error("get_config: Expected /0 within ", config)
        }

        if (Object.hasOwn(config["config"], "/1")) {
            console.warn("get_config: Ignoring more then Cluster 0.")
        }

        return config
    }

    async set_config(config: OutputCentricConfig) {
        if (!this.mac) {
            this.get_entities()
        }

        const set_config_query = {
            "entity": [this.mac, /* Cluster 0*/ "0"],
            "config": config
        }

        console.log("set_config query with ", set_config_query)
        const reply = await this.query("set_config", set_config_query)
        console.log("set_config reply got ", reply)

        return reply // should preparse whether success or not.
    }
}

