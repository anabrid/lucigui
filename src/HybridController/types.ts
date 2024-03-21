/**
 * @module Type/Class/Interface definitions for the HybridController library
 **/

import { range, span, times } from './utils'

export const ncrosslanes = 16
export const nMblock = 2 // number of M blocks
export const nMout = ncrosslanes / nMblock // == 8
export const nlanes = 32

/** Internal Configuration for an Int M-Block */
export type IntState = { ic: number; k?: number }
export type MIntConfig = Array<IntState>  /* fixed size: 8 */

/** Auxiliary Internal Configuration for an U-Block */
export class UBlockAltSignals {
    // TODO: Why can signals be null?
    signals: Array<boolean> //| null /* fixed size 9 */
    constructor() { this.signals = times(9, false) }
    
    /// Enable or disable the ALT_SIGNAL_ACL[idx], i.e. the External input
    set_acl(acl_idx:number, enable:boolean=true) {
        if(acl_idx < 0 || acl_idx > 7) throw new TypeError(`Expected Extin ACL index in [0,7] but got ${acl_idx}.`)
        this.signals[acl_idx] = enable
    }
    has_acl(acl_idx?:number) { return  acl_idx ? this.signals[acl_idx] : false }

    acl2clane(acl_idx:number) { return acl_idx + 8 } // ACL_IN[idx] is on clane idx+8
    clane2acl(clane:number) { return clane>8 ? (clane - 8) : undefined }

    /// Enable or disable the constant input on clane 7
    set_alt_signal_ref_half(enable:boolean=true) { this.signals[8] = enable }
    has_alt_signal_ref_halt() { return this.signals && this.signals[8] }

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
    /** 32 numbers where each is in range [0,15] and defines the input crosslane for the given output lane */
    u: Array<number|null|undefined>,
    /** 32 coefficients in value [-20,+20] */
    c: Array<number|null|undefined>,
    /**
     * 32 numbers where each is in range [0,15] and defines the output crosslane for the given input lane.
     * This is basically "Iin" or "/I": "inputs" compare to the "Iout" and "Uin" naming in the route.
     * This is different from @see OutputCentriconfig where i has only a length of 16 and is a list of lists.
     **/
    i: Array<number|null|undefined>,
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
                elements: MIntConfig
            },
            "/M1": {},
            "/U": {
                outputs: Array<number | null>, /* fixed size: 32 */
                alt_signals?: UBlockAltSignals
            },
            "/C": {
                elements: Array<number> /* fixed size: 32 */
            },
            "/I": {
                // note how this describes the output where ReducedConfig "i" is defined by the inputs!
                outputs: Array<Array<number> | null> /* fixed size: 16 */
            }
        }
    }
}



/**
 * This 4-tuple defines a physical route: [ lane, uin, cval, iout ]
 * The same type is used in the firmware as well as various other clients.
 **/
export type PhysicalRoute = {
    /** Lane id (in c-block), in range [0,31] */
    lane: number,
    /** UBlock input crosslane = Mblock output crosslane, range [0,15] */
    uin: number,
    /** Coefficient value, float in range [-20.0, +20.0] */
    cval: number,
    /**
     * IBlock output crosslane = Mblock input crosslane, range [0,15].
     * The I-matrix does not need to be connected, for instance in ADC and ACL_OUT use.
     * Therefore, undefined is allowed.
     **/
    iout: number|undefined,
}



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

export const Daq = new VirtualSink("Daq", span(0, 8))
export const Extout = new VirtualSink("Extout", span(8, 16))
export const Extin = new VirtualSource("Extin", span(8, 16))
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
        if(!(typeName in ElementDescription.registry)) throw new TypeError(`Illegal ElementDescription: ${typeName}.`)
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
export interface MBlockSetup {
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


/**
 * A routed LogicalConnection which maps slightly more nicely to the PhysicalRoute.
 * This is an *intermediate result* of the logical2physical routing process and shall
 * not be used anywhere else.
 **/
export type LogicalRoute = {
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

/** Variant of PhysicalRouting, as used in import/export. */
export type RoutesConfig = AuxConfig | {
    routes: PhysicalRoute[]
}

/** The wrapper type for any message sent out by the HybridController */
export type SendEnvelope = {
    id: string,
    type: string,
    msg: object
}

/** Wrapper for any message received by the HybridContoller */
export type RecvEnvelope = SendEnvelope & {
    error?: string,
    error_code?: number,
}

/**
 * Meta information shall collect 
 **/
export type FileMetaInformation = {
    desc?: string,
    title?: string
}

/**
 * A serialization format for LUCIDAC circuits.
 * 
 * The idea of this serialization format is to cover as many formats
 * which fully describe the LUCIDAC analog circuit configuration as
 * available in this library. This allows for a lot of redundancy in
 * the type/JSON file!
 * 
 * By definition, at read-in, the most highlevel format SHOULD be
 * considered first. Inconsistencies MAY be checked and MAY result in
 * rejecting an input file as illegal. At write-out, any combination of
 * formats can be applied and these representations MUST be consistent.
 **/
export interface CircuitFileFormat {
    _meta?: FileMetaInformation,
    RoutesConfig?: RoutesConfig,
    ClusterConfig?: ClusterConfig,
    SendEnvelope?: SendEnvelope,
}
