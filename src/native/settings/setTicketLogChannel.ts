import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$setTicketLogChannel",
    version: "1.0.0",
    description: "Sets the channel for ticket event logs.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "channelID",
            description: "Log channel",
            type: ArgType.Channel,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [channel]) {
        const s = await TicketsDatabase.getSettings(ctx.guild!.id)
        s.logChannelID = channel.id
        await TicketsDatabase.saveSettings(s)
        return this.success(true)
    },
})
