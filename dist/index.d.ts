import { ForgeClient, ForgeExtension } from "@tryforge/forgescript";
import { TypedEmitter } from "tiny-typed-emitter";
import { TransformEvents } from "@tryforge/forge.db";
import { ITicketEvents } from "./handlers";
import { TicketsManager } from "./managers/TicketsManager";
import { TicketsCommandManager } from "./managers/TicketsCommandManager";
import { TicketRendererEvent } from "./managers/TicketRenderer";
export interface IForgeTicketsOptions {
    events?: Array<keyof ITicketEvents>;
    /**
     * Global renderer code per event. Applied to every guild that has not
     * set its own guild-specific renderer for that event via $setTicketRenderer.
     *
     * Guild-specific renderers always take precedence over these.
     *
     * @example
     * globalRenderers: {
     *   open:  `$addEmbed[$newEmbed[$setTitle[🎫 Ticket #$env[ticketNumber]]]]$sendEmbed[$channelID]`,
     *   close: `$sendMessage[$channelID;🔒 Closed by $env[closedByMention]]`,
     *   log:   `$sendMessage[$env[channelID];$env[logMessage]]`,
     * }
     */
    globalRenderers?: Partial<Record<TicketRendererEvent, string>>;
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