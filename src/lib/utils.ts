import {writable} from "svelte/store";

/**
 * Access to build time global variables.
 * They are first defined in vite.config.js, then JSON-serialized in index.html
 * as window.luci_globals and "renamed" here for abstracted and clean usage.
 **/
type GlobalConstants = { [x:string]: string }
export const globals = window.luci_globals as GlobalConstants

export function get_hostname() {
    const { port, protocol, hostname, pathname } = window.location
    const sport = (port != 80 || port != 443) ? `:${port}` : ""
    const spathname = (pathname != "/") ? pathname : ""
    return `${protocol}//${hostname}${sport}${spathname}`
}

export const hostname = get_hostname()

export function toggle(initState: boolean ){
    let {subscribe, update} = writable(initState);
    const toggle = () => update(s => !s)
    return {subscribe, toggle}
}

export const slugify = (text) => text.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
