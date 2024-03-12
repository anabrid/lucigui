// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

/**
 * @file The LUCIDAC Hybrid Controller, Typescript implementation
 * 
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
import array from 'lodash'

// abbreveating exceptions
// tryOr(()=>something, )
export function tryOr<T>(f:(()=> T), err:T): T {try{ return f() } catch(e) { return err; }}
// This would also be nice: tryCall(callee, args...).Or()

export const ncrosslanes = 16
export const nMblock = 2 // number of M blocks
export const nMout = ncrosslanes / nMblock // == 8
export const nlanes = 32

/** range([start=0], end), does not include end.
 *  range(N) makes array [0,....,N-1], as in python. */
export const range = array.range
export const xrange = (N) => Array(N).keys() // iterator, slightly less powerful then range.
//export type span = [number,number]
//export const inrange = (needle : number, range : span) => (needle >= range[0] && needle <= range[1])
export const times = (N, val) => Array.from({ length: N }, (v, i) => val)
// slow but safe. The clone shall not be reactive or so.
// Maybe use sructured clone instead.
export const deepcopy = (obj) => JSON.parse(JSON.stringify(obj))
export const shallowcopy = (obj) => Object.assign({}, obj)
export const clone = deepcopy

// TypeScript zip implementation: zip("abc", "def") = [["a","d"], ["b","e"], ["c","f"]]
export const zip = (...arr) => Array(Math.max(...arr.map(a => a.length))).fill().map((_,i) => arr.map(a => a[i]));  

export function enumerate<T>(ary:T[]) : Array<[T,number]> { return ary.map((x,idx)=>[x,idx]) }
export const duplicates = (array) => array.filter((e, i, a) => a.indexOf(e) !== i)
const union = array.union // lodash

// map crosslanes into their input meaning
export const Mname = (clane) => (clane < 8) ? `<i>I</i><sub>${clane}</sub>` : `<i>M</i><sub>${clane - 8}</sub>`

export class UniqueCounter {
    count: number;
    constructor(init = 0) { this.count = init }
    next = (): number => this.count++
}

/** Retrieves next free number in a list of numbers. This will also exploit
    gaps in non-continous input lists. */
export const next_free = (occupied_numbers: number[]): number => {
    const free_ids = range(occupied_numbers.length + 1)
    const candidates = free_ids.filter(x => !occupied_numbers.includes(x))
    if(candidates.length < 1) throw new Error("next_free_id: Assumption failed.")
    return candidates[0]
}

/** Internal Configuration for an Int M-Block */
type MIntConfig = Array<{ "ic": number, "k": number }>  /* fixed size: 8 */

/** Auxiliary Internal Configuration for an U-Block */
class UBlockAltSignals {
    // TODO: Why can signals be null?
    signals: Array<boolean> | null /* fixed size 9 */
    constructor() { this.signals = times(9, false) }
    
    /// Enable or disable the ALT_SIGNAL_ACL[idx], i.e. the External input
    set_acl(acl_idx:number, enable:boolean=true) {
        if(acl_idx < 0 || acl_idx > 7) throw new TypeError(`Expected Extin ACL index in [0,7] but got ${acl_idx}.`)
        this.signals[acl_idx] = enable
    }
    has_acl = (acl_idx?:number) => acl_idx ? this.signals[acl_idx] : false

    acl2clane = (acl_idx:number) => acl_idx + 8 // ACL_IN[idx] is on clane idx+8
    clane2acl = (clane:number) => clane>8 ? (clane - 8) : undefined

    /// Enable or disable the constant input on clane 7
    set_alt_signal_ref_half = (enable:boolean=true) => this.signals[8] = enable
    has_alt_signal_ref_halt = () => this.signals && this.signals[8]

    static ref_halt_clane = 7 // ref halt is on clane 7
}
// type UBlockAltSignals = Array<number> | null /* fixed size 9 */

/**
 * This representation is used internally in the HybridController javascript library or the
 * associated GUI.
 * 
 * @todo: rename u/c/i to U/C/I
 */
export interface ReducedConfig {
    "u": Array<number|undefined>, /* 32 numbers where each is in range [0,15] and defines the input crosslane for the given output lane */
    "c": Array<number|undefined>, /* 32 coefficients in value [-20,+20] */
    "i": Array<number|undefined>, /* 32 numbers where each is in range [0,15] and defines the output crosslane for the given input lane */
}

