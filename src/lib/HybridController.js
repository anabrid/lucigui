/**
 * A lean and mean minimal asynchronous LUCIDAC HybridController client
 * library in modern ECMAScript.
 **/

import { v4 as uuid } from 'uuid';

export const endpoint = 'http://192.168.68.60/api'

export async function query(msg_type, msg={}) {
    const envelope_sent = {
        id: uuid(),
        type: msg_type,
        msg: msg
    }
    const json_sent = JSON.stringify(envelope_sent);
    const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: json_sent
    })
    if(!resp.ok)
        throw new Error(`HybridController XHR failed, wanted to send ${json_sent}, received ${resp.text()}`)
    const envelope_recv = await resp.json()
    if("error" in envelope_recv) {
        const json_recv = JSON.stringify(envelope_recv)
        throw new Error(`HybridController returned error, sent ${json_sent}, received ${json_recv}`)
    }
    if(envelope_recv['type'] == envelope_sent['type']) {
        return envelope_recv['msg'];
    } else {
        console.error("HybridController: Deviation from Query-Response principle. Sent this:", envelope_sent, "Received unexpected return message:", envelope_recv)
        return envelope_recv
    }
}