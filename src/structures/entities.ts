import "reflect-metadata"
import { Entity, Column, PrimaryColumn, ObjectIdColumn } from "typeorm"
import type { Snowflake } from "discord.js"
import { SnowflakeUtil } from "discord.js"

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum TicketState {
    Open = "open",
    Claimed = "claimed",
    Pending = "pending",
    Closed = "closed",
    Locked = "locked",
}

export enum TicketPriority {
    Low = "low",
    Medium = "medium",
    High = "high",
    Urgent = "urgent",
}

export enum TranscriptFormat {
    HTML = "html",
    Text = "text",
    Both = "both",
}

export enum RoutingStrategy {
    RoundRobin = "round_robin",
    LeastActive = "least_active",
    Random = "random",
    Manual = "manual",
}

// ─── Form Field ───────────────────────────────────────────────────────────────

export interface IFormField {
    /** Unique key for this field */
    key: string
    /** Label shown to the user in the modal */
    label: string
    /** Placeholder text */
    placeholder?: string
    /** Whether this field must be filled */
    required: boolean
    /** short = one-line TextInput, paragraph = multi-line TextInput */
    style: "short" | "paragraph"
    /** Min length for validation */
    minLength?: number
    /** Max length for validation */
    maxLength?: number
}

// ─── SLA Configuration ────────────────────────────────────────────────────────

export interface ISLAConfig {
    /** MS until first-response breach */
    responseTime?: number
    /** MS until resolution breach */
    resolutionTime?: number
    /** Role IDs to ping on SLA breach */
    alertRoles?: Snowflake[]
    /** Channel to send breach alerts to */
    alertChannelID?: Snowflake
}

// ─── Routing Rule ─────────────────────────────────────────────────────────────

export interface IRoutingRule {
    /** Keyword(s) in the ticket subject that trigger this rule */
    keywords?: string[]
    /** Form field key=value pairs that trigger this rule */
    formAnswers?: Record<string, string>
    /** Team ID to route to when triggered */
    targetTeamID: string
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface ICategoryEmbed {
    title?: string
    description?: string
    color?: number
    thumbnailURL?: string
    imageURL?: string
    footerText?: string
    footerIconURL?: string
}

@Entity()
export class TicketCategory {
    @PrimaryColumn()
    id: string

    @Column()
    guildID: Snowflake

    @Column()
    name: string

    @Column({ nullable: true })
    description?: string

    @Column({ nullable: true })
    emoji?: string

    /** Parent category channel id */
    @Column({ nullable: true })
    parentChannelID?: Snowflake

    /** Channel name template — supports {id}, {username}, {count} */
    @Column({ default: "ticket-{count}" })
    channelNameTemplate: string

    /** Support team ID assigned to this category */
    @Column({ nullable: true })
    teamID?: string

    /** Custom embed shown when the ticket channel is created */
    @Column("simple-json", { nullable: true })
    openEmbed?: ICategoryEmbed

    /** Custom embed shown when the ticket is closed */
    @Column("simple-json", { nullable: true })
    closeEmbed?: ICategoryEmbed

    /** Transcript format for this category */
    @Column({ default: TranscriptFormat.HTML })
    transcriptFormat: TranscriptFormat

    /** Channel ID to send transcripts to */
    @Column({ nullable: true })
    transcriptChannelID?: Snowflake

    /** Roles allowed to open tickets in this category */
    @Column("simple-array", { nullable: true })
    allowedRoles?: Snowflake[]

    /** Roles blocked from opening tickets here */
    @Column("simple-array", { nullable: true })
    blockedRoles?: Snowflake[]

    /** Optional form definition (up to 5 fields per Discord modal) */
    @Column("simple-json", { nullable: true })
    form?: IFormField[]

    /** SLA config for this category */
    @Column("simple-json", { nullable: true })
    sla?: ISLAConfig

    /** Smart routing rules */
    @Column("simple-json", { nullable: true })
    routingRules?: IRoutingRule[]

    /** Default routing strategy when no rule matches */
    @Column({ default: RoutingStrategy.Manual })
    routingStrategy: RoutingStrategy

    /** Max open tickets per user in this category (0 = unlimited) */
    @Column({ default: 1 })
    maxPerUser: number

    /** Whether the category is currently accepting tickets */
    @Column({ default: true })
    enabled: boolean

    /** Roles that can manage/view tickets in this category */
    @Column("simple-array", { nullable: true })
    staffRoles?: Snowflake[]

    /** Auto-close ticket after X ms of inactivity (0 = disabled) */
    @Column({ default: 0 })
    autoCloseAfter: number