/**
 * This representation is used internally in the HybridController javascript library
 * and closely resembles the part ["config"]["/0"] in the OutputCentricConfig.
 **/
export type ClusterConfig = ReducedConfig & {
    MInt: MIntConfig,
    Ualt: UBlockAltSignals
}

export const default_empty_cluster_config = () : ClusterConfig => ({
    u: [], c: [], i: [],
    MInt: times(8, { ic: 0, k: 1000 }),
    Ualt: new UBlockAltSignals()
})

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


/** Routine for computing the UCI matrix from a list of physical routes.
 *  This is basically an Array-of-Structures -> Structure-of-Arrays conversion (AoS2SoA)
 **/
export const routes2matrix = (routes: Array<PhysicalRoute>): ReducedConfig => ({
    u: range(32).map(lane => routes.filter(r => r.lane == lane).map(r => r.uin)).flat(),
    i: range(16).map(clane => routes.filter(r => r.iout == clane).map(r => r.lane)).flat(),
    c: range(32).map(lane => { const c = routes.find(r => r.lane == lane); return c ? c.cval : 0; })
});

/** Compute physical routes from UCI matrix. Inverse of routes2matrix; a SoA2AoS conversion. */
export const matrix2routes = (matrix: ReducedConfig): PhysicalRoute[] =>
    zip(matrix.u, matrix.i, matrix.c)
    .map(([uin,cval,iout],lane)=>({lane, uin, cval, iout} as PhysicalRoute))
    .filter(r => r.cval && r.cval != 0);


/// Basically a type enum covering the supported logical compute elements in this code
// @TODO: Rename to something more sensible.
// export type LogicalComputingElementType = "Mul" | "Int" | "Extin" | "Extout" | "Daq" | "Const"

/** The information direction indicates an output (source) or an input (sink) */
type InformationDirection = "Sink"|"Source"

/*
type targetMap = { [id: LogicalComputeElement]: InformationDirection }
 virtual elements which have M-block equivalent 
const virtual_elements : targetMap = {"Extin": "Source", "Extout": "Sink", "Const": "Source", "Daq": "Sink"}


type rangeMap = { [id: LogicalComputeElement]: span }
// lane ranges where logical elements can connect to.
    //The ranges include the beginning and end of the tuple. 
const valid_lane_range : rangeMap = { "Mul": [0,31], "Int": [0,31], "Extin": [16,31], "Extout": [8,15], "Daq": [0,7], "Const": [0,31] }
*/

/**
 * A Compute Element is an abstract structure model describing the name,
 * input and output slots. It does not describe the behaviour, despite a
 * basic description shall be part of the comments.
 * 
 * The modeling in this library follows closely the hardware. That means
 * we describe ONLY the compute elements on M-Blocks. There is no
 * explicit compute element for implicit summation as it is done in the
 * LUCIDAC U-C-I matrix.
 * 
 * A compute element can be instanced in terms of a logical, unrouted computing
 * element, @see LogicalComputeElement. It can also be instanced in terms of
 * a physical, routed computing element. We have no class for that right now.
 * 
 **/
export class ComputeElement {
    name: string
    inputs: string[]
    outputs: string[]
    is_virtual: boolean

    constructor(name:string, inputs=["in"], outputs=["out"]) {
        this.name=name, this.inputs=inputs, this.outputs=outputs }
    
    toString = () => this.name

    /**
     * The registry shall collect all instances of this class.
     * Actually this is a map from ComputeElementName -> ComputeElement,
     * but we don't have the type ComputeElementName defined yet.
     */
    static registry : { [name:string]: ComputeElement }
    static fromString = (name:string) : ComputeElement => this.registry[name]
}

/**
 * A real compute element type which knows at which clanes it sits.
 */
export class MblockComputeElement extends ComputeElement {
    is_virtual = false
    input2clane : (port: string) => number
    output2clane : (port: string) => number
}

/** A single Multiplier on the LUCIDAC, computes out = -(a*b). */
export const Mul = new MblockComputeElement("Mul", ["a", "b"])

/** A single Integrator on the LUCIDAC, computes out = + int(in). */
export const Int = new MblockComputeElement("Int")

