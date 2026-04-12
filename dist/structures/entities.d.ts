import "reflect-metadata";
import type { Snowflake } from "discord.js";
export declare enum TicketState {
    Open = "open",
    Claimed = "claimed",
    Pending = "pending",
    Closed = "closed",
    Locked = "locked"
}
export declare enum TicketPriority {
    Low = "low",
    Medium = "medium",
    High = "high",
    Urgent = "urgent"
}
export declare enum TranscriptFormat {
    HTML = "html",
    Text = "text",
    Both = "both"
}
export declare enum RoutingStrategy {
    RoundRobin = "round_robin",
    LeastActive = "least_active",
    Random = "random",
    Manual = "manual"
}
export interface IFormField {
    /** Unique key for this field */
    key: string;
    /** Label shown to the user in the modal */
    label: string;
    /** Placeholder text */
    placeholder?: string;
    /** Whether this field must be filled */
    required: boolean;
    /** short = one-line TextInput, paragraph = multi-line TextInput */
    style: "short" | "paragraph";
    /** Min length for validation */
    minLength?: number;
    /** Max length for validation */
    maxLength?: number;
}
export interface ISLAConfig {
    /** MS until first-response breach */
    responseTime?: number;
    /** MS until resolution breach */
    resolutionTime?: number;
    /** Role IDs to ping on SLA breach */
    alertRoles?: Snowflake[];
    /** Channel to send breach alerts to */
    alertChannelID?: Snowflake;
}
export interface IRoutingRule {
    /** Keyword(s) in the ticket subject that trigger this rule */
    keywords?: string[];
    /** Form field key=value pairs that trigger this rule */
    formAnswers?: Record<string, string>;
    /** Team ID to route to when triggered */
    targetTeamID: string;
}
export interface ICategoryEmbed {
    title?: string;
    description?: string;
    color?: number;
    thumbnailURL?: string;
    imageURL?: string;
    footerText?: string;
    footerIconURL?: string;
}
export declare class TicketCategory {
    id: string;
    guildID: Snowflake;
    name: string;
    description?: string;
    emoji?: string;
    /** Parent category channel id */
    parentChannelID?: Snowflake;
    /** Channel name template — supports {id}, {username}, {count} */
    channelNameTemplate: string;
    /** Support team ID assigned to this category */
    teamID?: string;
    /** Custom embed shown when the ticket channel is created */
    openEmbed?: ICategoryEmbed;
    /** Custom embed shown when the ticket is closed */
    closeEmbed?: ICategoryEmbed;
    /** Transcript format for this category */
    transcriptFormat: TranscriptFormat;
    /** Channel ID to send transcripts to */
    transcriptChannelID?: Snowflake;
    /** Roles allowed to open tickets in this category */
    allowedRoles?: Snowflake[];
    /** Roles blocked from opening tickets here */
    blockedRoles?: Snowflake[];
    /** Optional form definition (up to 5 fields per Discord modal) */
    form?: IFormField[];
    /** SLA config for this category */
    sla?: ISLAConfig;
    /** Smart routing rules */
    routingRules?: IRoutingRule[];
    /** Default routing strategy when no rule matches */
    routingStrategy: RoutingStrategy;
    /** Max open tickets per user in this category (0 = unlimited) */
    maxPerUser: number;
    /** Whether the category is currently accepting tickets */
    enabled: boolean;
    /** Roles that can manage/view tickets in this category */
    staffRoles?: Snowflake[];
    /** Auto-close ticket after X ms of inactivity (0 = disabled) */
    autoCloseAfter: number;
    /** Auto-archive/delete closed ticket channels after X ms (0 = disabled) */
    deleteAfter: number;
    /** Running counter for channel naming */
    ticketCount: number;
    constructor(options?: Partial<TicketCategory>);
}
export declare class TicketTeam {
    id: string;
    guildID: Snowflake;
    name: string;
    description?: string;
    /** Discord role IDs that belong to this team */
    roles: Snowflake[];
    /** Discord user IDs that are members of this team */
    members: Snowflake[];
    /** Whether this team can claim tickets */
    canClaim: boolean;
    /** Whether this team can close tickets */
    canClose: boolean;
    /** Whether this team can delete ticket channels */
    canDelete: boolean;
    /** Ping this team on new ticket arrival */
    pingOnOpen: boolean;
    /** Routing index for round-robin (internal) */
    rrIndex: number;
    constructor(options?: Partial<TicketTeam>);
}
export declare class BlacklistEntry {
    id: string;
    guildID: Snowflake;
    /** "user" | "role" */
    type: "user" | "role";
    /** The user/role ID */
    targetID: Snowflake;
    reason?: string;
    addedBy: Snowflake;
    addedAt: number;
    /** Optional expiry timestamp (ms), 0 = permanent */
    expiresAt: number;
    constructor(options?: Partial<BlacklistEntry>);
    isExpired(): boolean;
}
export interface IPanelButton {
    /** Category ID this button opens */
    categoryID: string;
    label: string;
    emoji?: string;
    style: "primary" | "secondary" | "success" | "danger";
}
export declare class TicketPanel {
    id: string;
    guildID: Snowflake;
    channelID: Snowflake;
    messageID?: Snowflake;
    embed?: ICategoryEmbed;
    buttons: IPanelButton[];
    constructor(options?: Partial<TicketPanel>);
}
export interface ITicketNote {
    authorID: Snowflake;
    content: string;
    timestamp: number;
}
export interface ISLAStatus {
    responseBreachedAt?: number;
    resolutionBreachedAt?: number;
    firstResponseAt?: number;
    resolvedAt?: number;
    responseBreached: boolean;
    resolutionBreached: boolean;
}
export declare class Ticket {
    id: string;
    guildID: Snowflake;
    channelID: Snowflake;
    openerID: Snowflake;
    categoryID?: string;
    teamID?: string;
    claimedBy?: Snowflake;
    state: TicketState;
    priority: TicketPriority;
    number: number;
    subject?: string;
    formAnswers?: Record<string, string>;
    participants: Snowflake[];
    tags: string[];
    notes?: ITicketNote[];
    createdAt: number;
    closedAt?: number;
    closedBy?: Snowflake;
    closeReason?: string;
    lastActivityAt?: number;
    slaStatus?: ISLAStatus;
    deleted: boolean;
    constructor(options?: Partial<Ticket>);
    touch(): void;
    addNote(authorID: Snowflake, content: string): ITicketNote;
    clone(): this;
    /** Returns whether the ticket is currently considered active */
    isActive(): boolean;
}
export declare class MongoTicket extends Ticket {
    mongoId?: string;
}
export declare class MongoTicketCategory extends TicketCategory {
    mongoId?: string;
}
export declare class MongoTicketTeam extends TicketTeam {
    mongoId?: string;
}
export declare class MongoBlacklistEntry extends BlacklistEntry {
    mongoId?: string;
}
export declare class MongoTicketPanel extends TicketPanel {
    mongoId?: string;
}
export declare class GuildSettings {
    guildID: Snowflake;
    /** Global staff roles (can manage any ticket) */
    globalStaffRoles: Snowflake[];
    /** Channel for global ticket logs */
    logChannelID?: Snowflake;
    /** Running global ticket counter for this guild */
    totalTickets: number;
    /** Whether to DM users on open/close */
    dmOnOpen: boolean;
    dmOnClose: boolean;
    constructor(options?: Partial<GuildSettings>);
}
export declare class MongoGuildSettings extends GuildSettings {
    mongoId?: string;
}
//# sourceMappingURL=entities.d.ts.map