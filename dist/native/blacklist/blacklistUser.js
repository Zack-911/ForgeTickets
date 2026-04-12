"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
const entities_1 = require("../../structures/entities");
exports.default = new forgescript_1.NativeFunction({
    name: "$blacklistUser",
    version: "1.0.0",
    description: "Blacklists a user from opening tickets in this guild.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "userID",
            description: "User to blacklist",
            type: forgescript_1.ArgType.User,
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
    async execute(ctx, [user, reason, expiresInMS]) {
        const entry = new entities_1.BlacklistEntry({
            guildID: ctx.guild.id,
            type: "user",
            targetID: user.id,
            reason: reason ?? undefined,
            addedBy: ctx.user.id,
            expiresAt: expiresInMS ? Date.now() + expiresInMS : 0,
        });
        await database_1.TicketsDatabase.addBlacklist(entry);
        return this.success(true);
    },
});
//# sourceMappingURL=blacklistUser.js.map