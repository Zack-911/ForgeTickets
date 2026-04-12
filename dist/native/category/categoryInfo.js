"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
const database_1 = require("../../structures/database");
exports.default = new forgescript_1.NativeFunction({
    name: "$categoryInfo",
    version: "1.0.0",
    description: "Returns a category's full configuration as JSON.",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "categoryID",
            description: "The category to inspect",
            type: forgescript_1.ArgType.String,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.Json,
    async execute(ctx, [id]) {
        const cat = await database_1.TicketsDatabase.getCategory(id);
        return this.successJSON(cat ?? null);
    },
});
//# sourceMappingURL=categoryInfo.js.map