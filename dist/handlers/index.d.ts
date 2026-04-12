import { BaseEventHandler, ForgeClient } from "@tryforge/forgescript";
import { Ticket } from "../structures/entities";
import type { Snowflake } from "discord.js";
export interface ITicketEvents {
    databaseConnect: [];
    ticketOpen: [Ticket];
    ticketClose: [Ticket, Snowflake];
    ticketClaim: [Ticket, Snowflake];
    ticketUnclaim: [Ticket, Snowflake];
    ticketDelete: [Ticket];
    ticketReopen: [Ticket];
    ticketLock: [Ticket, Snowflake];
    ticketUnlock: [Ticket, Snowflake];
    ticketTransfer: [Ticket, string | undefined, string | undefined];
    ticketSLABreach: [Ticket, "response" | "resolution"];
    ticketNoteAdd: [Ticket, Snowflake, string];
    ticketPriorityChange: [Ticket, string, string];
    ticketTagAdd: [Ticket, string];
    ticketTagRemove: [Ticket, string];
}
export declare class TicketEventHandler<T extends keyof ITicketEvents> extends BaseEventHandler<ITicketEvents, T> {
    register(client: ForgeClient): void;
}
//# sourceMappingURL=index.d.ts.map