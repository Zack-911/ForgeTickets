import { ArgType, NativeFunction } from "@tryforge/forgescript"
import type { TextChannel } from "discord.js"
import { TicketsDatabase } from "../../structures/database"
import { TranscriptGenerator } from "../../managers/TranscriptGenerator"
import { TranscriptFormat } from "../../structures/entities"

export default new NativeFunction({
    name: "$generateTranscript",
    version: "1.0.0",
    description:
        "Generates a transcript for the current ticket and returns the content as a string (HTML by default). Does not send or save anything automatically.",
    unwrap: true,
    brackets: false,
    args: [
        {
            name: "ticketID",
            description: "Ticket ID (defaults to current channel's ticket)",
            type: ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "format",
            description: "Transcript format: html (default), text, or both",
            type: ArgType.Enum,
            enum: TranscriptFormat,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.String,
    async execute(ctx, [ticketID, format]) {
        const id = ticketID ?? (await TicketsDatabase.getTicketByChannel(ctx.channel!.id))?.id
        if (!id) return this.customError("No ticket found for this channel")

        const ticket = await TicketsDatabase.getTicket(id)
        if (!ticket) return this.customError("Ticket not found")

        const channel = ctx.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        if (!channel) return this.customError("Ticket channel not found or not cached")

        const resolvedFormat = (format as TranscriptFormat) ?? TranscriptFormat.HTML
        const { html, text } = await TranscriptGenerator.build(ticket, channel, resolvedFormat)

        // Return HTML if available, otherwise text, joining both with a separator if format=both
        if (html && text) return this.success(`${html}\n\n---\n\n${text}`)
        return this.success(html ?? text)
    },
})
