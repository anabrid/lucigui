import {writable} from "svelte/store";

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
