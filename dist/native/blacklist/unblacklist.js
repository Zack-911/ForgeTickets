"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$unblacklist",
    version: "1.0.0",
    description: "Removes a user or role from the ticket blacklist.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "targetID",
            description: "User or role ID to unblacklist",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [targetID]) {
        await database_1.TicketsDatabase.removeBlacklist(ctx.guild.id, targetID);
        return this.success(true);
    },
});
//# sourceMappingURL=unblacklist.js.map