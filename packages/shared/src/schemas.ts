import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const sportSchema = z.enum(["pool", "darts"]);

export const roleSchema = z.enum(["ORG_ADMIN", "COMMISSIONER", "CAPTAIN", "PLAYER"]);

export const fixtureStatusSchema = z.enum(["scheduled", "in_progress", "completed"]);

export const phoneE164Schema = z.string().regex(/^\+?[1-9]\d{7,14}$/);

export const createOrgSchema = z.object({
  name: z.string().min(2).max(200),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});
