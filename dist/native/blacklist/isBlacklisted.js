"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$isBlacklisted",
    version: "1.0.0",
    description: "Returns whether a user is currently blacklisted from opening tickets.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "userID",
            description: "User to check",
            type: forgescript_1.ArgType.User,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [user]) {
        const member = await ctx.guild.members.fetch(user.id).catch(() => null);
        const roleIDs = member?.roles.cache.map((r) => r.id) ?? [];
        const entry = await database_1.TicketsDatabase.isBlacklisted(ctx.guild.id, user.id, roleIDs);
        return this.success(!!entry);
    },
});
//# sourceMappingURL=isBlacklisted.js.map