/**
 * A virtual compute element describes compute elements which are used
 * primarily in the FlowView: External inputs and outputs as well as
 * Constants.
 * 
 * A virtual compute element can only serve either as input (source) or
 * output (sink). They also have only up to one input or outputs.
 * 
 **/
export class VirtualComputeElement extends ComputeElement {
    is_virtual = true
    direction: InformationDirection

    constructor(name:string, direction:InformationDirection) {
        if(direction=="Sink") super(name, ["sink"], []);
        else super(name, [], ["source"])
        this.direction=direction }
}

export class VirtualSink extends VirtualComputeElement {
    /** where instances of this computing element are available */
    available_lanes : number[]

    constructor(name:string, lane_range:number[]) {
        super(name, "Sink")
        this.available_lanes=lane_range
    }
}

export class VirtualSource extends VirtualComputeElement {
    /** where instances of this computinge element are available */
    available_clanes : number[]

    constructor(name:string, available_clanes:number[]) {
        super(name, "Source")
        this.available_clanes=available_clanes
    }
}

export const Daq = new VirtualSink("Daq", range(0, 8))
export const Extout = new VirtualSink("Extout", range(8, 16))
export const Extin = new VirtualSource("Extin", range(8, 16))
export const Const = new VirtualSource("Const", [8])

// See also the ComputeElementName type blow
ComputeElement.registry = Object.fromEntries([Mul, Int, Daq, Extout, Extin, Const].map(n => [n.name, n]))

/**
 * Union type which indicates a valid ComputeElement name.
 * We store names in subsequent types instead of references to the actual
 * objects to simplify the data structures in particular for import/export/serialization.
 * No need to copy along basic type structures over and over again.
 */
export type ComputeElementName = "Mul"|"Int"|"Daq"|"Extout"|"Extin"|"Const"


/**
 * A Logical or physical Compute Element which is however numerated.
 * If this is a logical compute element, the id is unbound.
 * If this is a physical compute element, the id is bound by the number
 * of available computing elements of this type.
 **/
export class AssignedComputeElement {
    typeName: ComputeElementName;
    id: number;

    constructor(typeName: ComputeElementName, id: number) {
        if(!(typeName in ComputeElement.registry)) throw new TypeError(`Illegal ComputeElementName ${typeName}.`)
        this.typeName = typeName; this.id = id   }

    /// Regexp for string encoding
    static strStructure = /(?<typeName>[a-zA-Z]+)(?<id>\d+)/;

    // destruct a node id string to their parts
    static fromString(s: string): AssignedComputeElement {
        const r = this.strStructure.exec(s)
        if (!r || !r.groups) { console.error(s, r); throw new TypeError("Invalid AssignedComputeElement identifier, does not match strStructure") }
        else return new AssignedComputeElement(r.groups.typeName as ComputeElementName, Number(r.groups.id))
    }

    toString(): string { return `${this.typeName}${this.id}` }
    type() { return ComputeElement.fromString(this.typeName) }

    is_virtual() { return  "virtual" in this.type() }
}

/**
 * The port of a (numerated) logical or physical Compute Element.
 * The port can either be an input (sink) or output (source), depending
 * on the compute element type.
 **/
export class AssignedComputeElementPort extends AssignedComputeElement {
    port: string // typically something like "in"|"out"|"a"|"b"

    constructor(typeName: ComputeElementName, id: number, port: string) {
        super(typeName, id); this.port = port }
    
    toStringWithPort() : string { return `${this.typeName}${this.id}${this.port}` }
    static strStructure = /(?<typeName>[a-zA-Z]+)(?<id>\d+)(?<port>[a-zA-Z]+)/;

    static fromStringWithPort(base: string, port?: string): AssignedComputeElementPort {
        if(port) {
            const r = AssignedComputeElement.fromString(base) as AssignedComputeElementPort
            r.port = port
            return r
        } else {
            const g = this.strStructure.exec(base)
            if(! g?.groups) { console.error(g,base); throw new TypeError("Invalid AssignedComputeElementPort identifier") }
            return new AssignedComputeElementPort(
                g.groups.typeName as ComputeElementName,
                Number(g.groups.id),
                g.groups.port
            )
        }
    }

