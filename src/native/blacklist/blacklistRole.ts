import { ArgType, NativeFunction } from "@tryforge/forgescript"
import { TicketsDatabase } from "../../structures/database"
import { BlacklistEntry } from "../../structures/entities"

export default new NativeFunction({
    name: "$blacklistRole",
    version: "1.0.0",
    description: "Blacklists all members of a role from opening tickets.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "roleID",
            description: "Role to blacklist",
            type: ArgType.Role,
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
    async execute(ctx, [role, reason, expiresInMS]) {
        const entry = new BlacklistEntry({
            guildID: ctx.guild!.id,
            type: "role",
            targetID: role.id,
            reason: reason ?? undefined,
            addedBy: ctx.user!.id,
            expiresAt: expiresInMS ? Date.now() + expiresInMS : 0,
        })
        await TicketsDatabase.addBlacklist(entry)
        return this.success(true)
    },
})
