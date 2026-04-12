"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$ticketParticipants",
    version: "1.0.0",
    description: "Returns the participant IDs of a ticket as a separated list.",
    unwrap: true,
    brackets: false,
    args: [
        {
            name: "ticketID",
            description: "Ticket ID (defaults to current channel)",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "separator",
            description: "Separator between IDs",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.String,
    async execute(ctx, [id, sep]) {
        const ticket = id
            ? await database_1.TicketsDatabase.getTicket(id)
            : await database_1.TicketsDatabase.getTicketByChannel(ctx.channel.id);
        return this.success(ticket?.participants.join(sep ?? ", "));
    },
});
//# sourceMappingURL=ticketParticipants.js.map