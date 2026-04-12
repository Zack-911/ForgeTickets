import { ForgeClient } from "@tryforge/forgescript";
import { TypedEmitter } from "tiny-typed-emitter";
import { TransformEvents } from "@tryforge/forge.db";
import { ITicketEvents } from "../handlers";
import { Ticket } from "../structures/entities";
import { ISLAConfig } from "../structures/entities";
export declare class SLAManager {
    private readonly client;
    private readonly emitter;
    private entries;
    constructor(client: ForgeClient, emitter: TypedEmitter<TransformEvents<ITicketEvents>>);
    startSLA(ticket: Ticket, config: ISLAConfig): void;
    markFirstResponse(ticketID: string): void;
    clearSLA(ticketID: string): void;
    private _sendBreachAlert;
}
//# sourceMappingURL=SLAManager.d.ts.map