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
 * code and also *no* dependencies to any other code within this repository.
 * It is *standalone* with minimal dependencies to nodejs.
 * 
 * A number of stores depend on codes written in this file, for instance the
 * HybridControllerStores.ts or the FlowView/Store.ts.
 **/

import { logical_routes } from './svelte-stores';

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
export function union<T>(a:Array<T>,b:Array<T>) : Array<T> {return [...new Set([...a, ...b])] }

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
export type IntState = { ic: number; k?: number }
export type MIntConfig = Array<IntState>  /* fixed size: 8 */

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
 * Canonical names for completing the configuration of a LUCIDAC, when the UCI configuration
 * is given. There are several ways of defining the UCI configuration, either for instance
 * with @see ReducedConfig but also with @see PhysicalRoute[].
 **/
export interface AuxConfig {
    MInt: MIntConfig,
    Ualt: UBlockAltSignals
}

/**
 * This representation is used internally in the HybridController javascript library
 * and closely resembles the part ["config"]["/0"] in the OutputCentricConfig.
 **/
export type ClusterConfig = ReducedConfig & AuxConfig

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
    .map(([uin,iout,cval],lane)=>({lane, uin, cval, iout} as PhysicalRoute))
    .filter(r => r.cval && r.cval != 0);


/// Basically a type enum covering the supported logical compute elements in this code
// @TODO: Rename to something more sensible.
// export type LogicalComputingElementType = "Mul" | "Int" | "Extin" | "Extout" | "Daq" | "Const"

/**
 * The information direction indicates an output (source) or an input (sink).  
 */
export type InformationDirection = "Sink"|"Source"

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
 * This class also describes virtual compute elements:
 *  
 * A virtual compute element describes compute elements which are 
 * supposed to be used primarily in a circuit view: External inputs
 * and outputs as well as Constants and potentiometers.
 * 
 * Note that except potentiometers, all mentioned virtual compute elements
 * are either Sinks our Sources, i.e. have a clear direction.
 * 
 * Virtual compute elements have is_virtual=true. This flag is only used for
 * book-keeping in @see logical2physical.
 **/
export class ElementDescription {
    name: string
    inputs: string[]
    outputs: string[]
    is_virtual = false

    constructor(name:string, inputs=["in"], outputs=["out"]) {
        this.name=name; this.inputs=inputs; this.outputs=outputs; }
    make_virtual() { this.is_virtual=true; return this } /* chainable */
    
    toString() { return this.name }

    /**
     * The registry shall collect all instances of this class.
     * Actually this is a map from ComputeElementName -> ComputeElement,
     * but we don't have the type ComputeElementName defined yet.
     */
    static registry : { [name:string]: ElementDescription }
    static fromString = (name:string) : ElementDescription => this.registry[name]

    isSink() { return this.outputs.length==0 }
    isSource() { return this.inputs.length==0 }
}

/*
 * On compute element states:
 * 
 * By default, computing elements are stateless. That means they do not have
 * an internal state during analog computation. In contrast, computing elements
 * such as @see Int or @see Pot have a state (i.e k0, ic, or coefficient value).
 * 
 * 
 * We introduce a "dual" class hierarchy to represent this state in typescript.
 * We could also have opted in for actual sane element classes but since everything
 * is transpiled to JavaScript anyway, this seems to be the better way in terms of
 * runtime safety.
 */
/*
class ElementState {
    static registry : { [name:string]: ElementState }
    static fromString = (name:string) : ElementState => this.registry[name]
}
*/

/** A single Multiplier on the LUCIDAC, computes out = -(a*b). */
export const Mul = new ElementDescription("Mul", ["a", "b"])

/** A single Integrator on the LUCIDAC, computes out = + int(in).
 * @see IntState for stateful data */
export const Int = new ElementDescription("Int")

export class VirtualSink extends ElementDescription {
    /** where instances of this computing element are available */
    available_lanes : number[]

    constructor(name:string, lane_range:number[]) {
        super(name, ["sink"], [])
        this.make_virtual()
        this.available_lanes=lane_range
    }
}

export class VirtualSource extends ElementDescription {
    /** where instances of this computinge element are available */
    available_clanes : number[]

    constructor(name:string, available_clanes:number[]) {
        super(name, [], ["source"])
        this.make_virtual()
        this.available_clanes=available_clanes
    }
}

export const Daq = new VirtualSink("Daq", range(0, 8))
export const Extout = new VirtualSink("Extout", range(8, 16))
export const Extin = new VirtualSource("Extin", range(8, 16))
export const Const = new VirtualSource("Const", [8])

/** Potentiometers (DPTs, Digital Potentiometers) as they are available in the C-Block.
 * This is a "virtual" compute element as it has to be assigned to actual ones.
 */