    /** Auto-archive/delete closed ticket channels after X ms (0 = disabled) */
    @Column({ default: 0 })
    deleteAfter: number

    /** Running counter for channel naming */
    @Column({ default: 0 })
    ticketCount: number

    constructor(options?: Partial<TicketCategory>) {
        this.id = options?.id ?? SnowflakeUtil.generate().toString()
        this.guildID = options?.guildID ?? ""
        this.name = options?.name ?? ""
        this.channelNameTemplate = options?.channelNameTemplate ?? "ticket-{count}"
        this.transcriptFormat = options?.transcriptFormat ?? TranscriptFormat.HTML
        this.routingStrategy = options?.routingStrategy ?? RoutingStrategy.Manual
        this.maxPerUser = options?.maxPerUser ?? 1
        this.enabled = options?.enabled ?? true
        this.autoCloseAfter = options?.autoCloseAfter ?? 0
        this.deleteAfter = options?.deleteAfter ?? 0
        this.ticketCount = options?.ticketCount ?? 0
    }
}

// ─── Support Team ─────────────────────────────────────────────────────────────

@Entity()
export class TicketTeam {
    @PrimaryColumn()
    id: string

    @Column()
    guildID: Snowflake

    @Column()
    name: string

    @Column({ nullable: true })
    description?: string

    /** Discord role IDs that belong to this team */
    @Column("simple-array")
    roles: Snowflake[]

    /** Discord user IDs that are members of this team */
    @Column("simple-array")
    members: Snowflake[]

    /** Whether this team can claim tickets */
    @Column({ default: true })
    canClaim: boolean

    /** Whether this team can close tickets */
    @Column({ default: true })
    canClose: boolean

    /** Whether this team can delete ticket channels */
    @Column({ default: false })
    canDelete: boolean

    /** Ping this team on new ticket arrival */
    @Column({ default: true })
    pingOnOpen: boolean

    /** Routing index for round-robin (internal) */
    @Column({ default: 0 })
    rrIndex: number

    constructor(options?: Partial<TicketTeam>) {
        this.id = options?.id ?? SnowflakeUtil.generate().toString()
        this.guildID = options?.guildID ?? ""
        this.name = options?.name ?? ""
        this.roles = options?.roles ?? []
        this.members = options?.members ?? []
        this.canClaim = options?.canClaim ?? true
        this.canClose = options?.canClose ?? true
        this.canDelete = options?.canDelete ?? false
        this.pingOnOpen = options?.pingOnOpen ?? true
        this.rrIndex = options?.rrIndex ?? 0
    }
}

// ─── Blacklist Entry ──────────────────────────────────────────────────────────

@Entity()
export class BlacklistEntry {
    @PrimaryColumn()
    id: string

    @Column()
    guildID: Snowflake

    /** "user" | "role" */
    @Column()
    type: "user" | "role"

    /** The user/role ID */
    @Column()
    targetID: Snowflake

    @Column({ nullable: true })
    reason?: string

    @Column()
    addedBy: Snowflake

    @Column()
    addedAt: number

    /** Optional expiry timestamp (ms), 0 = permanent */
    @Column({ default: 0 })
    expiresAt: number

    constructor(options?: Partial<BlacklistEntry>) {
        this.id = options?.id ?? SnowflakeUtil.generate().toString()
        this.guildID = options?.guildID ?? ""
        this.type = options?.type ?? "user"
        this.targetID = options?.targetID ?? ""
        this.addedBy = options?.addedBy ?? ""
        this.addedAt = options?.addedAt ?? Date.now()
        this.expiresAt = options?.expiresAt ?? 0
    }

    public isExpired(): boolean {
        return this.expiresAt > 0 && Date.now() > this.expiresAt
    }
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export interface IPanelButton {
    /** Category ID this button opens */
    categoryID: string
    label: string
    emoji?: string
    style: "primary" | "secondary" | "success" | "danger"
}

@Entity()
export class TicketPanel {
    @PrimaryColumn()
    id: string

    @Column()
    guildID: Snowflake

    @Column()
    channelID: Snowflake

    @Column({ nullable: true })
    messageID?: Snowflake

    @Column("simple-json", { nullable: true })
    embed?: ICategoryEmbed

    @Column("simple-json")
    buttons: IPanelButton[]

    constructor(options?: Partial<TicketPanel>) {
        this.id = options?.id ?? SnowflakeUtil.generate().toString()
        this.guildID = options?.guildID ?? ""
        this.channelID = options?.channelID ?? ""
        this.buttons = options?.buttons ?? []
    }
}

// ─── Ticket ───────────────────────────────────────────────────────────────────

export interface ITicketNote {
    authorID: Snowflake
    content: string
    timestamp: number
}

export interface ISLAStatus {
    responseBreachedAt?: number
    resolutionBreachedAt?: number
    firstResponseAt?: number
    resolvedAt?: number
    responseBreached: boolean
    resolutionBreached: boolean
}

@Entity()
export class Ticket {
    @PrimaryColumn()
    id: string

