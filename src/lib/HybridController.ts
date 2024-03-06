/**
 * A lean and mean minimal asynchronous LUCIDAC HybridController client
 * library in modern ECMAScript.
 * 
 * This file is written in TypeScript but contains *no* dependency to any Svelte
 * code. It is *standalone* with minimal dependencies to nodejs.
 * 
 * A number of stores depend on codes written in this file, for instance the
 * HybridControllerStores.ts or the FlowViewStore.ts.
 **/

import { v4 as uuid } from 'uuid';

// abbreveating exceptions
// tryOr(()=>something, )
export function tryOr<T>(f:(()=> T), err:T): T {try{ return f() } catch(e) { return err; }}
// This would also be nice: tryCall(callee, args...).Or()

export const ncrosslanes = 16
export const nMblock = 2 // number of M blocks
export const nMout = ncrosslanes / nMblock // == 8
export const nlanes = 32

export const xrange = (N) => Array(N).keys() // iterator
export const range = (N) => [...xrange(N)] // array
export type span = [number,number]
export const inrange = (needle : number, range : span) => (needle >= range[0] && needle <= range[1])
export const times = (N, val) => Array.from({ length: N }, (v, i) => val)
// slow but safe. The clone shall not be reactive or so.
// Maybe use sructured clone instead.
export const deepcopy = (obj) => JSON.parse(JSON.stringify(obj))
export const shallowcopy = (obj) => Object.assign({}, obj)
export const clone = deepcopy

// TypeScript zip implementation: zip("abc", "def") = [["a","d"], ["b","e"], ["c","f"]]
export const zip = (...arr) => Array(Math.max(...arr.map(a => a.length))).fill().map((_,i) => arr.map(a => a[i]));  

export function enumerate<T>(ary:T[]) : Array<[T,number]> { return ary.map((x,idx)=>[x,idx]) }

// map crosslanes into their input meaning
export const Mname = (clane) => (clane < 8) ? `<i>I</i><sub>${clane}</sub>` : `<i>M</i><sub>${clane - 8}</sub>`

/// Just a counter
export class UniqueCounter {
    count: number;
    constructor(init = 0) { this.count = init }
    next = (): number => this.count++
}

/// Retrieves next free number in a list of numbers. This will also exploit
/// gaps in non-continous input lists.
export const next_free = (occupied_numbers: number[]): number => {
    const free_ids = range(occupied_numbers.length + 1)
    const candidates = free_ids.filter(x => !occupied_numbers.includes(x))
    if(candidates.length < 1) throw new Error("next_free_id: Assumption failed.")
    return candidates[0]
}

/// Internal Configuration for an Int M-Block
type MIntConfig = Array<{ "ic": number, "k": number }>  /* fixed size: 8 */

/// Auxiliary Internal Configuration for an U-Block
type UBlockAltSignals = Array<number> | null /* fixed size 8 */

/**
 * This representation is used internally in the HybridController javascript library or the
 * associated GUI.
 * 
 * @todo: rename u/c/i to U/C/I
 */
export interface ReducedConfig {
    "u": Array<number>, /* 32 numbers where each is in range [0,15] and defines the input crosslane for the given output lane */
    "c": Array<number>, /* 32 coefficients in value [-20,+20] */
    "i": Array<number>, /* 32 numbers where each is in range [0,15] and defines the output crosslane for the given input lane */
}

/**
 * This representation is used internally in the HybridController javascript library
 * and closely resembles the part ["config"]["/0"] in the OutputCentricConfig.
 **/
type ClusterConfig = ReducedConfig & {
    MInt: MIntConfig,
    Ualt: UBlockAltSignals
}

/**
 * This is the type returned by HybridController.get_config() and also suitable for HybridController.set_config().
 *
 * We call this an *output centric representation*, where U and I matrices look differently because
 * the one has 32 (fan-out) outputs and the other only 16 (fan-in) outputs. This representation is
 * easily transformed to/from the ClusterConfig.
 **/
