import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."

export default new TicketEventHandler({
    name: "ticketClose",
    version: "1.0.0",
    description: "Fired on ticketClose.",
    listener: function(...args: any[]) {
        const commands = this.getExtension(ForgeTickets, true).commands.get("ticketClose")
        for (const command of commands) {
            Interpreter.run({ client: this, command, data: command.compiled.code, obj: args[0], extras: { args } })
        }
    },
})
