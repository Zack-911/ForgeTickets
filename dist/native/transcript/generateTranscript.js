"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
const TranscriptGenerator_1 = require("../../managers/TranscriptGenerator");
const entities_1 = require("../../structures/entities");
exports.default = new forgescript_1.NativeFunction({
    name: "$generateTranscript",
    version: "1.0.0",
    description: "Generates a transcript for the current ticket and returns the content as a string (HTML by default). Does not send or save anything automatically.",
    unwrap: true,
    brackets: false,
    args: [
        {
            name: "ticketID",
            description: "Ticket ID (defaults to current channel's ticket)",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "format",
            description: "Transcript format: html (default), text, or both",
            type: forgescript_1.ArgType.Enum,
            enum: entities_1.TranscriptFormat,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.String,
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
        const resolvedFormat = format ?? entities_1.TranscriptFormat.HTML;
        const { html, text } = await TranscriptGenerator_1.TranscriptGenerator.build(ticket, channel, resolvedFormat);
        // Return HTML if available, otherwise text, joining both with a separator if format=both
        if (html && text)
            return this.success(`${html}\n\n---\n\n${text}`);
        return this.success(html ?? text);
    },
});
//# sourceMappingURL=generateTranscript.js.map