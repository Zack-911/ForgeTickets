import { ArgType, NativeFunction } from "@tryforge/forgescript"
import type { TextChannel } from "discord.js"
import { TicketsDatabase } from "../../structures/database"
import { TranscriptGenerator } from "../../managers/TranscriptGenerator"
import { TranscriptFormat } from "../../structures/entities"

export default new NativeFunction({
    name: "$generateTranscript",
    version: "1.0.0",
    description: "Manually generates and uploads a transcript for a ticket to the configured transcript channel.",
    unwrap: true,
    brackets: false,
    args: [
        {
            name: "ticketID",
            description: "Ticket ID (defaults to current channel)",
            type: ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "format",
            description: "Override transcript format: html, text, or both",
            type: ArgType.Enum,
            enum: TranscriptFormat,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [ticketID, format]) {
        const id = ticketID ?? (await TicketsDatabase.getTicketByChannel(ctx.channel!.id))?.id
        if (!id) return this.customError("No ticket found for this channel")

        const ticket = await TicketsDatabase.getTicket(id)
        if (!ticket) return this.customError("Ticket not found")

        const channel = ctx.client.channels.cache.get(ticket.channelID) as TextChannel | undefined
        if (!channel) return this.customError("Ticket channel not found or not cached")

        const category = ticket.categoryID ? await TicketsDatabase.getCategory(ticket.categoryID) : null
        if (!category) return this.customError("Category not found — cannot determine transcript destination")

        if (format) category.transcriptFormat = format as TranscriptFormat
        await TranscriptGenerator.generate(ticket, channel, category)
        return this.success(true)
    },
})
