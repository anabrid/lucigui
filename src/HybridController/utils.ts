/**
 * @module Standalone js/ts utilities for the hc library.
 **/

// abbreveating exceptions
// tryOr(()=>something, )
export function tryOr<T>(f:(()=> T), err:T): T {try{ return f() } catch(e) { return err; }}
// This would also be nice: tryCall(callee, args...).Or()

/**  range(N) makes array [0,....,N-1], as in python. */
export const xrange = (N) => Array(N).keys() // iterator, slightly less powerful then range.
export const range = (N) => [...xrange(N)] // array
/** span([start=0], end), does not include end. */
export const span = (start, end) => range(end-start).map(i=>i+start)
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

/** Maps {A:a, B:b} to { a:A, b:B } */
export const reverse = (obj : Object) => Object.fromEntries(Object.entries(obj).map(kv=>kv.reverse()))

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
