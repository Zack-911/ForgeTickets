import { ForgeClient, ForgeExtension } from "@tryforge/forgescript";
import { TypedEmitter } from "tiny-typed-emitter";
import { TransformEvents } from "@tryforge/forge.db";
import { ITicketEvents } from "./handlers";
import { TicketsManager } from "./managers/TicketsManager";
import { TicketsCommandManager } from "./managers/TicketsCommandManager";
export interface IForgeTicketsOptions {
    events?: Array<keyof ITicketEvents>;
}
export declare class ForgeTickets extends ForgeExtension {
    private readonly options;
    name: string;
    description: string;
    version: string;
    requireExtensions: string[];
    client: ForgeClient;
    commands: TicketsCommandManager;
    ticketsManager: TicketsManager;
    readonly emitter: TypedEmitter<TransformEvents<ITicketEvents>>;
    constructor(options?: IForgeTicketsOptions);
    init(client: ForgeClient): Promise<void>;
}
export * from "./handlers";
export * from "./managers";
export * from "./structures";
//# sourceMappingURL=index.d.ts.map