    direction() : InformationDirection|undefined {
        if(this.type().inputs.includes(this.port)) return "Sink" // input
        if(this.type().outputs.includes(this.port)) return "Source" // output
        return undefined // invalid
    }
}

/** 
 * A concrete setup of two MBlocks, i.e. one entity configuration of LUCIDAC
  */
interface MBlockSetup {
    /**
     * Simple Pick&Place assignment of a logical computing element to a cross lane,
     * straight using the id requested in the type.
     * Depending on the element port, this shall either return an mblock output
     * crosslane suitable for U-Block input OR
     * an mblock input crosslane suitable for I-Block output.
     **/
    port2clane(cep: AssignedComputeElementPort) : number|"NotAssignable"

    /** 
     * Inverse of port2clane.
     * 
     * In case of mblock_as=Source, it exploits the mblock output layout
     * which is, for instance for the StandardLUCIDAC:
     * [int0,...int7,mul0,...mul3,ref,ref,ref,ref].
     * 
     * In case of mblock_as=Sink, exploits the mblock input layout, which is,
     * for instance for the StandardLUCIDAC:
     * [int0,...int7,mul0a,mul0b,...mul3a,mul3b]
     **/
    clane2port(clane:number, mblock_as:InformationDirection) : AssignedComputeElementPort
}

/**
 * Standard configuration with MInt and MMul.
 * 
 * This is the reference implementation for a standard setup, i.e. one
 * MMulBlock and MIntBlock. At least the slot positions are easily exchangable.
 * However, other setups are possible in LUCIDAC such as two MIntBlocks,
 * and require this class to be modified accordingly.
 **/
const StandardLUCIDAC = new class  implements MBlockSetup {
    readonly type2slot = { "Mul": 0, "Int": 1 }
    readonly slot2type = array.invert(this.type2slot)

    // Constants for any LUCIDAC
    readonly clanes_per_slot = 8
    readonly num_slots = 8

    port2clane(el : AssignedComputeElementPort) : number|"NotAssignable" {
        const {id, port} = el
        if(el.type().is_virtual) return "NotAssignable" // throw new Error("Can only assign clanes to computing elements with M-Block equivalent")
        if(id < 0) throw new Error("Expecting id to be greater equal 0")
        switch (el.typeName) {
            case "Int":
                if(port != "in" && port != "out") throw new Error(`Integrator ComputeElement has only one input/output. Unavailable port ${port}`)
                if (id > 8) return "NotAssignable"
                return this.type2slot["Int"] * this.clanes_per_slot + id
            case "Mul":
                if (port != "out" && port != "a" && port != "b") throw new Error(`Multiplier ComputeElement has inputs a and b and output out. Unavailable port ${port}`)
                if (id > 4) return "NotAssignable"
                return this.type2slot["Mul"] * this.clanes_per_slot + (port == "out" ? id : (2*id + (port == "b" ? 1 : 0)))
            default:
                console.error(this)
                throw new Error(`Physical ComputeElement type ${el.typeName} not available at StandardLUCIDAC`)
        }
    }

    clane2port(clane:number, mblock_as:InformationDirection) : AssignedComputeElementPort {
        const slotlane = clane % this.clanes_per_slot // going from [0,7]
        const slot = clane > this.num_slots ? 1 : 0
        if(clane < 0 && clane > this.num_slots * this.clanes_per_slot)
            throw new Error(`Expecting 0 < clane < 16`)

        console.info("clane2port with ", clane, mblock_as, slotlane)
        let ret = new AssignedComputeElementPort(
            this.slot2type[slot] as ComputeElementName,
            slotlane,
            (mblock_as=="Source") ? "out" : "in"
        )

        if(ret.typeName == "Mul" && mblock_as=="Source" && ret.id > 4) {
            // Mul outputs currently can serve as constants.
            ret.typeName = "Const"
        }
        if(ret.typeName == "Mul" && mblock_as=="Sink") {
            ret.id = Math.floor(slotlane/2)
            ret.port = slotlane%2==0 ? "a" : "b"
        }

        return ret
    }
}

/** Unrouted lane which can probably be mapped to a physical one. */
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
 * 
 * Normally, logical routes are mapped onto Physical Routes. This requires @field coeff
 * to be set with some reasonable lane weight. Logical routes can also connect to a
 * virtual sink out of U block, avoiding the C block. In this case, @field coeff and
 * @field lane shall be undefined. @field lane can also be undefined if there is no
 * particular whish for a physical lane.
 */
