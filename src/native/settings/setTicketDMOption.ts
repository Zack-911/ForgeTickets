import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$setTicketDMOption",
    version: "1.0.0",
    description: "Enables or disables DM notifications to the opener on ticket open or close.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "event",
            description: "open or close",
            type: ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "enabled",
            description: "true or false",
            type: ArgType.Boolean,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [event, enabled]) {
        const s = await TicketsDatabase.getSettings(ctx.guild!.id)
        if (event === "open") s.dmOnOpen = enabled
        else if (event === "close") s.dmOnClose = enabled
        else return this.customError("event must be 'open' or 'close'")
        await TicketsDatabase.saveSettings(s)
        return this.success(true)
    },
})
