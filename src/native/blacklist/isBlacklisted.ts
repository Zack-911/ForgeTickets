import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"

export default new NativeFunction({
    name: "$isBlacklisted",
    version: "1.0.0",
    description: "Returns whether a user is currently blacklisted from opening tickets.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "userID",
            description: "User to check",
            type: ArgType.User,
            required: true,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [user]) {
        const member = await ctx.guild!.members.fetch(user.id).catch(() => null)
        const roleIDs = member?.roles.cache.map((r) => r.id) ?? []
        const entry = await TicketsDatabase.isBlacklisted(ctx.guild!.id, user.id, roleIDs)
        return this.success(!!entry)
    },
})
