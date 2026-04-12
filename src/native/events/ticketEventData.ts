import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { Ticket } from "../../structures/entities"

export enum TicketProperty {
    id = "id",
    number = "number",
    state = "state",
    priority = "priority",
    openerID = "openerID",
    channelID = "channelID",
    categoryID = "categoryID",
    teamID = "teamID",
    claimedBy = "claimedBy",
    subject = "subject",
    createdAt = "createdAt",
    closedAt = "closedAt",
    closedBy = "closedBy",
    closeReason = "closeReason",
    lastActivityAt = "lastActivityAt",
    participants = "participants",
    tags = "tags",
    formAnswers = "formAnswers",
    notes = "notes",
    slaStatus = "slaStatus",
}

function getProperty(ticket: Ticket, prop: TicketProperty, sep?: string | null): string | undefined {
    if (!ticket) return undefined
    switch (prop) {
        case TicketProperty.participants:
            return Array.isArray(ticket.participants)
                ? ticket.participants.join(sep ?? ", ")
                : String(ticket.participants)
        case TicketProperty.tags:
            return Array.isArray(ticket.tags) ? ticket.tags.join(sep ?? ", ") : String(ticket.tags)
        case TicketProperty.formAnswers:
            return JSON.stringify(ticket.formAnswers ?? {})
        case TicketProperty.notes:
            return JSON.stringify(ticket.notes ?? [])
        case TicketProperty.slaStatus:
            return JSON.stringify(ticket.slaStatus ?? null)
        default:
            const val = (ticket as any)[prop]
            return val !== undefined && val !== null ? String(val) : undefined
    }
}

export default new NativeFunction({
    name: "$ticketEventData",
    version: "1.0.0",
    description: "Returns a property from the ticket that triggered the current event.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "property",
            description: "The ticket property to return",
            type: ArgType.Enum,
            enum: TicketProperty,
            required: true,
            rest: false,
        },
        {
            name: "separator",
            description: 'Separator for array properties (participants, tags). Default: ", "',
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.Unknown,
    execute(ctx, [prop, sep]) {
        // @ts-ignore
        const ticket = (ctx.runtime.extras as { ticket: Ticket })?.ticket
        if (!ticket) return this.customError("No ticket in event context")
        return this.success(getProperty(ticket, prop, sep ?? undefined))
    },
})
