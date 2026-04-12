"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$ticketFormAnswer",
    version: "1.0.0",
    description: "Returns the value of a specific form field from a ticket.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "key",
            description: "Form field key",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "ticketID",
            description: "Ticket ID (defaults to current channel)",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.String,
    async execute(ctx, [key, id]) {
        const ticket = id
            ? await database_1.TicketsDatabase.getTicket(id)
            : await database_1.TicketsDatabase.getTicketByChannel(ctx.channel.id);
        return this.success(ticket?.formAnswers?.[key]);
    },
});
//# sourceMappingURL=ticketFormAnswer.js.map