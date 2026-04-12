"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketEventHandler = void 0;
const forgescript_1 = require("@tryforge/forgescript");
const __1 = require("..");
// ─── Event Handler ────────────────────────────────────────────────────────────
class TicketEventHandler extends forgescript_1.BaseEventHandler {
    register(client) {
        // @ts-ignore
        client.getExtension(__1.ForgeTickets, true).emitter.on(this.name, this.listener.bind(client));
    }
}
exports.TicketEventHandler = TicketEventHandler;
//# sourceMappingURL=index.js.map