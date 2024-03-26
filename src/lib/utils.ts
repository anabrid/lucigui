// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

import { zip } from "@/lucicon/utils";
import {writable} from "svelte/store";


export function get_hostname() {
    const { port, protocol, hostname, pathname } = window.location
    const sport = port ? (port.includes(":") ? port : `:${port}`) : ""
    const spathname = (pathname != "/") ? pathname : ""
    return `${protocol}//${hostname}${sport}${spathname}`
}

export const is_https = (url: string) => /^https/.test(url)

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

export const slugify = (text:string) => text.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

export function isValidHttpUrl(string:string) {
    // source: https://stackoverflow.com/a/43467144
    let url;
    
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
  
    return true // url.protocol === "http:" || url.protocol === "https:";
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

/**
 * Dynamically loads an external javascript at browser runtime.
 * Usage: loadScript("http://some/where.js").then(()=>{ alert("make us of it") })
 * Tip: You can compute the subresource integrity with https://www.srihash.org/
 */
export function loadScript(url: string, integrity?: string) {
  var script = document.createElement('script')
  script.src = url
  script.async = true
  if(integrity) {
      script.integrity = integrity
      script.crossOrigin = "anonymous"
  }
  document.head.appendChild(script);
  return new Promise<void>((resolve, reject) => {
    script.onload = () => resolve()
  })
}

export function millisecondUptimeToDate(ms:number) {
  const now = new Date().getTime()
  return new Date(now - ms/1000/1000)
}

export function humanReadableTimeSpan(from: Date, to?: Date) {
  if(!to) to = new Date()
  let diff = to.getTime() - from.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -=  days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const mins = Math.floor(diff / (1000 * 60));
  diff -= mins * (1000 * 60);
  const seconds = Math.floor(diff / (1000));
  diff -= seconds * (1000);

  const k = ["days", "hours", "minutes", "seconds"]
  const v = [days, hours, mins, seconds]
  console.log("time:", from, to, diff, v)
  return zip(k,v).map(([k,v]) => v ? `${v} ${k}` : "").filter(s=>s).join(", ")
}
