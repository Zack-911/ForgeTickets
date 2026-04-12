import { ArgType, NativeFunction } from "@tryforge/forgescript"

export default new NativeFunction({
    name: "$ticketEventArg",
    version: "1.0.0",
    description:
        "Returns an extra argument passed by a ticket event. Index 1 = first extra arg (e.g. closedByID in ticketClose, breachType in ticketSLABreach).",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "index",
            description: "Argument index (1-based; the ticket itself is index 0)",
            type: ArgType.Number,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.String,
    execute(ctx, [index]) {
        const args: any[] = (ctx as any).extras?.args ?? []
        const val = args[index]
        return this.success(val !== undefined ? String(val) : undefined)
    },
})
