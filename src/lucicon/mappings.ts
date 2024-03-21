// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

import {
    AssignedElementPort,
    Const,
    Daq,
    Extin,
    Extout,
    Pot,
    VirtualSink,
    is_routing_error,
    type ClusterConfig,
    type ElementName,
    type InformationDirection,
    type LogicalConnection,
    type MBlockSetup,
    type MIntConfig,
    type OutputCentricConfig,
    type PhysicalRoute,
    type PhysicalRouting,
    type ReducedConfig,
    type RoutingError,
    UBlockAltSignals,
    type LogicalRoute
} from './types'

import { duplicates, next_free, range, reverse, span, times, times_new, union, zip } from './utils'


export const default_empty_cluster_config = () : ClusterConfig => ({
    u: [], c: [], i: [],
    MInt: times(8, { ic: 0, k: 1000 }),
    Ualt: new UBlockAltSignals()
})

/**
 * Map an output-centric to an input-centric description.
 * This is basically a spare matrix transpose operation.
 * 
 * This works for both IBLock and UBlock descriptions, which both
 * only allow only one connection per lane. However, by convention
 * the firmware describes UBlock as input-centric and IBlock as
 * output-centric. Therefore the mapping is only needed to represent
 * the IBlock the same way as the UBlock.
 **/
export function output2input(output) { // : Array<Array<number> | number | null> /* size 16 */) : Array<number|null> /* size 32 */ {
    //const max_lane = Math.max.apply(null, output.flat())
    let input = times(32, null)
    output.forEach((lanes, clane) => {
        const set = lane => {
            if(lane > input.length) throw Error(`output2input: Output centric clane out of bounds: lane ${lane} for clane ${clane}`)
            if(lane !== undefined && lane !== null) {
                if(input[lane] !== null) {
                    throw Error(`output2input: Double allocation not representable by input representation.`)
                }
                input[lane] = clane
            }
        }
        if(lanes !== undefined && lanes !== null) {
            Array.isArray(lanes) ? lanes.forEach(set) : set(lanes)
        }
    })
    return input
}

/**
 * Inverse of @see input2output 
 **/
export function input2output(input, keep_arrays=false) { //: Array<number|null|undefined> /* size 32 */) : Array<Array<number> | null> /* size 16 */ {
    let output = times_new(16, ()=>[])
    input.forEach((clane, lane) =>{
        if(clane !== undefined && clane !== null) {
            if(clane > output.length) throw Error(`input2output: Input centric clane out of bounds: clane ${clane} for lane ${lane}`)
            output[clane].push(lane)
        }
    })
    // Firmware fun:
    // it is valid to shorten [foo] to foo
    // it is also valid to shorten [] to null
    return keep_arrays ? output : output.map(k => {
        if(k.length == 0) return null
        if(k.length == 1) return k[0]
        else return k
    })
}

export function output2reduced(output: OutputCentricConfig): ReducedConfig {
    let cluster_config = {
        "u": output["config"]["/0"]["/U"]["outputs"],
        "i": output2input(output["config"]["/0"]["/I"]["outputs"]),
        "c": output["config"]["/0"]["/C"]["elements"]
    }
    return cluster_config
}

export function reduced2output(cluster_config: ReducedConfig): OutputCentricConfig {
    let output = {
        "entity": "FIXME", // <- need to set real hc.mac here
        "config": {
            "/0": {
                "/M0": { "elements": [{ "ic": -1234, "k": 5678 }] }, // FIXME
                "/M1": {},
                "/U": { "outputs": cluster_config.u as Array<number | null> },
                "/I": { "outputs": input2output(cluster_config.i) },
                "/C": { "elements": cluster_config.c },
            }
        }
    }
    return output
}

/** Routine for computing the UCI matrix from a list of physical routes.
 *  This is basically an Array-of-Structures -> Structure-of-Arrays conversion (AoS2SoA)
 **/
export const routes2matrix = (routes: Array<PhysicalRoute>): ReducedConfig => ({
    u: range(32).map(lane => routes.filter(r => r.lane == lane).map(r => r.uin)).flat(),
    i: range(32).map(lane => routes.filter(r => r.lane == lane).map(r => r.iout)).flat(),
    c: range(32).map(lane => { const c = routes.find(r => r.lane == lane); return c ? c.cval : 0; })
});

/** Compute physical routes from UCI matrix. Inverse of routes2matrix; a SoA2AoS conversion. */
export const matrix2routes = (matrix: ReducedConfig): PhysicalRoute[] =>
    zip(matrix.u, matrix.i, matrix.c)
    .map(([uin,iout,cval],lane)=>({lane, uin, cval, iout} as PhysicalRoute))
    .filter(r => r.cval && r.cval != 0);


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
    readonly slot2type = reverse(this.type2slot)

    // Constants for any LUCIDAC
    readonly clanes_per_slot = 8
    readonly num_slots = 2

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
        const slot = clane >= this.clanes_per_slot ? 1 : 0
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

export const is_non_virtual = (lr:LogicalConnection) : boolean => !lr.source.type().is_virtual && !lr.target.type().is_virtual

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
            /** poti.state should be a @see PotState */
            const coeff = poti?.state?.coeff !== undefined ? poti.state.coeff : default_coefficient_value
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

    //console.log("logical2physical routes 2nd", routes)

    // Pot to route rewriting, cleanup step: Delete marked (=double) lanes and delete unconnected.
    routes = strip_off_routing_errors(
        routes.filter(lr => ! lr?.mark)
        .map(lr => (!lr.source || !lr.target) ? <RoutingError> { msg: "Unconnected graph (potentially unconnected potentiometers)", lr } : lr)
    )

    // console.log("logical2physical routes 3rd", routes)

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
            lane: lr.lane !== undefined ? lr.lane : ctr,
            uin,
            iout,
            cval: lr.coeff,
        }
    }))

    //console.log("logical2physical pinned", pinned, "flexible", flexible)

    // Correction step: Ensure pinned lanes are not touched and no overlap of lanes
    const pinned_lanes = pinned.map(lane)
    const double_assigned_flexlanes = duplicates(flexible.map(lane))
    flexible.forEach((pr,idx) => {
        if(pinned_lanes.includes(pr.lane) ||
           duplicates(flexible.map(lane)).includes(pr.lane))
           flexible[idx].lane = next_free(union(pinned_lanes, flexible.map(lane)))
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

