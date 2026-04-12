"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketProperty = void 0;
const forgescript_1 = require("@tryforge/forgescript");
var TicketProperty;
(function (TicketProperty) {
    TicketProperty["id"] = "id";
    TicketProperty["number"] = "number";
    TicketProperty["state"] = "state";
    TicketProperty["priority"] = "priority";
    TicketProperty["openerID"] = "openerID";
    TicketProperty["channelID"] = "channelID";
    TicketProperty["categoryID"] = "categoryID";
    TicketProperty["teamID"] = "teamID";
    TicketProperty["claimedBy"] = "claimedBy";
    TicketProperty["subject"] = "subject";
    TicketProperty["createdAt"] = "createdAt";
    TicketProperty["closedAt"] = "closedAt";
    TicketProperty["closedBy"] = "closedBy";
    TicketProperty["closeReason"] = "closeReason";
    TicketProperty["lastActivityAt"] = "lastActivityAt";
    TicketProperty["participants"] = "participants";
    TicketProperty["tags"] = "tags";
    TicketProperty["formAnswers"] = "formAnswers";
    TicketProperty["notes"] = "notes";
    TicketProperty["slaStatus"] = "slaStatus";
})(TicketProperty || (exports.TicketProperty = TicketProperty = {}));
function getProperty(ticket, prop, sep) {
    if (!ticket)
        return undefined;
    switch (prop) {
        case TicketProperty.participants:
            return Array.isArray(ticket.participants) ? ticket.participants.join(sep ?? ", ") : String(ticket.participants);
        case TicketProperty.tags:
            return Array.isArray(ticket.tags) ? ticket.tags.join(sep ?? ", ") : String(ticket.tags);
        case TicketProperty.formAnswers:
            return JSON.stringify(ticket.formAnswers ?? {});
        case TicketProperty.notes:
            return JSON.stringify(ticket.notes ?? []);
        case TicketProperty.slaStatus:
            return JSON.stringify(ticket.slaStatus ?? null);
        default:
            const val = ticket[prop];
            return val !== undefined && val !== null ? String(val) : undefined;
    }
}
exports.default = new forgescript_1.NativeFunction({
    name: "$ticketEventData",
    version: "1.0.0",
    description: "Returns a property from the ticket that triggered the current event.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "property",
            description: "The ticket property to return",
            type: forgescript_1.ArgType.Enum,
            enum: TicketProperty,
            required: true,
            rest: false,
        },
        {
            name: "separator",
            description: "Separator for array properties (participants, tags). Default: \", \"",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Unknown,
    execute(ctx, [prop, sep]) {
        // @ts-ignore
        const ticket = ctx.runtime.extras?.ticket;
        if (!ticket)
            return this.customError("No ticket in event context");
        return this.success(getProperty(ticket, prop, sep ?? undefined));
    },
});
//# sourceMappingURL=ticketEventData.js.map