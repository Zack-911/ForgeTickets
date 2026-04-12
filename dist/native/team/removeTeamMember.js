"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$removeTeamMember",
    version: "1.0.0",
    description: "Removes a user from a support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to remove the member from",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "userID",
            description: "User to remove",
            type: forgescript_1.ArgType.User,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [id, user]) {
        const team = await database_1.TicketsDatabase.getTeam(id);
        if (!team)
            return this.customError(`Team ${id} not found`);
        team.members = team.members.filter((m) => m !== user.id);
        await database_1.TicketsDatabase.saveTeam(team);
        return this.success(true);
    },
});
//# sourceMappingURL=removeTeamMember.js.map