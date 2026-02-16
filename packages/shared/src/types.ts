export type UUID = string;

export type Sport = "pool" | "darts";

export type Role = "ORG_ADMIN" | "COMMISSIONER" | "CAPTAIN" | "PLAYER";

export type FixtureStatus = "scheduled" | "in_progress" | "completed";

export type NotificationChannel = "sms" | "whatsapp" | "email";

export type OutboxStatus = "pending" | "sending" | "sent" | "failed";
