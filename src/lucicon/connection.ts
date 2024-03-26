// Copyright (c) 2024 anabrid GmbH
// Contact: https://www.anabrid.com/licensing/
// SPDX-License-Identifier: MIT OR GPL-2.0-or-later

import { v4 as uuid } from 'uuid';
import type { SendEnvelope, RecvEnvelope, OutputCentricConfig } from './types'

const noop = () => new Promise<void>((resolve, reject) => resolve())

// compare with websocket readyStates: CONNECTING  | OPEN | CLOSING | CLOSED
export type connectionState = "offline" | "connecting" | "online" | "failed"

export type messageErrorTypes = "SyntaxError"|"NonAssignableMessage"

/**
 * The actual HybridController client class for the LUCIDAC.
 * 
 * This Javascript/Typescript based Hybridcontroller uses the Websocket
 * protocol or server, respectively, to connect to a LUCIDAC. This is because
 * it is intended to be used from a browser environment. Of course one could
 * also come up with a 
 * 
 * Usage is like:
 * 
 *   const hc = new HybridController(new URL("ws://1.2.3.4:5678/websocket"))
 *   await hc.query("status")
 * 
 * Note that this class is stateless, i.e. there is no connection hold.
 * This is because HTTP itself is stateless. You can change the endpoint
 * anytime.
 **/
export class HybridController {
    /** Mac address, determined by get_entities() */
    mac?: string
    /** the websocket, if connected */
    ws?: WebSocket

    /** Allows to callback when endpoint status changes
     * @TODO Should be probably an Event / or subscribable
    */
    onConnectionChange? : (new_state: connectionState) => void

    /**
     * Callback for incoming messages which cannot be treated.
     * Not dispatched on connection or websocket failures.
     * (For future: Not dispatched on custom unexpected out-of-band message types.)
     * 
     * @todo Use bindable events
     **/
    onMessageError? : (type: messageErrorTypes, data:any) => void

    /**
     * Mapping request ids to response promises
     * Note that the key typically is a string-encoded UUID but it is enforced neither
     * by client nor server.
     */
    private expected_responses = new Map<string, (data:RecvEnvelope)=>void >()

    constructor(endpoint? : URL) {
        if(endpoint) this.connect(endpoint)
        else if(this.onConnectionChange) this.onConnectionChange("offline")
    }

    /// raises error if connection fails
    async connect(endpoint: URL) {
        if(endpoint.protocol == "tcp")
            throw new Error("Raw TCP protocols (for usage in node.js) not yet supported, left as an exercise to the reader")

        if(this.is_connected()) await this.disconnect()

        if(this.onConnectionChange) this.onConnectionChange("connecting")

        this.ws = new WebSocket(endpoint)
        const that = this

        this.ws!.addEventListener("message", (event) => {
            let data : RecvEnvelope
            try {
                data = JSON.parse(event.data)
            } catch(e) {
                const err = e as SyntaxError
                if(that.onMessageError) that.onMessageError("SyntaxError", err)
                return
            }

            if("id" in data && data.id && that.expected_responses.has(data.id)) {
                that.expected_responses.get(data.id)!(data)
            } else {
                if(that.onMessageError) that.onMessageError("NonAssignableMessage", data)
            }
        })

        return new Promise<void>((resolve, reject) => {
            that.ws!.addEventListener("open", (event) => {
                if(that.onConnectionChange) that.onConnectionChange("online")
                resolve()
            }, { once: true })
            that.ws!.addEventListener("error", (event) => {
                if(that.onConnectionChange) that.onConnectionChange("failed")
                reject(event)
            }, { once: true })
        });

        // in the REST past we used to make this kind of "test query"
        // which also set the connectoion to failure. 
        // return this.get_entities() // defines this.mac
    }

    async disconnect() {
        this.ws?.close()
        this.expected_responses.clear()
        // TODO: Properly wait until closed...
        if(this.onConnectionChange) this.onConnectionChange("offline")
    }

    is_connected() { return Boolean(this.ws) }

    /**
     * Synchronous query-reply call to the HybridController.
     * 
     * This send a message to the HybridController and await the answers,
     * which is checked for correctness at envelope-level.
     * That is, the return value shall always be the msg object.
     */
    async query(msg_type: string, msg = {}) {
        console.info("HybridController: query", msg_type, this, msg)
        const envelope_sent = {
            id: uuid(),
            type: msg_type,
            msg: msg
        }
        const envelope_recv = await this.query_envelope(envelope_sent)

        if ("error" in envelope_recv) {
            const json_recv = JSON.stringify(envelope_recv)
            throw new Error(`HybridController returned error, sent ${JSON.stringify(envelope_sent)}, received ${json_recv}`)
        }
        if (envelope_recv['type'] == envelope_sent['type']) {
            return envelope_recv['msg'];
        } else {
            console.error("HybridController: Deviation from Query-Response principle. Sent this:", envelope_sent, "Received unexpected return message:", envelope_recv)
            return envelope_recv
        }
    }

    /**
     * Synchronous query-reply call to the HybridController, at envelope level.
     * You may want to use the higher level @see query method instead.
     */
    async query_envelope(envelope_sent: SendEnvelope) : Promise<RecvEnvelope> {
        const json_sent = JSON.stringify(envelope_sent);

        if(!this.ws)
            throw new Error("Requires an established connection, but no endpoint set.")

        if(this.ws.readyState != WebSocket.OPEN) {
            throw new Error(`Requires an established connection, but it is in state ${this.ws.readyState}`)
        }

        //if(!this.is_connectable())
        //    throw new Error("Requiring an endpoint to be set")

        /*if(this.endpoint_status == "failed" || this.endpoint_status == "offline") {
            this.set_endpoint_status("connecting")
        }

        const resp = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: json_sent
        })

        if (!resp.ok) {
            this.set_endpoint_status("failed")
            throw new Error(`HybridController XHR failed, wanted to send ${json_sent}, received ${resp.text()}`)
        } else {
            this.set_endpoint_status("online")
        }*/

        const delayedResponse = new Promise<RecvEnvelope>((resolve, reject) => {
            this.expected_responses.set(envelope_sent.id, (data:RecvEnvelope) => resolve(data))
        })

        this.ws.send(json_sent)

        return delayedResponse
    }

    async get_entities() {
        const entities_msg = await this.query("get_entities")
        const entities = entities_msg["entities"]

        this.mac = Object.keys(entities)[0]
        console.log("HybridController MAC = ", this.mac)

        if (!Object.hasOwn(entities[this.mac], "/0")) {
            console.error("get_entities: Expected /0 within ", entities)
        }

        if (Object.hasOwn(entities[this.mac], "/1")) {
            console.warn("get_entities: Ignoring more then Cluster 0.")
        }

        return entities;
    }

    async get_config(): Promise<OutputCentricConfig> {
        const config = (await this.query("get_config"));

        if (!Object.hasOwn(config["config"], "/0")) {
            console.error("get_config: Expected /0 within ", config)
        }

        if (Object.hasOwn(config["config"], "/1")) {
            console.warn("get_config: Ignoring more then Cluster 0.")
        }

        return config
    }

    async set_config(config: OutputCentricConfig) {
        if (!this.mac) {
            await this.get_entities()
        }

        const set_config_query = {
            "entity": [this.mac, /* Cluster 0*/ "0"],
            "config": config
        }

        console.log("set_config query with ", set_config_query)
        const reply = await this.query("set_config", set_config_query)
        console.log("set_config reply got ", reply)

        return reply // should preparse whether success or not.
    }
}

