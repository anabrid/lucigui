import { v4 as uuid } from 'uuid';
import { type SendEnvelope, type RecvEnvelope } from './types'

export type endpoint_reachability = "offline" | "connecting" | "online" | "failed"

/**
 * The actual HybridController client class for the LUCIDAC.
 * Usage is like:
 * 
 *   const hc = new HybridController(new URL("http://1.2.3.4:5678/api"))
 *   await hc.query("status")
 * 
 * Note that this class is stateless, i.e. there is no connection hold.
 * This is because HTTP itself is stateless. You can change the endpoint
 * anytime.
 **/
export class HybridController {
    /** You should set the endpoint by using connect() */
    endpoint?: URL;
    mac?: string; ///< Mac address, determined by get_entities()

    /** Stores most recent information about endpoint reachability, updated by query() */
    endpoint_status: endpoint_reachability = "offline"

    /** Allows to callback when endpoint status changes */
    endpoint_status_update? : () => void

    private set_endpoint_status(msg: endpoint_reachability) {
        this.endpoint_status = msg
        console.info("HybridController.set_endpoint_status", msg, this.endpoint_status_update)
        if(this.endpoint_status_update) this.endpoint_status_update()
    }

    constructor(endpoint? : URL) {
        if(endpoint) this.connect(endpoint)
    }

    /// raises error if connection fails
    async connect(endpoint: URL) {
        this.endpoint = endpoint
        return this.get_entities() // defines this.mac
    }

    is_connectable() { return Boolean(this.endpoint); }

    /**
     * Synchronous query-reply call to the HybridController.
     * 
     * This send a message to the HybridController and await the answers,
     * which is checked for correctness at envelope-level.
     * That is, the return value shall always be the msg object.
     */
    async query(msg_type: string, msg = {}) {
        console.info("HybridController: query", this, msg)
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

        if(!this.is_connectable())
            throw new Error("Requiring an endpoint to be set")

        if(this.endpoint_status == "failed" || this.endpoint_status == "offline") {
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
        }

        const envelope_recv = await resp.json()
        return envelope_recv
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

