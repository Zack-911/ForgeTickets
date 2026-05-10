import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { TicketRendererEventEnum, RENDERER_EVENTS } from "../../managers/TicketRenderer"

export default new NativeFunction({
    name: "$getTicketRenderer",
    description:
        "Returns the current guild renderer code for a ticket event, or empty string if none is set (using global or default).",
    version: "1.0.0",
    brackets: true,
    unwrap: true,
    args: [
        {
            name: "event",
            description: "The ticket event to retrieve the renderer for.",
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
    output: ArgType.String,
    async execute(ctx, [event, guildId]) {
        const gid = guildId ?? ctx.guild?.id
        if (!gid) return this.customError("No guild ID provided.")

        const eventName = TicketRendererEventEnum[event as unknown as number] as keyof typeof TicketRendererEventEnum
        if (eventName === undefined)
            return this.customError(`Invalid event. Valid events: ${RENDERER_EVENTS.join(", ")}`)

        const settings = await TicketsDatabase.getSettings(gid)
        return this.success(settings.renderers?.[eventName] ?? "")
    },
})
