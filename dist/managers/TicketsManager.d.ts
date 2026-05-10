import type { Snowflake, GuildMember } from "discord.js";
import { ForgeClient } from "@tryforge/forgescript";
import { Ticket, TicketPriority } from "../structures/entities";
import { ITicketEvents } from "../handlers";
import { TicketRendererEvent } from "./TicketRenderer";
import { TypedEmitter } from "tiny-typed-emitter";
import { TransformEvents } from "@tryforge/forge.db";
export interface IOpenTicketOptions {
    guildID: Snowflake;
    openerID: Snowflake;
    categoryID?: string;
    member: GuildMember;
    subject?: string;
    formAnswers?: Record<string, string>;
    priority?: TicketPriority;
}
export declare class TicketsManager {
    private readonly client;
    private readonly emitter;
    private slaManager;
    private renderer;
    private autoCloseTimers;
    private deleteTimers;
    constructor(client: ForgeClient, emitter: TypedEmitter<TransformEvents<ITicketEvents>>, globalRenderers?: Partial<Record<TicketRendererEvent, string>>);
    openTicket(options: IOpenTicketOptions): Promise<Ticket | null>;
    closeTicket(ticketID: string, closedBy: Snowflake, reason?: string): Promise<Ticket | null>;
    claimTicket(ticketID: string, claimedBy: Snowflake): Promise<Ticket | null>;
    unclaimTicket(ticketID: string, unclaimedBy: Snowflake): Promise<Ticket | null>;
    lockTicket(ticketID: string, lockedBy: Snowflake): Promise<Ticket | null>;
    unlockTicket(ticketID: string, unlockedBy: Snowflake): Promise<Ticket | null>;
    reopenTicket(ticketID: string, reopenedBy: Snowflake): Promise<Ticket | null>;
    deleteTicket(ticketID: string): Promise<boolean>;
    transferTicket(ticketID: string, newTeamID: string): Promise<Ticket | null>;
    addParticipant(ticketID: string, userID: Snowflake): Promise<Ticket | null>;
    removeParticipant(ticketID: string, userID: Snowflake): Promise<Ticket | null>;
    addTag(ticketID: string, tag: string): Promise<Ticket | null>;
    removeTag(ticketID: string, tag: string): Promise<Ticket | null>;
    setPriority(ticketID: string, priority: TicketPriority): Promise<Ticket | null>;
    addNote(ticketID: string, authorID: Snowflake, content: string): Promise<Ticket | null>;
    private _sendOpenEmbed;
    private _sendCloseEmbed;
    private _log;
    private _routeTicket;
    private _buildPermissions;
    private _buildTeamOverwrites;
    private _scheduleAutoClose;
    private _clearAutoClose;
    private _scheduleDelete;
    private _clearDelete;
    private _restoreTimers;
    private _priorityEmoji;
    private _formatDuration;
}
//# sourceMappingURL=TicketsManager.d.ts.map