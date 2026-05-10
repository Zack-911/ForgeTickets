import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { TicketRendererEventEnum, RENDERER_EVENTS } from "../../managers/TicketRenderer"

export default new NativeFunction({
    name: "$removeTicketRenderer",
    description:
        "Removes the guild-specific renderer for a ticket event. Falls back to the global renderer or default embed.",
    version: "1.0.0",
    brackets: true,
    unwrap: true,
    args: [
        {
            name: "event",
            description: "The ticket event to remove the renderer from.",
            type: ArgType.Enum,
            enum: TicketRendererEventEnum,
            required: true,
            rest: false,
        },
        {
            name: "guildId",
            description: "Guild ID. Defaults to current guild.",
            type: ArgType.String,
            required: false,
            rest: false,
        },
    ],
    async execute(ctx, [event, guildId]) {
        const gid = guildId ?? ctx.guild?.id
        if (!gid) return this.customError("No guild ID provided.")

        const eventName = TicketRendererEventEnum[event as unknown as number] as keyof typeof TicketRendererEventEnum
        if (eventName === undefined)
            return this.customError(`Invalid event. Valid events: ${RENDERER_EVENTS.join(", ")}`)

        const settings = await TicketsDatabase.getSettings(gid)
        if (settings.renderers?.[eventName]) {
            delete settings.renderers[eventName]
            await TicketsDatabase.saveSettings(settings)
        }

        return this.success("true")
    },
})
