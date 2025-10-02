// validators/shipment.dto.js
import { z } from "zod";

// --- helpers ---
const nonempty = z.string().trim().min(1, "Required");
const optionalTrim = z.string().trim().optional().transform((v) => v ?? "");
const PhoneRegex = /^[+\d][\d\s().-]{6,}$/; // permissive, e.g. +49 30 123456
const ObjectIdRegex = /^[0-9a-fA-F]{24}$/;

// --- sub-schemas ---
const AddressDTO = z.object({
  line1: nonempty,
  line2: optionalTrim,
  city: nonempty,
  state: optionalTrim,
  postalCode: nonempty,
  country: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .refine((s) => /^[A-Z]{2}$/.test(s), {
      message: "Use 2-letter ISO country code (e.g., DE, FR)",
    }),
});

const PartyDTO = z.object({
  name: nonempty,
  company: optionalTrim,
  email: z.string().trim().email("Invalid email"),
  phone: z.string().trim().regex(PhoneRegex, "Invalid phone"),
  address: AddressDTO,
});

const ContentItemDTO = z.object({
  description: nonempty,
  quantity: z.coerce.number().int().min(1, "Min 1"),
  weightKg: z.coerce.number().positive().optional(),
  lengthCm: z.coerce.number().positive().optional(),
  widthCm: z.coerce.number().positive().optional(),
  heightCm: z.coerce.number().positive().optional(),
  valueCurrency: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .refine((s) => s.length === 3, { message: "3-letter currency" })
    .optional(),
  valueAmount: z.coerce.number().nonnegative().optional(),
});

const DateNoteDTO = z.object({
  date: z.coerce.date().optional(), // may be undefined; refined later
  notes: optionalTrim,
});

// --- main schema (request DTO for POST /shipments) ---
export const CreateShipmentDTO = z
  .object({
    sender: PartyDTO,
    receiver: PartyDTO,
    contents: z.array(ContentItemDTO).min(1, "At least one item"),
    pickup: DateNoteDTO.optional().default({}),
    dropoff: DateNoteDTO.optional().default({}),
    serviceLevel: z.enum(["standard", "express"]).optional().default("standard"),
    quoteId: z.string().regex(ObjectIdRegex, "Invalid ObjectId").optional(),
    price: z
      .object({
        currency: z
          .string()
          .trim()
          .transform((s) => s.toUpperCase())
          .refine((s) => s.length === 3, { message: "3-letter currency" }),
        amount: z.coerce.number().nonnegative(),
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    const hasPickup = !!val.pickup?.date;
    const hasDropoff = !!val.dropoff?.date;
    if (!hasPickup && !hasDropoff) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide pickup.date or dropoff.date",
        path: ["pickup", "date"],
      });
    }
  });

// Optional: map to model shape (already close to model).
// Kept separate in case you later add unit handling or computed fields.
export function toShipmentModelShape(dto, userId) {
  // dto is the parsed result of CreateShipmentDTO
  const {
    sender,
    receiver,
    contents,
    pickup = {},
    dropoff = {},
    serviceLevel = "standard",
    quoteId,
    price,
  } = dto;

  return {
    sender,
    receiver,
    contents,
    pickup,
    dropoff,
    serviceLevel,
    quoteId,
    price,
    createdBy: userId, // set from auth
  };
}
