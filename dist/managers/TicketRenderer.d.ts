import { ForgeClient } from "@tryforge/forgescript";
import { TextChannel } from "discord.js";
import { Ticket } from "../structures/entities";
export declare const RENDERER_EVENTS: readonly ["open", "close", "claim", "unclaim", "lock", "unlock", "reopen", "transfer", "log"];
export type TicketRendererEvent = (typeof RENDERER_EVENTS)[number];
/**
 * Proper TypeScript enum so ArgType.Enum works without type errors.
 * EnumLike requires a TS enum (which has both forward + reverse mappings).
 */
export declare enum TicketRendererEventEnum {
    open = 0,
    close = 1,
    claim = 2,
    unclaim = 3,
    lock = 4,
    unlock = 5,
    reopen = 6,
    transfer = 7,
    log = 8
}
export declare class TicketRenderer {
    private readonly client;
    /**
     * Global renderers — set via ForgeTickets options at startup.
     * Guild-specific renderers (stored in DB) take precedence over these.
     * Global is the fallback when no guild renderer is set for an event.
     */
    private globalRenderers;
    constructor(client: ForgeClient, globalRenderers?: Partial<Record<TicketRendererEvent, string>>);
    /**
     * Run the renderer for `event` in `guildID`.
     *
     * Precedence:
     *   1. Guild-specific renderer (stored in DB per guild)
     *   2. Global renderer (set in ForgeTickets options at startup)
     *   3. Nothing — caller falls back to default embed
     *
     * Returns true if a renderer ran, false if the caller should use its default.
     */
    render(event: TicketRendererEvent, guildID: string, channel: TextChannel, data: Record<string, string>): Promise<boolean>;
    static baseData(ticket: Ticket, categoryName?: string, teamName?: string): Record<string, string>;
    static openData(ticket: Ticket, categoryName?: string, teamName?: string): Record<string, string>;
    static closeData(ticket: Ticket, closedBy: string, categoryName?: string, teamName?: string): Record<string, string>;
    static claimData(ticket: Ticket, claimedBy: string, categoryName?: string, teamName?: string): Record<string, string>;
    static unclaimData(ticket: Ticket, unclaimedBy: string, categoryName?: string, teamName?: string): Record<string, string>;
    static lockData(ticket: Ticket, lockedBy: string, categoryName?: string, teamName?: string): Record<string, string>;
    static unlockData(ticket: Ticket, unlockedBy: string, categoryName?: string, teamName?: string): Record<string, string>;
    static reopenData(ticket: Ticket, reopenedBy: string, categoryName?: string, teamName?: string): Record<string, string>;
    static transferData(ticket: Ticket, newTeamID: string, newTeamName: string): Record<string, string>;
    static logData(ticket: Ticket, event: TicketRendererEvent, logMessage: string, extra?: Record<string, string>): Record<string, string>;
}
//# sourceMappingURL=TicketRenderer.d.ts.map