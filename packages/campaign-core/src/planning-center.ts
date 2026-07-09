import { z } from "zod";
import type { CampaignInterest } from "./campaigns";
import type { LeadSubmission } from "./lead-schema";

const planningCenterConfigSchema = z.strictObject({
  formId: z.string().min(1),
  clientId: z.string().min(1),
  secret: z.string().min(1),
  userAgent: z.string().min(1),
  fieldIds: z.strictObject({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().min(1),
    phone: z.string().min(1),
    city: z.string().min(1),
    interests: z.string().min(1),
    campaignSource: z.string().min(1),
  }),
  interestOptionIds: z.partialRecord(
    z.enum(["Hope", "Community", "Answers", "Just curious"]),
    z.string().min(1),
  ),
});

type PlanningCenterConfig = z.infer<typeof planningCenterConfigSchema>;

type Env = Record<string, string | undefined>;
type SubmissionMode = "live" | "mock";

interface PlanningCenterValue {
  formFieldId: string;
  value: string;
}

interface PlanningCenterSubmissionResult {
  mode: SubmissionMode;
}

export class MissingPlanningCenterConfigError extends Error {
  constructor() {
    super("Planning Center is not configured for this site yet.");
    this.name = "MissingPlanningCenterConfigError";
  }
}

export class PlanningCenterSubmissionError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("Planning Center rejected the submission.");
    this.name = "PlanningCenterSubmissionError";
    this.status = status;
  }
}

function isEnabled(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(value?.toLowerCase() ?? "");
}

export function shouldUsePlanningCenterMock(env: Env = process.env) {
  return isEnabled(env.PLANNING_CENTER_USE_MOCK_SUBMISSIONS);
}

function getMockPlanningCenterConfig(env: Env = process.env): PlanningCenterConfig {
  return {
    formId: env.PLANNING_CENTER_FORM_ID || "mock-reboot-camp-form",
    clientId: "mock-client-id",
    secret: "mock-secret",
    userAgent: env.PLANNING_CENTER_USER_AGENT || "CCI Campaigns Local Mock",
    fieldIds: {
      firstName: "mock-field-first-name",
      lastName: "mock-field-last-name",
      email: "mock-field-email",
      phone: "mock-field-phone",
      city: "mock-field-city",
      interests: "mock-field-interests",
      campaignSource: "mock-field-campaign-source",
    },
    interestOptionIds: {
      Hope: "mock-option-hope",
      Community: "mock-option-community",
      Answers: "mock-option-answers",
      "Just curious": "mock-option-just-curious",
    },
  };
}

function getPlanningCenterConfig(env: Env = process.env): PlanningCenterConfig {
  const parsed = planningCenterConfigSchema.safeParse({
    formId: env.PLANNING_CENTER_FORM_ID,
    clientId: env.PLANNING_CENTER_CLIENT_ID,
    secret: env.PLANNING_CENTER_SECRET,
    userAgent: env.PLANNING_CENTER_USER_AGENT,
    fieldIds: {
      firstName: env.PLANNING_CENTER_FIELD_FIRST_NAME_ID,
      lastName: env.PLANNING_CENTER_FIELD_LAST_NAME_ID,
      email: env.PLANNING_CENTER_FIELD_EMAIL_ID,
      phone: env.PLANNING_CENTER_FIELD_PHONE_ID,
      city: env.PLANNING_CENTER_FIELD_CITY_ID,
      interests: env.PLANNING_CENTER_FIELD_INTERESTS_ID,
      campaignSource: env.PLANNING_CENTER_FIELD_CAMPAIGN_SOURCE_ID,
    },
    interestOptionIds: {
      Hope: env.PLANNING_CENTER_INTEREST_HOPE_OPTION_ID,
      Community: env.PLANNING_CENTER_INTEREST_COMMUNITY_OPTION_ID,
      Answers: env.PLANNING_CENTER_INTEREST_ANSWERS_OPTION_ID,
      "Just curious": env.PLANNING_CENTER_INTEREST_JUST_CURIOUS_OPTION_ID,
    },
  });

  if (!parsed.success) {
    throw new MissingPlanningCenterConfigError();
  }

  return parsed.data;
}

function getInterestValue(
  interest: CampaignInterest,
  config: PlanningCenterConfig,
) {
  const optionIds: Partial<Record<CampaignInterest, string>> =
    config.interestOptionIds;

  return optionIds[interest] ?? interest;
}

export function buildPlanningCenterPayload(
  lead: LeadSubmission,
  config: PlanningCenterConfig,
) {
  const values: PlanningCenterValue[] = [
    { formFieldId: config.fieldIds.firstName, value: lead.firstName },
    { formFieldId: config.fieldIds.lastName, value: lead.lastName },
    { formFieldId: config.fieldIds.email, value: lead.email },
    { formFieldId: config.fieldIds.city, value: lead.city },
    {
      formFieldId: config.fieldIds.campaignSource,
      value: lead.campaign,
    },
  ];

  if (lead.phone) {
    values.push({ formFieldId: config.fieldIds.phone, value: lead.phone });
  }

  for (const interest of lead.interests) {
    values.push({
      formFieldId: config.fieldIds.interests,
      value: getInterestValue(interest, config),
    });
  }

  return {
    data: {
      type: "FormSubmission",
      attributes: {
        person_attributes: {
          first_name: lead.firstName,
          last_name: lead.lastName,
          emails_attributes: [
            {
              location: "Home",
              address: lead.email,
            },
          ],
          ...(lead.phone
            ? {
                phone_numbers_attributes: [
                  {
                    location: "Mobile",
                    number: lead.phone,
                  },
                ],
              }
            : {}),
        },
      },
    },
    included: values.map(({ formFieldId, value }) => ({
      type: "FormSubmissionValue",
      attributes: {
        form_field_id: formFieldId,
        value,
      },
      relationships: {
        form_field: {
          data: {
            type: "FormField",
            id: formFieldId,
          },
        },
      },
    })),
  };
}

export async function submitLeadToPlanningCenter(
  lead: LeadSubmission,
  env: Env = process.env,
): Promise<PlanningCenterSubmissionResult> {
  if (shouldUsePlanningCenterMock(env)) {
    const payload = buildPlanningCenterPayload(
      lead,
      getMockPlanningCenterConfig(env),
    );

    console.info(
      "[cci-campaigns] Mock Planning Center submission",
      JSON.stringify(
        {
          mode: "mock",
          lead,
          payload,
        },
        null,
        2,
      ),
    );

    return { mode: "mock" };
  }

  const config = getPlanningCenterConfig(env);
  const credentials = Buffer.from(
    `${config.clientId}:${config.secret}`,
  ).toString("base64");
  const response = await fetch(
    `https://api.planningcenteronline.com/people/v2/forms/${config.formId}/form_submissions`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        "User-Agent": config.userAgent,
      },
      body: JSON.stringify(buildPlanningCenterPayload(lead, config)),
    },
  );

  if (!response.ok) {
    throw new PlanningCenterSubmissionError(response.status);
  }

  return { mode: "live" };
}