export type LogicalRoute = {
    source: AssignedComputeElementPort,
    target: AssignedComputeElementPort,
    coeff?: number, ///< coefficient weight on the lane
    lane?: LogicalLane ///< lane id
}

const is_non_virtual = (lr:LogicalRoute) : boolean => !lr.source.is_virtual() && !lr.target.is_virtual()

/** Compute the set of logical routes given a physical setup
 *
 * Note that we can ONLY add values covered by the alt signals, these are: Extin and Const.
 * In contrast, Extout as well as Adc usage is not directly visible in the ClusterConfig, i.e.
 * a PhysicalRoute{ uin=0, cval=0 } indicates the usage of ADC0 but any physical route which
 * incidentally also allows ADC0 to listen can not be encoded in the ClusterConfig or PhysicalRoute[].
 **/
export const physical2logical = (routes: PhysicalRoute[], alt_signals?: UBlockAltSignals) : LogicalRoute[] => {
    let const_counter = 0
    const candidates = routes.map(pr => {
        let source = null
        if(alt_signals?.has_acl(alt_signals.clane2acl(pr.uin)))
            source = new AssignedComputeElementPort("Extin", alt_signals.clane2acl(pr.uin) as number, "Source")
        else if(alt_signals?.has_alt_signal_ref_halt() && pr.uin == UBlockAltSignals.ref_halt_clane)
            source = new AssignedComputeElementPort("Const", const_counter++, "Source")
        else
            source = StandardLUCIDAC.clane2port(pr.uin, "Source")
        const target = StandardLUCIDAC.clane2port(pr.iout, "Sink")
        return {
            source, target,
            coeff: pr.cval,
            lane: new LogicalLane(pr.lane)
        }
    })
    return candidates
}

export type RoutingError = { msg: string, lr: LogicalRoute }
export type PhysicalRouteOrError = PhysicalRoute | RoutingError
export const is_routing_error = (roe : PhysicalRouteOrError) : boolean => "msg" in roe

export type PhysicalRouting = {
    routes : PhysicalRoute[],
    errors: RoutingError[],
    alt_signals: UBlockAltSignals
}

