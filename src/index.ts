import { EventManager, ForgeClient, ForgeExtension } from "@tryforge/forgescript"
import { TypedEmitter } from "tiny-typed-emitter"
import { TransformEvents } from "@tryforge/forge.db"
import { ITicketEvents, TicketEventHandler } from "./handlers"
import { TicketsDatabase } from "./structures/database"
import { TicketsManager } from "./managers/TicketsManager"
import { TicketsCommandManager } from "./managers/TicketsCommandManager"
import { TicketsInteractionHandler } from "./handlers/TicketsInteractionHandler"
import path from "path"

export interface IForgeTicketsOptions {
    events?: Array<keyof ITicketEvents>
}

export class ForgeTickets extends ForgeExtension {
    name = "forge.tickets"
    description = "A powerful, fully-featured ticket system for ForgeScript."
    version = require("../package.json").version as string
    requireExtensions = ["forge.db"]

    public client!: ForgeClient
    public commands!: TicketsCommandManager
    public ticketsManager!: TicketsManager
    public readonly emitter = new TypedEmitter<TransformEvents<ITicketEvents>>()

    constructor(private readonly options: IForgeTicketsOptions = {}) {
        super()
    }

    async init(client: ForgeClient): Promise<void> {
        this.client = client
        this.commands = new TicketsCommandManager(client)

        EventManager.load("ForgeTicketsEvents", path.join(__dirname, "./events"))

        if (this.options.events?.length) {
            this.client.events.load("ForgeTicketsEvents", this.options.events)
        }

        this.load(path.join(__dirname, "./native"))
        console.log("uwu")
        const db = new TicketsDatabase(this.emitter)
        console.log(":3")
        await db.init()
        console.log("hello")
        new TicketsInteractionHandler(client)
        console.log("hiya")
        this.ticketsManager = new TicketsManager(client, this.emitter)
        console.log("uwu")
    }
}

export * from "./handlers"
export * from "./managers"
export * from "./structures"