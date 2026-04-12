"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$teamInfo",
    version: "1.0.0",
    description: "Returns a support team's configuration as JSON.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "teamID",
            description: "The team to inspect",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Json,
    async execute(ctx, [id]) {
        const team = await database_1.TicketsDatabase.getTeam(id);
        return this.successJSON(team ?? null);
    },
});
//# sourceMappingURL=teamInfo.js.map