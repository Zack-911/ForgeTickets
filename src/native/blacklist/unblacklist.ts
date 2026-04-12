import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$unblacklist",
    version: "1.0.0",
    description: "Removes a user or role from the ticket blacklist.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "targetID",
            description: "User or role ID to unblacklist",
            type: ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [targetID]) {
        await TicketsDatabase.removeBlacklist(ctx.guild!.id, targetID)
        return this.success(true)
    },
})
