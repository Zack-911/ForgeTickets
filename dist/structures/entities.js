"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoGuildSettings = exports.GuildSettings = exports.MongoTicketPanel = exports.MongoBlacklistEntry = exports.MongoTicketTeam = exports.MongoTicketCategory = exports.MongoTicket = exports.Ticket = exports.TicketPanel = exports.BlacklistEntry = exports.TicketTeam = exports.TicketCategory = exports.RoutingStrategy = exports.TranscriptFormat = exports.TicketPriority = exports.TicketState = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const discord_js_1 = require("discord.js");
// ─── Enums ────────────────────────────────────────────────────────────────────
var TicketState;
(function (TicketState) {
    TicketState["Open"] = "open";
    TicketState["Claimed"] = "claimed";
    TicketState["Pending"] = "pending";
    TicketState["Closed"] = "closed";
    TicketState["Locked"] = "locked";
})(TicketState || (exports.TicketState = TicketState = {}));
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["Low"] = "low";
    TicketPriority["Medium"] = "medium";
    TicketPriority["High"] = "high";
    TicketPriority["Urgent"] = "urgent";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
var TranscriptFormat;
(function (TranscriptFormat) {
    TranscriptFormat["HTML"] = "html";
    TranscriptFormat["Text"] = "text";
    TranscriptFormat["Both"] = "both";
})(TranscriptFormat || (exports.TranscriptFormat = TranscriptFormat = {}));
var RoutingStrategy;
(function (RoutingStrategy) {
    RoutingStrategy["RoundRobin"] = "round_robin";
    RoutingStrategy["LeastActive"] = "least_active";
    RoutingStrategy["Random"] = "random";
    RoutingStrategy["Manual"] = "manual";
})(RoutingStrategy || (exports.RoutingStrategy = RoutingStrategy = {}));
let TicketCategory = class TicketCategory {
    id;
    guildID;
    name;
    description;
    emoji;
    /** Parent category channel id */
    parentChannelID;
    /** Channel name template — supports {id}, {username}, {count} */
    channelNameTemplate;
    /** Support team ID assigned to this category */
    teamID;
    /** Custom embed shown when the ticket channel is created */
    openEmbed;
    /** Custom embed shown when the ticket is closed */
    closeEmbed;
    /** Transcript format for this category */
    transcriptFormat;
    /** Channel ID to send transcripts to */
    transcriptChannelID;
    /** Roles allowed to open tickets in this category */
    allowedRoles;
    /** Roles blocked from opening tickets here */
    blockedRoles;
    /** Optional form definition (up to 5 fields per Discord modal) */
    form;
    /** SLA config for this category */
    sla;
    /** Smart routing rules */
    routingRules;
    /** Default routing strategy when no rule matches */
    routingStrategy;
    /** Max open tickets per user in this category (0 = unlimited) */
    maxPerUser;
    /** Whether the category is currently accepting tickets */
    enabled;
    /** Roles that can manage/view tickets in this category */
    staffRoles;
    /** Auto-close ticket after X ms of inactivity (0 = disabled) */
    autoCloseAfter;
    /** Auto-archive/delete closed ticket channels after X ms (0 = disabled) */
    deleteAfter;
    /** Running counter for channel naming */
    ticketCount;
    constructor(options) {
        this.id = options?.id ?? discord_js_1.SnowflakeUtil.generate().toString();
        this.guildID = options?.guildID ?? "";
        this.name = options?.name ?? "";
        this.channelNameTemplate = options?.channelNameTemplate ?? "ticket-{count}";
        this.transcriptFormat = options?.transcriptFormat ?? TranscriptFormat.HTML;
        this.routingStrategy = options?.routingStrategy ?? RoutingStrategy.Manual;
        this.maxPerUser = options?.maxPerUser ?? 1;
        this.enabled = options?.enabled ?? true;
        this.autoCloseAfter = options?.autoCloseAfter ?? 0;
        this.deleteAfter = options?.deleteAfter ?? 0;
        this.ticketCount = options?.ticketCount ?? 0;
    }
};
exports.TicketCategory = TicketCategory;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], TicketCategory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TicketCategory.prototype, "guildID", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TicketCategory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TicketCategory.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TicketCategory.prototype, "emoji", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TicketCategory.prototype, "parentChannelID", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "ticket-{count}" }),
    __metadata("design:type", String)
], TicketCategory.prototype, "channelNameTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TicketCategory.prototype, "teamID", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json", { nullable: true }),
    __metadata("design:type", Object)
], TicketCategory.prototype, "openEmbed", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json", { nullable: true }),
    __metadata("design:type", Object)
], TicketCategory.prototype, "closeEmbed", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: TranscriptFormat.HTML }),
    __metadata("design:type", String)
], TicketCategory.prototype, "transcriptFormat", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TicketCategory.prototype, "transcriptChannelID", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array", { nullable: true }),
    __metadata("design:type", Array)
], TicketCategory.prototype, "allowedRoles", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array", { nullable: true }),
    __metadata("design:type", Array)
], TicketCategory.prototype, "blockedRoles", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json", { nullable: true }),
    __metadata("design:type", Array)
], TicketCategory.prototype, "form", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json", { nullable: true }),
    __metadata("design:type", Object)
], TicketCategory.prototype, "sla", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json", { nullable: true }),
    __metadata("design:type", Array)
], TicketCategory.prototype, "routingRules", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: RoutingStrategy.Manual }),
    __metadata("design:type", String)
], TicketCategory.prototype, "routingStrategy", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], TicketCategory.prototype, "maxPerUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketCategory.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array", { nullable: true }),
    __metadata("design:type", Array)
], TicketCategory.prototype, "staffRoles", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TicketCategory.prototype, "autoCloseAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TicketCategory.prototype, "deleteAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TicketCategory.prototype, "ticketCount", void 0);
exports.TicketCategory = TicketCategory = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Object])
], TicketCategory);
// ─── Support Team ─────────────────────────────────────────────────────────────
let TicketTeam = class TicketTeam {
    id;
    guildID;
    name;
    description;
    /** Discord role IDs that belong to this team */
    roles;
    /** Discord user IDs that are members of this team */
    members;
    /** Whether this team can claim tickets */
    canClaim;
    /** Whether this team can close tickets */
    canClose;
    /** Whether this team can delete ticket channels */
    canDelete;
    /** Ping this team on new ticket arrival */
    pingOnOpen;
    /** Routing index for round-robin (internal) */
    rrIndex;
    constructor(options) {
        this.id = options?.id ?? discord_js_1.SnowflakeUtil.generate().toString();
        this.guildID = options?.guildID ?? "";
        this.name = options?.name ?? "";
        this.roles = options?.roles ?? [];
        this.members = options?.members ?? [];
        this.canClaim = options?.canClaim ?? true;
        this.canClose = options?.canClose ?? true;
        this.canDelete = options?.canDelete ?? false;
        this.pingOnOpen = options?.pingOnOpen ?? true;
        this.rrIndex = options?.rrIndex ?? 0;
    }
};
exports.TicketTeam = TicketTeam;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], TicketTeam.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TicketTeam.prototype, "guildID", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TicketTeam.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TicketTeam.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array"),
    __metadata("design:type", Array)
], TicketTeam.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array"),
    __metadata("design:type", Array)
], TicketTeam.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketTeam.prototype, "canClaim", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketTeam.prototype, "canClose", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TicketTeam.prototype, "canDelete", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TicketTeam.prototype, "pingOnOpen", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TicketTeam.prototype, "rrIndex", void 0);
exports.TicketTeam = TicketTeam = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Object])
], TicketTeam);
// ─── Blacklist Entry ──────────────────────────────────────────────────────────
let BlacklistEntry = class BlacklistEntry {
    id;
    guildID;
    /** "user" | "role" */
    type;
    /** The user/role ID */
    targetID;
    reason;
    addedBy;
    addedAt;
    /** Optional expiry timestamp (ms), 0 = permanent */
    expiresAt;
    constructor(options) {
        this.id = options?.id ?? discord_js_1.SnowflakeUtil.generate().toString();
        this.guildID = options?.guildID ?? "";
        this.type = options?.type ?? "user";
        this.targetID = options?.targetID ?? "";
        this.addedBy = options?.addedBy ?? "";
        this.addedAt = options?.addedAt ?? Date.now();
        this.expiresAt = options?.expiresAt ?? 0;
    }
    isExpired() {
        return this.expiresAt > 0 && Date.now() > this.expiresAt;
    }
};
exports.BlacklistEntry = BlacklistEntry;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], BlacklistEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BlacklistEntry.prototype, "guildID", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BlacklistEntry.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BlacklistEntry.prototype, "targetID", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BlacklistEntry.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BlacklistEntry.prototype, "addedBy", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BlacklistEntry.prototype, "addedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], BlacklistEntry.prototype, "expiresAt", void 0);
exports.BlacklistEntry = BlacklistEntry = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Object])
], BlacklistEntry);
let TicketPanel = class TicketPanel {
    id;
    guildID;
    channelID;
    messageID;
    embed;
    buttons;
    constructor(options) {
        this.id = options?.id ?? discord_js_1.SnowflakeUtil.generate().toString();
        this.guildID = options?.guildID ?? "";
        this.channelID = options?.channelID ?? "";
        this.buttons = options?.buttons ?? [];
    }
};
exports.TicketPanel = TicketPanel;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], TicketPanel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TicketPanel.prototype, "guildID", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TicketPanel.prototype, "channelID", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TicketPanel.prototype, "messageID", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json", { nullable: true }),
    __metadata("design:type", Object)
], TicketPanel.prototype, "embed", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json"),
    __metadata("design:type", Array)
], TicketPanel.prototype, "buttons", void 0);
exports.TicketPanel = TicketPanel = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Object])
], TicketPanel);
let Ticket = class Ticket {
    id;
    guildID;
    channelID;
    openerID;
    categoryID;
    teamID;
    claimedBy;
    state;
    priority;
    number;
    subject;
    formAnswers;
    participants;
    tags;
    notes;
    createdAt;
    closedAt;
    closedBy;
    closeReason;
    lastActivityAt;
    slaStatus;
    deleted;
    constructor(options) {
        this.id = options?.id ?? discord_js_1.SnowflakeUtil.generate().toString();
        this.guildID = options?.guildID ?? "";
        this.channelID = options?.channelID ?? "";
        this.openerID = options?.openerID ?? "";
        this.state = options?.state ?? TicketState.Open;
        this.priority = options?.priority ?? TicketPriority.Medium;
        this.number = options?.number ?? 0;
        this.participants = options?.participants ?? [];
        this.tags = options?.tags ?? [];
        this.notes = options?.notes ?? [];
        this.createdAt = options?.createdAt ?? Date.now();
        this.lastActivityAt = options?.lastActivityAt ?? Date.now();
        this.deleted = options?.deleted ?? false;
    }
    touch() {
        this.lastActivityAt = Date.now();
    }
    addNote(authorID, content) {
        const note = { authorID, content, timestamp: Date.now() };
        this.notes = [...(this.notes ?? []), note];
        return note;
    }
    clone() {
        return structuredClone(this);
    }
    /** Returns whether the ticket is currently considered active */
    isActive() {
        return this.state === TicketState.Open || this.state === TicketState.Claimed || this.state === TicketState.Pending;
    }
};
exports.Ticket = Ticket;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Ticket.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ticket.prototype, "guildID", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ticket.prototype, "channelID", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ticket.prototype, "openerID", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "categoryID", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "teamID", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "claimedBy", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ticket.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: TicketPriority.Medium }),
    __metadata("design:type", String)
], Ticket.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Ticket.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json", { nullable: true }),
    __metadata("design:type", Object)
], Ticket.prototype, "formAnswers", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array"),
    __metadata("design:type", Array)
], Ticket.prototype, "participants", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array"),
    __metadata("design:type", Array)
], Ticket.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json", { nullable: true }),
    __metadata("design:type", Array)
], Ticket.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Ticket.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Ticket.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "closedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "closeReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Ticket.prototype, "lastActivityAt", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-json", { nullable: true }),
    __metadata("design:type", Object)
], Ticket.prototype, "slaStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Ticket.prototype, "deleted", void 0);
exports.Ticket = Ticket = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Object])
], Ticket);
// ─── MongoDB variants ─────────────────────────────────────────────────────────
let MongoTicket = class MongoTicket extends Ticket {
    mongoId;
};
exports.MongoTicket = MongoTicket;
__decorate([
    (0, typeorm_1.ObjectIdColumn)(),
    __metadata("design:type", String)
], MongoTicket.prototype, "mongoId", void 0);
exports.MongoTicket = MongoTicket = __decorate([
    (0, typeorm_1.Entity)()
], MongoTicket);
let MongoTicketCategory = class MongoTicketCategory extends TicketCategory {
    mongoId;
};
exports.MongoTicketCategory = MongoTicketCategory;
__decorate([
    (0, typeorm_1.ObjectIdColumn)(),
    __metadata("design:type", String)
], MongoTicketCategory.prototype, "mongoId", void 0);
exports.MongoTicketCategory = MongoTicketCategory = __decorate([
    (0, typeorm_1.Entity)()
], MongoTicketCategory);
let MongoTicketTeam = class MongoTicketTeam extends TicketTeam {
    mongoId;
};
exports.MongoTicketTeam = MongoTicketTeam;
__decorate([
    (0, typeorm_1.ObjectIdColumn)(),
    __metadata("design:type", String)
], MongoTicketTeam.prototype, "mongoId", void 0);
exports.MongoTicketTeam = MongoTicketTeam = __decorate([
    (0, typeorm_1.Entity)()
], MongoTicketTeam);
let MongoBlacklistEntry = class MongoBlacklistEntry extends BlacklistEntry {
    mongoId;
};
exports.MongoBlacklistEntry = MongoBlacklistEntry;
__decorate([
    (0, typeorm_1.ObjectIdColumn)(),
    __metadata("design:type", String)
], MongoBlacklistEntry.prototype, "mongoId", void 0);
exports.MongoBlacklistEntry = MongoBlacklistEntry = __decorate([
    (0, typeorm_1.Entity)()
], MongoBlacklistEntry);
let MongoTicketPanel = class MongoTicketPanel extends TicketPanel {
    mongoId;
};
exports.MongoTicketPanel = MongoTicketPanel;
__decorate([
    (0, typeorm_1.ObjectIdColumn)(),
    __metadata("design:type", String)
], MongoTicketPanel.prototype, "mongoId", void 0);
exports.MongoTicketPanel = MongoTicketPanel = __decorate([
    (0, typeorm_1.Entity)()
], MongoTicketPanel);
// ─── Guild Settings ───────────────────────────────────────────────────────────
let GuildSettings = class GuildSettings {
    guildID;
    /** Global staff roles (can manage any ticket) */
    globalStaffRoles;
    /** Channel for global ticket logs */
    logChannelID;
    /** Running global ticket counter for this guild */
    totalTickets;
    /** Whether to DM users on open/close */
    dmOnOpen;
    dmOnClose;
    constructor(options) {
        this.guildID = options?.guildID ?? "";
        this.globalStaffRoles = options?.globalStaffRoles ?? [];
        this.totalTickets = options?.totalTickets ?? 0;
        this.dmOnOpen = options?.dmOnOpen ?? false;
        this.dmOnClose = options?.dmOnClose ?? false;
    }
};
exports.GuildSettings = GuildSettings;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], GuildSettings.prototype, "guildID", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array"),
    __metadata("design:type", Array)
], GuildSettings.prototype, "globalStaffRoles", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GuildSettings.prototype, "logChannelID", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GuildSettings.prototype, "totalTickets", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], GuildSettings.prototype, "dmOnOpen", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], GuildSettings.prototype, "dmOnClose", void 0);
exports.GuildSettings = GuildSettings = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [Object])
], GuildSettings);
let MongoGuildSettings = class MongoGuildSettings extends GuildSettings {
    mongoId;
};
exports.MongoGuildSettings = MongoGuildSettings;
__decorate([
    (0, typeorm_1.ObjectIdColumn)(),
    __metadata("design:type", String)
], MongoGuildSettings.prototype, "mongoId", void 0);
exports.MongoGuildSettings = MongoGuildSettings = __decorate([
    (0, typeorm_1.Entity)()
], MongoGuildSettings);
//# sourceMappingURL=entities.js.map