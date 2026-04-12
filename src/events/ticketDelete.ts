import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."
import { Ticket } from "../structures/entities"

export default new TicketEventHandler({
    name: "ticketDelete",
    version: "1.0.0",
    description: "Fired when a ticket channel is deleted.",
    listener: async function (ticket: Ticket) {
        const ext = this.getExtension(ForgeTickets, true)
        const commands = ext.commands.get("ticketDelete")
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