export interface OutputCentricConfig {
    "entity": any, /* the MAC or [MAC, Carrier]; don't care */
    "config": {
        "/0": {
            "/M0": {
                "elements": MIntConfig
            },
            "/M1": {},
            "/U": {
                "outputs": Array<number | null>, /* fixed size: 32 */
                "alt_signals": UBlockAltSignals
            },
            "/C": {
                "elements": Array<number> /* fixed size: 32 */
            },
            "/I": {
                // note how this describes the output where ReducedConfig "i" is defined by the inputs!
                "outputs": Array<Array<number> | null> /* fixed size: 16 */
            }
        }
    }
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
                "/M0": { "elements": [{ "ic": -1234, "k": 5678 }] }, // FIXME
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
 * This 4-tuple defines a physical route: [ lane, uin, cval, iout ]
 * with lane:[0,32], uin:[0,16], iou:[0,16] and cval:[-20.0, 20.0]
 * This typescript type misses all that semantics.
 **/
export type PhysicalRoute = {
    lane: number,
    uin: number,
    cval: number,
    iout: number|undefined, // I matrix does not need to be connected, for instance in ADC and ACL_OUT use
    pinned_lane?: boolean // whether the lane is pinned within a compilation process
}

/// Basically a type enum covering the supported logical compute elements in this code
// @TODO: Rename to something more sensible.
export type LogicalComputingElementType = "Mul" | "Int" | "Extin" | "Extout" | "Daq" | "Const"

/// virtual elements which have M-block equivalent
type VirtualElementDirection = "Sink"|"Source"
const virtual_elements = {"Extin": "Source", "Extout": "Sink", "Const": "Source", "Daq": "Sink"}

const is_non_virtual = (lr:LogicalRoute) : boolean => !(lr.source.type in virtual_elements) && !(lr.target.type in virtual_elements)

/// lane ranges where logical elements can connect to.
/// The ranges include the beginning and end of the tuple.
type rangeMap = { [id: LogicalComputeElement]: span }
const valid_lane_range : rangeMap = { "Mul": [0,31], "Int": [0,31], "Extin": [16,31], "Extout": [8,15], "Daq": [0,7], "Const": [0,31] }

/// A named input or output from a LogicalComputeElement
type InputOutputName = string|null

/**
 * Logical Compute Element (=unrouted unphysical computing element)
 **/
export class LogicalComputeElement {
    type: LogicalComputingElementType;
    id: number;

    constructor(type: LogicalComputingElementType, id: number) {
        this.type = type; this.id = id   }

    /// Regexp for string encoding
    static strStructure = /(?<type>[a-zA-Z]+)(?<id>\d+)/;

    // destruct a node id string to their parts
    static fromString(s: string): LogicalComputeElement {
        const r = this.strStructure.exec(s)
        if (!r || !r.groups) { console.error(s, r); throw new TypeError("Invalid LogicalComputeElement identifier, does not match strStructure") }
        else return new LogicalComputeElement(r.groups.type as LogicalComputingElementType, Number(r.groups.id))
    }

    toString(): string { return `${this.type}${this.id}` }

    /// Simple Pick&Place assignment of a logical computing element to a cross lane,
    /// straight using the id requested in the type.
    /// This will return the mblock output crosslane suitable for U-block input
    mblock_output_clane(): number | "NotAssignable" {
        if (virtual_elements.has(this.type)) throw new Error("Can only assign lanes to computing elements with M-Block equivalent")
        if (this.id < 0) throw new Error("Expecting id to be greater equal 0")
        switch (this.type) {
            case "Int":
                if (this.id > 8) return "NotAssignable"
                return Number(this.id)
            case "Mul":
                if (this.id > 4) return "NotAssignable"
                return 8 + Number(this.id)
            default:
                console.error(this)
                throw new Error("Unexpected type of LogicalComputeElement")
        }
    }

    /// Same as mblock_output_lane but the input, suitable for I-block output
    mblock_input_clane(port?: string): number | "NotAssignable" {
        if (virtual_elements.has(this.type)) throw new Error("Can only assign lanes to computing elements with M-Block equivalent")

        if (this.id < 0) throw new Error("Expecting id to be greater equal 0")
        switch (this.type) {
            case "Int":
                if (port && port != "in") throw new Error("Integrator has only one input ports.")
                if (this.id > 8) return "NotAssignable"
                return Number(this.id)
            case "Mul":
                if (port != "a" && port != "b") throw new Error("Multiplier has two input ports 'a' and 'b'. You must use one of them.")
                if (this.id > 4) return "NotAssignable"
                const offset = port == "b" ? 1 : 0
                return 8 + 2 * Number(this.id) + offset
            default:
                console.error(this)
                throw new Error("Unexpected type of LogicalComputeElement")
        }
    }