export const Pot = new ElementDescription("Pot").make_virtual()
export type PotState = { coeff: number }

// See also the ComputeElementName type blow
ElementDescription.registry = Object.fromEntries([Mul, Int, Daq, Extout, Extin, Const, Pot].map(n => [n.name, n]))

/**
 * Union type which indicates a valid ComputeElement name.
 * We store names in subsequent types instead of references to the actual
 * objects to simplify the data structures in particular for import/export/serialization.
 * No need to copy along basic type structures over and over again.
 */
export type ElementName = "Mul"|"Int"|"Daq"|"Extout"|"Extin"|"Const"|"Pot"


/**
 * A Logical or physical Compute Element which is however numerated.
 * If this is a logical compute element, the id is unbound.
 * If this is a physical compute element, the id is bound by the number
 * of available computing elements of this type.
 * 
 * Note that this is not a generic of some ElementState hierarchy because
 * instances of this class are runtime-generated anyway so we loose
 * typescript information, in the moment.
 **/
export class AssignedElement {
    /**
     * This is a string for the sake of a lean runtime structure, i.e. we
     * do not want AssignedElement references at runtime but a small
     * AssignedElement object. Use @see type() for actual element access.
     **/
    typeName: ElementName;

    /**
     * An integer value enumerating the element in either some logical or
     * physical number range.
     **/
    id: number;

    /**
     * For stateful compute elements, such as Int or Pot, this holds an
     * object of state variables such as { ic: 0.15 }.
     */
    state?: Object;

    constructor(typeName: ElementName, id: number, state?: any) {
        if(!(typeName in ElementDescription.registry)) throw new TypeError(`Illegal ComputeElementName ${typeName}.`)
        this.typeName = typeName; this.id = id; if(state) this.state = state }

    /// Regexp for string encoding
    static strStructure = /(?<typeName>[a-zA-Z]+)(?<id>\d+)/;

    // destruct a node id string to their parts
    static fromString(s: string): AssignedElement {
        const r = this.strStructure.exec(s)
        if (!r || !r.groups) { console.error(s, r); throw new TypeError("Invalid AssignedComputeElement identifier, does not match strStructure") }
        else return new AssignedElement(
            r.groups.typeName as ElementName,
            Number(r.groups.id)
        )
    }

    /**
     * String representation.
     * Note that this representation NEVER exposes the state, in order
     * to be unique. The state is supposed as internal degree of freedom
     * that does not change any logical or physical element identification.
     * The string representation shall be usable as a unique id in the
     * specific element range.
     */
    toString(): string { return `${this.typeName}${this.id}` }

    type() { return ElementDescription.fromString(this.typeName) }
}


/**
 * The port of a (numerated) logical or physical Compute Element.
 * The port can either be an input (sink) or output (source), depending
 * on the compute element type.
 **/
export class AssignedElementPort extends AssignedElement {
    port: string // typically something like "in"|"out"|"a"|"b" or even "source"|"sink"

    constructor(typeName: ElementName, id: number, port: string) {
        super(typeName, id); this.port = port }
    
    toStringWithPort() : string { return `${this.typeName}${this.id}${this.port}` }
    static strStructure = /(?<typeName>[a-zA-Z]+)(?<id>\d+)(?<port>[a-zA-Z]+)/;

    static fromStringWithPort(base: string, port?: string): AssignedElementPort {
        if(port) {
            const r = AssignedElement.fromString(base) as AssignedElementPort
            r.port = port
            return r
        } else {
            const g = this.strStructure.exec(base)
            if(! g?.groups) { console.error(g,base); throw new TypeError("Invalid AssignedComputeElementPort identifier") }
            return new AssignedElementPort(
                g.groups.typeName as ElementName,
                Number(g.groups.id),
                g.groups.port
            )
        }
    }

