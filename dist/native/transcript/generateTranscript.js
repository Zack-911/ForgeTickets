"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
const TranscriptGenerator_1 = require("../../managers/TranscriptGenerator");
const entities_1 = require("../../structures/entities");
exports.default = new forgescript_1.NativeFunction({
    name: "$generateTranscript",
    version: "1.0.0",
    description: "Manually generates and uploads a transcript for a ticket to the configured transcript channel.",
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
            name: "format",
            description: "Override transcript format: html, text, or both",
            type: forgescript_1.ArgType.Enum,
            enum: entities_1.TranscriptFormat,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [ticketID, format]) {
        const id = ticketID ?? (await database_1.TicketsDatabase.getTicketByChannel(ctx.channel.id))?.id;
        if (!id)
            return this.customError("No ticket found for this channel");
        const ticket = await database_1.TicketsDatabase.getTicket(id);
        if (!ticket)
            return this.customError("Ticket not found");
        const channel = ctx.client.channels.cache.get(ticket.channelID);
        if (!channel)
            return this.customError("Ticket channel not found or not cached");
        const category = ticket.categoryID ? await database_1.TicketsDatabase.getCategory(ticket.categoryID) : null;
        if (!category)
            return this.customError("Category not found — cannot determine transcript destination");
        if (format)
            category.transcriptFormat = format;
        await TranscriptGenerator_1.TranscriptGenerator.generate(ticket, channel, category);
        return this.success(true);
    },
});
//# sourceMappingURL=generateTranscript.js.map