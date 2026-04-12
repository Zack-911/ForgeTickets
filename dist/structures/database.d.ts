import "reflect-metadata";
import { DataBaseManager, TransformEvents } from "@tryforge/forge.db";
import { TypedEmitter } from "tiny-typed-emitter";
import { ITicketEvents } from "../handlers";
import { Ticket, MongoTicket, TicketCategory, MongoTicketCategory, TicketTeam, MongoTicketTeam, BlacklistEntry, MongoBlacklistEntry, TicketPanel, MongoTicketPanel, GuildSettings, MongoGuildSettings } from "./entities";
import type { Snowflake } from "discord.js";
type AnyTicket = typeof Ticket | typeof MongoTicket;
type AnyTicketCategory = typeof TicketCategory | typeof MongoTicketCategory;
type AnyTicketTeam = typeof TicketTeam | typeof MongoTicketTeam;
type AnyBlacklistEntry = typeof BlacklistEntry | typeof MongoBlacklistEntry;
type AnyTicketPanel = typeof TicketPanel | typeof MongoTicketPanel;
type AnyGuildSettings = typeof GuildSettings | typeof MongoGuildSettings;
export declare class TicketsDatabase extends DataBaseManager {
    private readonly emitter;
    database: string;
    entityManager: {
        sqlite: (typeof TicketCategory | typeof TicketTeam | typeof BlacklistEntry | typeof TicketPanel | typeof Ticket | typeof GuildSettings)[];
        mongodb: (typeof MongoTicket | typeof MongoTicketCategory | typeof MongoTicketTeam | typeof MongoBlacklistEntry | typeof MongoTicketPanel | typeof MongoGuildSettings)[];
        mysql: (typeof TicketCategory | typeof TicketTeam | typeof BlacklistEntry | typeof TicketPanel | typeof Ticket | typeof GuildSettings)[];
        postgres: (typeof TicketCategory | typeof TicketTeam | typeof BlacklistEntry | typeof TicketPanel | typeof Ticket | typeof GuildSettings)[];
    };
    static entities: {
        Ticket: AnyTicket;
        Category: AnyTicketCategory;
        Team: AnyTicketTeam;
        Blacklist: AnyBlacklistEntry;
        Panel: AnyTicketPanel;
        Settings: AnyGuildSettings;
    };
    private db;
    private static db;
    private static emitter;
    constructor(emitter: TypedEmitter<TransformEvents<ITicketEvents>>);
    init(): Promise<void>;
    static getTicket(id: string): Promise<Ticket | null>;
    static getTicketByChannel(channelID: Snowflake): Promise<Ticket | null>;
    static findTickets(where?: Partial<Ticket>): Promise<Ticket[]>;
    static getOpenTicketsByUser(guildID: Snowflake, openerID: Snowflake): Promise<Ticket[]>;
    static saveTicket(ticket: Ticket): Promise<void>;
    static deleteTicket(id: string): Promise<void>;
    static getActiveTickets(guildID: Snowflake): Promise<Ticket[]>;
    static getTicketStats(guildID: Snowflake): Promise<{
        total: number;
        open: number;
        claimed: number;
        closed: number;
        pending: number;
    }>;
    static getCategory(id: string): Promise<TicketCategory | null>;
    static getCategoriesByGuild(guildID: Snowflake): Promise<TicketCategory[]>;
    static saveCategory(cat: TicketCategory): Promise<void>;
    static deleteCategory(id: string): Promise<void>;
    static getTeam(id: string): Promise<TicketTeam | null>;
    static getTeamsByGuild(guildID: Snowflake): Promise<TicketTeam[]>;
    static saveTeam(team: TicketTeam): Promise<void>;
    static deleteTeam(id: string): Promise<void>;
    static getBlacklist(guildID: Snowflake): Promise<BlacklistEntry[]>;
    static isBlacklisted(guildID: Snowflake, userID: Snowflake, roleIDs: Snowflake[]): Promise<BlacklistEntry | null>;
    static addBlacklist(entry: BlacklistEntry): Promise<void>;
    static removeBlacklist(guildID: Snowflake, targetID: Snowflake): Promise<void>;
    static getPanel(id: string): Promise<TicketPanel | null>;
    static getPanelByMessage(messageID: Snowflake): Promise<TicketPanel | null>;
    static savePanel(panel: TicketPanel): Promise<void>;
    static deletePanel(id: string): Promise<void>;
    static getSettings(guildID: Snowflake): Promise<GuildSettings>;
    static saveSettings(settings: GuildSettings): Promise<void>;
}
export {};
//# sourceMappingURL=database.d.ts.map