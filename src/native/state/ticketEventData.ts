import { ArgType, NativeFunction } from "@tryforge/forgescript"

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

function getProperty(ticket: any, prop: TicketProperty, sep?: string | null): any {
    if (!ticket) return undefined
    switch (prop) {
        case TicketProperty.participants:
            return Array.isArray(ticket.participants) ? ticket.participants.join(sep ?? ", ") : ticket.participants
        case TicketProperty.tags:
            return Array.isArray(ticket.tags) ? ticket.tags.join(sep ?? ", ") : ticket.tags
        case TicketProperty.formAnswers:
            return JSON.stringify(ticket.formAnswers ?? {})
        case TicketProperty.notes:
            return JSON.stringify(ticket.notes ?? [])
        case TicketProperty.slaStatus:
            return JSON.stringify(ticket.slaStatus ?? null)
        default:
            return ticket[prop]
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
            description: "Separator for array-type properties (participants, tags)",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.Unknown,
    execute(ctx, [prop, sep]) {
        const ticket = (ctx as any).obj ?? (ctx as any).runtime?.obj
        if (!ticket) return this.success()
        const val = getProperty(ticket, prop, sep ?? undefined)
        return this.success(val === undefined ? undefined : String(val))
    },
})
