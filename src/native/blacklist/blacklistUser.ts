import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { BlacklistEntry } from "../../structures/entities"

export default new NativeFunction({
    name: "$blacklistUser",
    version: "1.0.0",
    description: "Blacklists a user from opening tickets in this guild.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "userID",
            description: "User to blacklist",
            type: ArgType.User,
            required: true,
            rest: false,
        },
        {
            name: "reason",
            description: "Blacklist reason",
            type: ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "expiresInMS",
            description: "Duration in milliseconds (0 or omit = permanent)",
            type: ArgType.Number,
            required: false,
            rest: false,
        },
    ],
    output: ArgType.Boolean,
    async execute(ctx, [user, reason, expiresInMS]) {
        const entry = new BlacklistEntry({
            guildID: ctx.guild!.id,
            type: "user",
            targetID: user.id,
            reason: reason ?? undefined,
            addedBy: ctx.user!.id,
            expiresAt: expiresInMS ? Date.now() + expiresInMS : 0,
        })
        await TicketsDatabase.addBlacklist(entry)
        return this.success(true)
    },
})
