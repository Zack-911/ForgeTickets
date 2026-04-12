"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
const entities_1 = require("../../structures/entities");
exports.default = new forgescript_1.NativeFunction({
    name: "$blacklistRole",
    version: "1.0.0",
    description: "Blacklists all members of a role from opening tickets.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "roleID",
            description: "Role to blacklist",
            type: forgescript_1.ArgType.Role,
            required: true,
            rest: false,
        },
        {
            name: "reason",
            description: "Blacklist reason",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
        {
            name: "expiresInMS",
            description: "Duration in milliseconds (0 or omit = permanent)",
            type: forgescript_1.ArgType.Number,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [role, reason, expiresInMS]) {
        const entry = new entities_1.BlacklistEntry({
            guildID: ctx.guild.id,
            type: "role",
            targetID: role.id,
            reason: reason ?? undefined,
            addedBy: ctx.user.id,
            expiresAt: expiresInMS ? Date.now() + expiresInMS : 0,
        });
        await database_1.TicketsDatabase.addBlacklist(entry);
        return this.success(true);
    },
});
//# sourceMappingURL=blacklistRole.js.map