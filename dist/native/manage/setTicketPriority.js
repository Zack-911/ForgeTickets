"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const __1 = require("../..");
const database_1 = require("../../structures/database");
const entities_1 = require("../../structures/entities");
exports.default = new forgescript_1.NativeFunction({
    name: "$setTicketPriority",
    version: "1.0.0",
    description: "Sets the priority of a ticket.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "priority",
            description: "New priority (low/medium/high/urgent)",
            type: forgescript_1.ArgType.Enum,
            enum: entities_1.TicketPriority,
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
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [priority, ticketID]) {
        const ext = ctx.client.getExtension(__1.ForgeTickets, true);
        const id = ticketID ?? (await database_1.TicketsDatabase.getTicketByChannel(ctx.channel.id))?.id;
        if (!id)
            return this.customError("No ticket found for this channel");
        const result = await ext.ticketsManager.setPriority(id, priority);
        return this.success(!!result);
    },
});
//# sourceMappingURL=setTicketPriority.js.map