"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
const entities_1 = require("../../structures/entities");
exports.default = new forgescript_1.NativeFunction({
    name: "$createTeam",
    version: "1.0.0",
    description: "Creates a support team. Returns the team ID.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "name",
            description: "Team name",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
        {
            name: "description",
            description: "Team description",
            type: forgescript_1.ArgType.String,
            required: false,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.String,
    async execute(ctx, [name, description]) {
        const team = new entities_1.TicketTeam({ guildID: ctx.guild.id, name, description: description ?? undefined });
        await database_1.TicketsDatabase.saveTeam(team);
        return this.success(team.id);
    },
});
//# sourceMappingURL=createTeam.js.map