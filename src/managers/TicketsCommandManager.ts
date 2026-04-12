import { BaseCommandManager } from "@tryforge/forgescript"
import { ITicketEvents } from "../handlers"

export class TicketsCommandManager extends BaseCommandManager<keyof ITicketEvents> {
    handlerName = "ForgeTicketsEvents"
}
