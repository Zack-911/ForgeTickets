"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$addTeamRole",
    version: "1.0.0",
    description: "Adds a role to a support team.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to add the role to",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "roleID",
            description: "Role to add",
            type: forgescript_1.ArgType.Role,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Boolean,
    async execute(ctx, [id, role]) {
        const team = await database_1.TicketsDatabase.getTeam(id);
        if (!team)
            return this.customError(`Team ${id} not found`);
        if (!team.roles.includes(role.id)) {
            team.roles.push(role.id);
            await database_1.TicketsDatabase.saveTeam(team);
        }
        return this.success(true);
    },
});
//# sourceMappingURL=addTeamRole.js.map