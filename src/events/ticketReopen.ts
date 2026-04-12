import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."
import { Ticket } from "../structures/entities"

export default new TicketEventHandler({
    name: "ticketReopen",
    version: "1.0.0",
    description: "Fired when a ticket is reopened.",
    listener: async function (ticket: Ticket) {
        const ext = this.getExtension(ForgeTickets, true)
        const commands = ext.commands.get("ticketReopen")
        for (const command of commands) {
            Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: ticket,
                extras: { ticket },
            })
        }
    },
})