    /// Inverse of mblock_output_clane. Exploiting the mblock output layout
    /// [int0,...int7,mul0,...mul3,ref,ref,ref,ref]
    static from_mblock_output_clane(number) : LogicalComputeElement {
        if(number < 0) throw new Error("Expecting number to be greater equal 0")
        if(number < 8) return new LogicalComputeElement("Int", number)
        if(number < 8+4) return new LogicalComputeElement("Mul", number-4)
        if(number < 16) return new LogicalComputeElement("Const", number-8-4) // Mul outputs currently can serve as constants.
        else throw new Error("Expecting number to be smaller 16")
    }

    /// Inverse of mblock_input_clane. Exploiting the mblock input layout
    /// [int0,...int7,mul0a,mul0b,...mul3a,mul3b]
    static from_mblock_input_clane(number) : [LogicalComputeElement,InputOutputName] {
        if(number < 0) throw new Error("Expecting number to be greater equal 0")
        if(number < 8) return [new LogicalComputeElement("Int", number), undefined]
        if(number < 16) return [new LogicalComputeElement("Mul", Math.floor((number-8)/2)), number%2==0 ? "a" : "b" ]
        else throw new Error("Expecting number to be smaller 16")
    }
}

/// Unrouted lane which can probably be mapped to a physical one.
export class LogicalLane {
    id: number

    constructor(id:number) { this.id = id }

    static strStructure = /lane(?<lane>\d+)/
    static fromString(s: string): LogicalLane {
        const r = this.strStructure.exec(s)
        if (!r || !r.groups) { console.error("Invalid LogicalLane identifier, does not match strStructure", s, r);
            return undefined
            //throw new TypeError("Invalid LogicalLane identifier, does not match strStructure")
        }
        else return new LogicalLane(Number(r.groups.lane))
    }

    toString(): string { return `lane${this.id}` }

