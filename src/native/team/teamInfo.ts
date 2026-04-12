import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$teamInfo",
    version: "1.0.0",
    description: "Returns a support team's configuration as JSON.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to inspect",
            type: ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Json,
    async execute(ctx, [id]) {
        const team = await TicketsDatabase.getTeam(id)
        return this.successJSON(team ?? null)
    },
})
