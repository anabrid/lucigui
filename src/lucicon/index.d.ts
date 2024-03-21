// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

/**
 * @module Lucicon: The LUCIDAC Hybrid Controller, Typescript implementation
 * 
 * A lean and mean minimal asynchronous LUCIDAC HybridController client
 * library in modern ECMAScript.
 * 
 * The module is written in TypeScript with a strict focus on dependencies:
 * 
 *   - Most code has no external dependencies
 *   - There is a single optional svelte.ts which depends on svelte-stores
 *     and svelte-writable-derived
 *   - vitest can be used for unit testing
 *   - There is no dependency to any lucidac-gui code
 * 
 **/

// A few arbitrary things here. The lib is more supposed to be used as
// direct imports from the particular files.
export { HybridController } from "./connection"
export { default as types } from "./types"
export { default as map }   from "./mappings"