/**Transformations from Logical to Physical Routes, i.e. a simple "Pick & Place" */
export const logical2physical = (unrouted: LogicalRoute[]): PhysicalRouting => {
    let alt_signals = new UBlockAltSignals()
    let errors : RoutingError[] = []
    const strip_off_routing_errors = (lst : PhysicalRouteOrError[]) =>
        lst.filter(roe => {
            if(is_routing_error(roe)) errors.push(roe)
            return !is_routing_error(roe)
        }) as PhysicalRoute[]
    const lane = (pr : PhysicalRoute) => pr.lane // handy shorthand in .map(lane)

    // First handle virtual elements which require certain lanes or cross lanes
    let pinned = strip_off_routing_errors(
        unrouted.filter(lr => lr.source.is_virtual || lr.target.is_virtual).map(lr => {
        const source_type = lr.source.type()
        const target_type = lr.target.type()

        if(source_type.is_virtual && (source_type as VirtualComputeElement).direction == "Sink")
            return <RoutingError> { msg: `Cannot treat virtual element ${lr.source} as a source since it is a Sink`, lr }
        if(target_type.is_virtual && (target_type as VirtualComputeElement).direction == "Source")
            return <RoutingError> { msg: `Cannot treat virtual element ${lr.source} as a target since it is a Source`, lr }
        if(source_type.is_virtual && target_type.is_virtual)
            return <RoutingError> { msg: `Cannot connect two virtual elements ${lr.source} and ${lr.target}.`, lr }

        if(target_type == Daq || target_type == Extout) {
            // First handle sinks: ADCs (Daq) and ACL_OUT (Extout)

            if(lr.coeff !== undefined && lr.coeff != 0 && lr.coeff != 1) {
                throw new Error(`Expecting virtual sinks (routing target) without non-trivial coefficient: ${lr}`)
            }

            // target lane is fixed (pinned) by the sink
            const lane = (target_type as VirtualSink).available_lanes[lr.target.id]
            // source clane is determined by the physical element output
            const source_clane = StandardLUCIDAC.port2clane(lr.source)
            if(source_clane == "NotAssignable")
                return <RoutingError> { msg: `source clane not assignable`, lr }

            // The route determines the U block but not the I block.
            return <PhysicalRoute> {
                lane,
                uin: source_clane,
                cval: 0,
                iout: undefined
            }
        } else if(source_type == Extin) {
            // ACL_IN can be fed at lanes 16..31.
            //const possible_lanes = valid_lane_range[lr.source.type] as span // only lanes where ACL_IN can feed in

            alt_signals.set_acl(lr.source.id)

            const iout = StandardLUCIDAC.port2clane(lr.target) // input/Sink
            if(iout == "NotAssignable")
                return <RoutingError> { msg: `target clane not assignable`, lr }

            return <PhysicalRoute> {
                // As we start with an empty U matrix, we are free to choose by convention always a fixed lane
                // for a given ACL_IN[id]
                lane: 16 + lr.source.id,
                // In contrast, this is the only clane where ACL_IN[id] can feed in. No choice here.
                uin:  8 + lr.source.id,
                cval: lr.coeff,
                iout
            }
        } else if(source_type == Const) {
            // By choice, we always choose the alt_signal 8 to get the constant
            // on clane 7. We don't exploit the 4 const refs on the MMul block in order
            // to remain free in choice for future alternative M blocks.

            alt_signals.set_alt_signal_ref_half()

            const iout = StandardLUCIDAC.port2clane(lr.target) // input/Sink
            if(iout == "NotAssignable")
                return <RoutingError> { msg: `target clane not assignable`, lr }

            return <PhysicalRoute> {
                lane: lr.lane ? lr.lane.id : undefined,
                uin: 7, // ALT Signal Ref 0.5 clane
                cval: lr.coeff,
                iout
            }            
        } else {
            return <RoutingError> { msg: `Illegal virtual element type ${lr.source} or ${lr.target}.`, lr }
        }
    }))

    // Correction step: need to check for the lanes in pinned: No overlap and if all lanes are defined.
    let valid_pinned_lanes = pinned.filter(pr => pr !== undefined).map(lane)
    pinned.forEach((pr,idx)=> {
        if(pr.lane === undefined || // happens with logical source lane "Const"
           duplicates(pinned.map(lane)).includes(pr.lane)
        )  pinned[idx].lane = next_free(valid_pinned_lanes)
    })

    // Second, handle the real elements, i.e. real routes.
    let flexible = strip_off_routing_errors(unrouted.filter(is_non_virtual).map((lr, ctr) => {
        const uin = StandardLUCIDAC.port2clane(lr.source)
        const iout = StandardLUCIDAC.port2clane(lr.target)
        if(uin == "NotAssignable") return <RoutingError> { msg: "physical source not assignable", lr }
        if(iout == "NotAssignable") return <RoutingError> { msg: "physical target not assignable", lr }
        return <PhysicalRoute> {
            lane: lr.lane ? lr.lane.id : ctr,
            uin, iout, cval: lr.coeff,
        }
    }))

    // Correction step: Ensure pinned lanes are not touched and no overlap of lanes
    const pinned_lanes = pinned.map(lane)
    const double_assigned_flexlanes = duplicates(flexible.map(lane))
    flexible.forEach((pr,idx) => {
        if(pinned_lanes.includes(pr.lane) ||
           duplicates(flexible.map(lane)).includes(pr.lane))
           pinned[idx].lane = next_free(union(pinned_lanes, flexible.map(lane)))
    })

    return { routes: union(pinned, flexible), errors, alt_signals }
}

/** Converts a PhysicalRouting to a ClusterConfig, ignoring any routing.errors */
export const routing2config = (routing: PhysicalRouting, mint: MIntConfig) : ClusterConfig => ({
    ...routes2matrix(routing.routes),
    ...{ MInt: mint, Ualt: routing.alt_signals }
})

export const config2routing = (conf: ClusterConfig) : PhysicalRouting => ({
    routes: matrix2routes(conf),
    errors: [],
    alt_signals: conf.Ualt
})


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
    mac?: string = null; ///< Mac address, determined by get_entities()

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