    /** 
     * Check for equality. No magic involved. No syntactic sugar. Just call equals().
     */
    equals(other : AssignedElementPort) {
        return this.typeName == other.typeName && this.id == other.id && this.port == other.port
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
    port2clane(cep: AssignedElementPort) : number|"NotAssignable"

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
    clane2port(clane:number, mblock_as:InformationDirection) : AssignedElementPort
}

/**
 * Standard configuration with MInt and MMul.
 * 
 * This is the reference implementation for a standard setup, i.e. one
 * MMulBlock and MIntBlock. At least the slot positions are easily exchangable.
 * However, other setups are possible in LUCIDAC such as two MIntBlocks,
 * and require this class to be modified accordingly.
 **/
export const StandardLUCIDAC = new class  implements MBlockSetup {
    readonly type2slot = { "Mul": 0, "Int": 1 }
    readonly slot2type = array.invert(this.type2slot)

    // Constants for any LUCIDAC
    readonly clanes_per_slot = 8
    readonly num_slots = 8

    port2clane(el : AssignedElementPort) : number|"NotAssignable" {
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

    clane2port(clane:number, mblock_as:InformationDirection) : AssignedElementPort {
        const slotlane = clane % this.clanes_per_slot // going from [0,7]
        const slot = clane >= this.num_slots ? 1 : 0
        if(clane < 0 && clane > this.num_slots * this.clanes_per_slot)
            throw new Error(`Expecting 0 < clane < 16`)

        let ret = new AssignedElementPort(
            this.slot2type[slot] as ElementName,
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

/** Unrouted lane which can probably be mapped to a physical one.
 * @deprecated DONT USE THIS ANY MORE, use Pot instead.
 */
export class LogicalLane {
    id: number

    constructor(id:number) { this.id = id }

    static strStructure = /lane(?<lane>\d+)/
    static fromString(s: string): LogicalLane|undefined {
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
 * This is a logical connection, i.e. a connection between two logical computing elements.
 * 
 * In the special case that two LogicalConnections connect two physical computing elements,
 * they can be mapped directly onto a @see PhysicalRoute (or a @see LogicalRoute). Otherwise,
 * a routing algorithm has to take place which is implemented by @see physical2logical.
 */
export type LogicalConnection = {
    source: AssignedElementPort,
    target: AssignedElementPort
}

const is_non_virtual = (lr:LogicalConnection) : boolean => !lr.source.type().is_virtual && !lr.target.type().is_virtual

/** Compute the set of logical routes given a physical setup
 *
 * Note that we can ONLY add values covered by the alt signals, these are: Extin and Const.
 * In contrast, Extout as well as Adc usage is not directly visible in the ClusterConfig, i.e.
 * a PhysicalRoute{ uin=0, cval=0 } indicates the usage of ADC0 but any physical route which
 * incidentally also allows ADC0 to listen can not be encoded in the ClusterConfig or PhysicalRoute[].
 * 
 * Note that this algorithm will map each lane with a single @see Pot element and fan-outs or
 * "savings" of additional Pots will not be detected. That means the logical route network will
 * not be "minimal" in terms of Potentiometers. However, the same is true with any other computing
 * element. There is simply no optimization taking place here.
 **/
export const physical2logical = (routes: PhysicalRoute[], alt_signals?: UBlockAltSignals) : LogicalConnection[] => {
    let const_counter = 0
    const candidates = routes.flatMap(pr => {
        let source = null
        if(alt_signals?.has_acl(alt_signals.clane2acl(pr.uin)))
            source = new AssignedElementPort("Extin", alt_signals.clane2acl(pr.uin) as number, "source")
        else if(alt_signals?.has_alt_signal_ref_halt() && pr.uin == UBlockAltSignals.ref_halt_clane)
            source = new AssignedElementPort("Const", const_counter++, "source")
        else
            source = StandardLUCIDAC.clane2port(pr.uin, "Source")
        const target = StandardLUCIDAC.clane2port(pr.iout, "Sink")
        const coeff_in = new AssignedElementPort("Pot", pr.lane, "in")
        const coeff_out = new AssignedElementPort("Pot", pr.lane, "out")
        return [{ source, target:coeff_in }, {source:coeff_out, target}]
    })
    return candidates
}

/**
 * A routed LogicalConnection which maps slightly more nicely to the PhysicalRoute.
 * This is an *intermediate result* of the logical2physical routing process and shall
 * not be used anywhere else.
 **/
type LogicalRoute = {
    source?: AssignedElementPort,
    target?: AssignedElementPort,
    /** coefficient weight on the lane, if assigned, in range [-20,+20] */
    coeff?: number,
    /** lane id, if assigned, in range [0,31] */
    lane?: number,
    /** Just a flag for the compiler */
    mark?: boolean
}

export type RoutingError = { msg: string, lc?: LogicalConnection, lr?: LogicalRoute }
export const is_routing_error = (roe : LogicalRoute | PhysicalRoute | RoutingError) : boolean => "msg" in roe

/** Describes the output of a logical->physical "pick&place compiler" process
 * @todo: Consider renaming alt_signals -> Ualt as in @see AuxConfig
 **/
export type PhysicalRouting = {
    routes : PhysicalRoute[],
    errors?: RoutingError[],
    alt_signals: UBlockAltSignals
}

/**Transformations from Logical to Physical Routes, i.e. a simple "Pick & Place" */
export const logical2physical = (unconnected: LogicalConnection[]): PhysicalRouting => {
    let alt_signals = new UBlockAltSignals()
    let errors : RoutingError[] = []
    const strip_off_routing_errors = <R extends LogicalRoute | PhysicalRoute>(lst: (R | RoutingError)[]) : R[] =>
        lst.filter(roe => {
            if(is_routing_error(roe)) errors.push(roe as RoutingError)
            return !is_routing_error(roe)
        }) as R[]
    const lane = (pr : PhysicalRoute) => pr.lane // handy shorthand in .map(lane)

    // Map LogicalConnection[] to LogicalRoute[], i.e. resolve Pot nodes.
    // First step, prepare unconnected LogicalRoutes, i.e. LogicalRoutes which either
    // connect {source, poti} or {poti, target}. These parts are connected in the next
    // iteration.
    let routes = strip_off_routing_errors(unconnected.map((lc) : (LogicalRoute|RoutingError) => {
        const {source,target} = lc
        const source_type = source.type()
        const target_type = target.type()

        // basic checks
        if(source_type.isSink())
            return <RoutingError> { msg: `Cannot treat element ${source} as a source since it is a Sink`, lc }
        if(target_type.isSource())
            return <RoutingError> { msg: `Cannot treat element ${source} as a target since it is a Source`, lc }
        if(source_type.is_virtual && target_type.is_virtual)
            return <RoutingError> { msg: `Cannot connect two virtual elements ${source} and ${target}.`, lc }

        if(!source || !target)
            return <RoutingError> { msg: "Unconnected graph", lc } 


        if(source_type == Pot || target_type == Pot) {
            // Have to setup that {source,poti} or {poti,target} type of routes
            let poti = (target_type == Pot) ? target : source
            const default_coefficient_value = 1 // assume the potentiometer is set there intentionally.
            const coeff = poti?.state !== undefined ? (poti.state as number) : default_coefficient_value
            return {
                lane: poti.id,
                coeff,
                source: (source_type == Pot) ? undefined : source,
                target: (target_type == Pot) ? undefined : target
            }
        } else if(!source_type.is_virtual && !target_type.is_virtual) {
            // Can directly connect two physical computing elements with coeff=1
            const coeff = 1.0
            return {
                coeff,
                source, target,
                lane: undefined
            }
        } else {
            // physical->virtual or virtual->physical connection. Will be handled later
            return lc
        }
    })) // as LogicalRoute[]

    //console.log("logical2physical routes 1st", routes)

    // The connection-searching algorithm works like the following:
    //    [physical]--->(poti)   (poti)---->[physical]   Identify two pairs by same lane
    // In case of a fan-out configuration as in...
    //    [physical]--->(poti)   (poti)---->[physical]  \  all sharing same poti=
    //                           (poti)---->[physical]  |  same lane
    //                           (poti)---->[physical]  /
    // ...this will complete the right side routes and mark the left side one as to be
    // deleted, as it is redundant to at least one of the fan out routes.
    routes.forEach((lr,lridx) => {
        // probably have to ensure that we touch only these Pot half-connections we 
        // worked on in the previous step, nothing else.
        if(!lr.source) {
            const sridx = routes.findIndex(sr => !sr.target && sr.lane == lr.lane)
            if(sridx >= 0) {
                const sr = routes[sridx]
                routes[lridx].source = sr.source
                routes[sridx].mark = true
            }
        }
    })

    console.log("logical2physical routes 2nd", routes)

    // Pot to route rewriting, cleanup step: Delete marked (=double) lanes and delete unconnected.
    routes = strip_off_routing_errors(
        routes.filter(lr => ! lr?.mark)
        .map(lr => (!lr.source || !lr.target) ? <RoutingError> { msg: "Unconnected graph (potentially unconnected potentiometers)", lr } : lr)
    )

    console.log("logical2physical routes 3rd", routes)

    // Handle virtual sinks and sources which require certain lanes or cross lanes
    let pinned = strip_off_routing_errors(
        routes.filter(lr => lr.source.type().is_virtual || lr.target.type().is_virtual).map(lr => {
        const source_type = lr.source.type()
        const target_type = lr.target.type()

        // moved to above
        /*
        if(source_type.isSink())
            return <RoutingError> { msg: `Cannot treat element ${lr.source} as a source since it is a Sink`, lr }
        if(target_type.isSource())
            return <RoutingError> { msg: `Cannot treat element ${lr.source} as a target since it is a Source`, lr }
        if(source_type.is_virtual && target_type.is_virtual)
            return <RoutingError> { msg: `Cannot connect two virtual elements ${lr.source} and ${lr.target}.`, lr }
        */

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
                //cval: lr.coeff,
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

    // Handle the real elements, i.e. real routes.
    let flexible = strip_off_routing_errors(routes.filter(is_non_virtual).map((lr, ctr) => {
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

