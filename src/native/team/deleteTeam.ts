import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$deleteTeam",
    version: "1.0.0",
    description: "Deletes a support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to delete",
            type: ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [id]) {
        await TicketsDatabase.deleteTeam(id)
        return this.success(true)
    },
})
