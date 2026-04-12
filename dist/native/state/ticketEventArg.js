"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgescript_1 = require("@tryforge/forgescript");
exports.default = new forgescript_1.NativeFunction({
    name: "$ticketEventArg",
    version: "1.0.0",
    description: "Returns an extra argument passed by a ticket event. Index 1 = first extra arg (e.g. closedByID in ticketClose, breachType in ticketSLABreach).",
    unwrap: true,
    brackets: true,
    args: [
        {
            name: "index",
            description: "Argument index (1-based; the ticket itself is index 0)",
            type: forgescript_1.ArgType.Number,
            required: true,
            rest: false,
        },
    ],
    output: forgescript_1.ArgType.String,
    execute(ctx, [index]) {
        const args = ctx.extras?.args ?? [];
        const val = args[index];
        return this.success(val !== undefined ? String(val) : undefined);
    },
});
//# sourceMappingURL=ticketEventArg.js.map