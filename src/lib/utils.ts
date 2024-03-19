import {writable} from "svelte/store";


export function get_hostname() {
    const { port, protocol, hostname, pathname } = window.location
    const sport = (port != 80 || port != 443) ? `:${port}` : ""
    const spathname = (pathname != "/") ? pathname : ""
    return `${protocol}//${hostname}${sport}${spathname}`
}

export const hostname = get_hostname()

/**
 * toggle() returns a svelte store that can be used for steering a boolean.
 * Usage:
 * 
 *   const instance = toggle(true)
 *   <p>Boolean value is {$instance}
 *   <a on:click={instance.toggle}>change it</a>
 * 
 * Note how readout is the store's value but toggle is not working on the
 * store dollar value but the store itself.
 */
export function toggle(initState: boolean) {
    let {subscribe, update} = writable(initState);
    const toggle = () => update(s => !s)
    return {subscribe, toggle}
}

export const slugify = (text) => text.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

export function isValidHttpUrl(string:string) {
    // source: https://stackoverflow.com/a/43467144
    let url;
    
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
}
 
// https://stackoverflow.com/a/65939108
export function saveJsonAsFile(filename:string , dataObjToWrite:any) {
  const blob = new Blob([JSON.stringify(dataObjToWrite, null, 4)], { type: "text/json" });
  const link = document.createElement("a");

  link.download = filename;
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

  const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
  });

  link.dispatchEvent(evt);
  link.remove()
};
