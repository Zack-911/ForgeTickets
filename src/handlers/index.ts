import { BaseEventHandler, ForgeClient } from "@tryforge/forgescript"
import { ForgeTickets } from ".."
import { Ticket } from "../structures/entities"
import type { Snowflake } from "discord.js"

// ─── Event Signatures ─────────────────────────────────────────────────────────

export interface ITicketEvents {
    databaseConnect: []
    ticketOpen:    [Ticket]
    ticketClose:   [Ticket, Snowflake]   // ticket, closedByID
    ticketClaim:   [Ticket, Snowflake]   // ticket, claimedByID
    ticketUnclaim: [Ticket, Snowflake]   // ticket, unclaimedByID
    ticketDelete:  [Ticket]
    ticketReopen:  [Ticket]
    ticketLock:    [Ticket, Snowflake]
    ticketUnlock:  [Ticket, Snowflake]
    ticketTransfer:[Ticket, string | undefined, string | undefined]  // ticket, fromTeamID, toTeamID
    ticketSLABreach:[Ticket, "response" | "resolution"]
    ticketNoteAdd: [Ticket, Snowflake, string]
    ticketPriorityChange: [Ticket, string, string]  // ticket, oldPriority, newPriority
    ticketTagAdd:  [Ticket, string]
    ticketTagRemove:[Ticket, string]
}

// ─── Event Handler ────────────────────────────────────────────────────────────

export class TicketEventHandler<T extends keyof ITicketEvents>
    extends BaseEventHandler<ITicketEvents, T> {

    register(client: ForgeClient): void {
        // @ts-ignore
        client.getExtension(ForgeTickets, true).emitter.on(this.name, this.listener.bind(client))
    }
}