    @Column()
    guildID: Snowflake

    @Column()
    channelID: Snowflake

    @Column()
    openerID: Snowflake

    @Column({ nullable: true })
    categoryID?: string

    @Column({ nullable: true })
    teamID?: string

    @Column({ nullable: true })
    claimedBy?: Snowflake

    @Column()
    state: TicketState

    @Column({ default: TicketPriority.Medium })
    priority: TicketPriority

    @Column({ default: 0 })
    number: number

    @Column({ nullable: true })
    subject?: string

    @Column("simple-json", { nullable: true })
    formAnswers?: Record<string, string>

    @Column("simple-array")
    participants: Snowflake[]

    @Column("simple-array")
    tags: string[]

    @Column("simple-json", { nullable: true })
    notes?: ITicketNote[]

    @Column()
    createdAt: number

    @Column({ nullable: true })
    closedAt?: number

    @Column({ nullable: true })
    closedBy?: Snowflake

    @Column({ nullable: true })
    closeReason?: string

    @Column({ nullable: true })
    lastActivityAt?: number

    @Column("simple-json", { nullable: true })
    slaStatus?: ISLAStatus

    @Column({ default: false })
    deleted: boolean

    constructor(options?: Partial<Ticket>) {
        this.id = options?.id ?? SnowflakeUtil.generate().toString()
        this.guildID = options?.guildID ?? ""
        this.channelID = options?.channelID ?? ""
        this.openerID = options?.openerID ?? ""
        this.state = options?.state ?? TicketState.Open
        this.priority = options?.priority ?? TicketPriority.Medium
        this.number = options?.number ?? 0
        this.participants = options?.participants ?? []
        this.tags = options?.tags ?? []
        this.notes = options?.notes ?? []
        this.createdAt = options?.createdAt ?? Date.now()
        this.lastActivityAt = options?.lastActivityAt ?? Date.now()
        this.deleted = options?.deleted ?? false
    }

    public touch() {
        this.lastActivityAt = Date.now()
    }

    public addNote(authorID: Snowflake, content: string): ITicketNote {
        const note: ITicketNote = { authorID, content, timestamp: Date.now() }
        this.notes = [...(this.notes ?? []), note]
        return note
    }

    public clone() {
        return structuredClone(this)
    }

    /** Returns whether the ticket is currently considered active */
    public isActive(): boolean {
        return (
            this.state === TicketState.Open || this.state === TicketState.Claimed || this.state === TicketState.Pending
        )
    }
}

// ─── MongoDB variants ─────────────────────────────────────────────────────────

@Entity()
export class MongoTicket extends Ticket {
    @ObjectIdColumn()
    mongoId?: string
}

@Entity()
export class MongoTicketCategory extends TicketCategory {
    @ObjectIdColumn()
    mongoId?: string
}

@Entity()
export class MongoTicketTeam extends TicketTeam {
    @ObjectIdColumn()
    mongoId?: string
}

@Entity()
export class MongoBlacklistEntry extends BlacklistEntry {
    @ObjectIdColumn()
    mongoId?: string
}

@Entity()
export class MongoTicketPanel extends TicketPanel {
    @ObjectIdColumn()
    mongoId?: string
}

// ─── Guild Settings ───────────────────────────────────────────────────────────

@Entity()
export class GuildSettings {
    @PrimaryColumn()
    guildID: Snowflake

    /** Global staff roles (can manage any ticket) */
    @Column("simple-array")
    globalStaffRoles: Snowflake[]

    /** Channel for global ticket logs */
    @Column({ nullable: true })
    logChannelID?: Snowflake

    /** Running global ticket counter for this guild */
    @Column({ default: 0 })
    totalTickets: number

    /** Whether to DM users on open/close */
    @Column({ default: false })
    dmOnOpen: boolean

    @Column({ default: false })
    dmOnClose: boolean

    constructor(options?: Partial<GuildSettings>) {
        this.guildID = options?.guildID ?? ""
        this.globalStaffRoles = options?.globalStaffRoles ?? []
        this.totalTickets = options?.totalTickets ?? 0
        this.dmOnOpen = options?.dmOnOpen ?? false
        this.dmOnClose = options?.dmOnClose ?? false
    }
}

@Entity()
export class MongoGuildSettings extends GuildSettings {
    @ObjectIdColumn()
    mongoId?: string
}