    // "just give me some lane" kind of call
    static unassignedCounter = new UniqueCounter(1000)
    static any = (): LogicalLane => new LogicalLane(this.unassignedCounter.next())
}

/**
 * This is a logical route, i.e. a connection between two logical computing elements.
 */
export type LogicalRoute = {
    source: LogicalComputeElement,
    target: LogicalComputeElement,
    source_output?: InputOutputName,
    target_input?: InputOutputName,
    coeff: number, ///< coefficient weight on the lane
    lane?: LogicalLane ///< lane id
}

/// Routine for computing the UCI matrix from a list of physical routes.
/// This is basically an Array-of-Structures -> Structure-of-Arrays conversion (AoS2SoA)
export const routes2matrix = (routes: Array<PhysicalRoute>): ReducedConfig => ({
    u: range(32).map(lane => routes.filter(r => r.lane == lane).map(r => r.uin)).flat(),
    i: range(16).map(clane => routes.filter(r => r.iout == clane).map(r => r.lane)).flat(),
    c: range(32).map(lane => { const c = routes.find(r => r.lane == lane); return c ? c.cval : 0; })
});

/// Compute physical routes from UCI matrix. Inverse of routes2matrix; a SoA2AoS conversion.
export const matrix2routes = (matrix: ReducedConfig): PhysicalRoute[] =>
    zip(matrix.u, matrix.i, matrix.c)
    .map(([uin,cval,iout],lane)=>({lane, uin, cval, iout} as PhysicalRoute))
    .filter(r => r.cval != 0);

/// Compute the set of logical routes given a physical setup
//
// Note that we can ONLY add values covered by the alt signals, these are: Extin and Const.
// In contrast, Extout as well as Adc usage is not directly visible in the ClusterConfig, i.e.
// a PhysicalRoute{ uin=0, cval=0 } indicates the usage of ADC0 but any physical route which
// incidentally also allows ADC0 to listen can not be encoded in the ClusterConfig or PhysicalRoute[].
export const physical2logical = (routes: PhysicalRoute[], alt_signals?: UBlockAltSignals) : LogicalRoute[] => {
    const candidates = routes.map(pr => {
        const source = 
            (alt_signals && alt_signals.length >= 8 && alt_signals[pr.uin]) ?
            new LogicalComputeElement("Extin", pr.uin - 8) : (
                (alt_signals && alt_signals.length > 8 && alt_signals[8] && pr.uin == 8) ?
                new LogicalComputeElement("Const", 8) :
                LogicalComputeElement.from_mblock_output_clane(pr.uin)
            );
        const [target, target_input] = LogicalComputeElement.from_mblock_input_clane(pr.iout)
        return {
            source, target, target_input,
            coeff: pr.cval,
            lane: new LogicalLane(pr.lane)
        }
    })
    return candidates
}

// Transformations from Logical to Physical Routes, i.e. a simple "Pick & Place"
export const logical2physical = (unrouted: LogicalRoute[]): [PhysicalRoute[],UBlockAltSignals] => {
    // First handle virtual elements which require certain lanes or cross lanes
    let pinned = unrouted.filter(lr => !is_non_virtual(lr)).map({
    })


    // First handle only real elements, i.e. real routes
    let candidates = unrouted.filter(is_non_virtual).map((lr, ctr) => ({
        lane: ctr,
        uin: lr.source.mblock_output_clane(),
        cval: lr.coeff,
        iout: lr.target.mblock_input_clane(lr.target_input)
    } as PhysicalRoute))

    // Second handle virtual elements by rearranging lanes.
    unrouted.filter(lr => !is_non_virtual(lr)).forEach((lr, ctr) => {
        // First handle sinks: ADCs (Daq) and ACL_OUT (Extout)
        if(lr.target.type == "Daq" || lr.target.type == "Extout") {
            if(virtual_elements.has(lr.source.type))
                throw new Error("Cannot connect virtual element input with virtual element output.") // should collect errors instead
            // target lane is fixed by the sink
            const target_lane = valid_lane_range[lr.target.type][0] + lr.target.id

            const occupant_route_idx = candidates.findIndex(pr => pr.lane == target_lane)

            const source_clane = lr.source.mblock_output_clane() as number
            // The index of a first lane in the routing list where the source element is connected to
            const candidate_lane_idx = candidates.findIndex(pr => pr.uin == source_clane)
            const unpinned_candidate_lane_idx = candidates.findIndex(pr => pr.uin == source_clane && !Object.hasOwn(pr, "pinned_lane"))

            let route : PhysicalRoute;
            if(candidate_lane_idx < 0 /* && therefore also unpinned_candidate_lane_idx < 0 */) {
                // lane is free, not connected anywhere, add a route
                route = { lane: target_lane, pinned_lane: true, uin: source_clane, cval: 0, iout: undefined }
            } else if(unpinned_candidate_lane_idx >= 0) {
                // take first connection where we will enforce the fixed lr.target lane
                route = candidates[unpinned_candidate_lane_idx]
                route.lane = target_lane
                route.pinned_lane = true
                candidates.splice(unpinned_candidate_lane_idx, 1) // remove element from list
            } else if(candidate_lane_idx >= 0 && unpinned_candidate_lane_idx < 0) {
                throw new Error("logical2physical, Daq/Extout swapping: Found no unpinned route")
            }

            /// CONTINUE HERE

            if(occupant_route_idx >= 0) {
                // target lane is already occupied, need to move it
                const next_free_lane = next_free(candidates.map(pr => pr.lane))
                candidates[occupant_route_idx].lane = next_free_lane
            }

            candidates.push(route)
        } else if(lr.source.type == "Extin") {
            // ACL_IN can be fed at lanes 16..31
            if(virtual_elements.has(lr.target.type))
                throw new Error("Cannot connect virtual element output with virtual element input.")

            const possible_lanes = valid_lane_range[lr.source.type] as span // only lanes where ACL_IN can feed in
            const source_clane = 8 + lr.target.id // only clane where ACL_IN[id] can feed in.

            // check for conflicts on the clane, try to move them out of the possible_lanes range.
            enumerate(candidates).filter(([pr,idx]) => pr.uin == source_clane).map(([pr,idx])=> {
                if(inrange(pr.lane, possible_lanes)) {

                }
            })


        } else if(lr.source.type == "Const") {
            // Can get consts either from MMul OUT4..7 (=no alt signal) or from REF0.5 (=alt signal)

        } else {
            // should collect these errors somewhere instead.
            throw new Error("logical2physical: Illegal use of virtual elements (Daq/Extout are sinks, Extin/Const sources.)")
        }
    })

    const default_empty_ublock_alt_signals = times(8, 0)
    return [ candidates, default_empty_ublock_alt_signals ]
}



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

    /// raises error if connection fails
    async connect(endpoint: URL) {
        this.endpoint = endpoint
        return this.get_entities()
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

