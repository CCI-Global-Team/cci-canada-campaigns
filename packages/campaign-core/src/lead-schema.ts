import { z } from "zod";
import { campaignInterests, campaignSlugs } from "./campaigns";

export const campaignSlugSchema = z.enum(campaignSlugs);
export const campaignInterestSchema = z.enum(campaignInterests);

export const leadFieldNames = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "city",
  "interests",
] as const;

export type LeadFieldName = (typeof leadFieldNames)[number];
export type LeadFieldErrors = Partial<Record<LeadFieldName, string>>;

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

export function getNorthAmericanPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return null;
}

export function formatNorthAmericanPhone(value: string) {
  const digits = getNorthAmericanPhoneDigits(value);

  if (!digits) {
    return value.trim();
  }

  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatNorthAmericanPhoneInput(value: string) {
  const rawDigits = value.replace(/\D/g, "");
  const nationalDigits = rawDigits.startsWith("1")
    ? rawDigits.slice(1)
    : rawDigits;
  const digits = nationalDigits.slice(0, 10);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 3) {
    return `+1 (${digits}`;
  }

  if (digits.length <= 6) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export const leadSubmissionSchema = z.strictObject({
  campaign: campaignSlugSchema,
  firstName: z
    .string({ error: "First name is required." })
    .trim()
    .min(1, { error: "First name is required." })
    .max(80, { error: "First name must be 80 characters or fewer." }),
  lastName: z
    .string({ error: "Last name is required." })
    .trim()
    .min(1, { error: "Last name is required." })
    .max(80, { error: "Last name must be 80 characters or fewer." }),
  email: z
    .email({ error: "Enter a valid email address." })
    .trim()
    .toLowerCase()
    .max(160, { error: "Email must be 160 characters or fewer." }),
  phone: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .trim()
      .max(40, { error: "Phone must be 40 characters or fewer." })
      .refine((value) => getNorthAmericanPhoneDigits(value) !== null, {
        error: "Enter a valid US or Canadian phone number.",
      })
      .transform(formatNorthAmericanPhone)
      .optional(),
  ),
  city: z
    .string({ error: "City is required." })
    .trim()
    .min(2, { error: "City must be at least 2 characters." })
    .max(100, { error: "City must be 100 characters or fewer." }),
  interests: z.array(campaignInterestSchema).max(4).default([]),
  website: z.string().trim().max(300).optional().default(""),
});

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;

export function parseLeadSubmission(input: unknown) {
  return leadSubmissionSchema.safeParse(input);
}

export function getLeadFieldErrors(error: z.ZodError): LeadFieldErrors {
  const fieldErrors: LeadFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (
      typeof field === "string" &&
      leadFieldNames.includes(field as LeadFieldName) &&
      !fieldErrors[field as LeadFieldName]
    ) {
      fieldErrors[field as LeadFieldName] = issue.message;
    }
  }

  return fieldErrors;
}

export function isLikelySpam(lead: LeadSubmission): boolean {
  return lead.website.length > 0;
}
