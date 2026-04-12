import { Interpreter } from "@tryforge/forgescript"
import { TicketEventHandler } from "../handlers"
import { ForgeTickets } from ".."
import { Ticket } from "../structures/entities"

export default new TicketEventHandler({
    name: "ticketPriorityChange",
    version: "1.0.0",
    description: "Fired when a ticket's priority changes.",
    listener: async function (ticket: Ticket, oldPriority: string, newPriority: string) {
        const ext = this.getExtension(ForgeTickets, true)
        const commands = ext.commands.get("ticketPriorityChange")
        for (const command of commands) {
            Interpreter.run({
                client: this,
                command,
                data: command.compiled.code,
                obj: ticket,
                extras: { ticket, oldPriority, newPriority },
            })
        }
    },
})