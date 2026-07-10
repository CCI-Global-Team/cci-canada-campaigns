"use client";

import type {
  CampaignInterest,
  CampaignSlug,
} from "@cci-campaigns/campaign-core/campaigns";
import {
  formatNorthAmericanPhoneInput,
  getLeadFieldErrors,
  parseLeadSubmission,
  type LeadFieldErrors,
  type LeadFieldName,
} from "@cci-campaigns/campaign-core/lead-schema";
import { ChangeEvent, FormEvent, useId, useRef, useState } from "react";

interface LeadFormProps {
  campaignSlug: CampaignSlug;
  interests: readonly CampaignInterest[];
  submitLabel: string;
  finePrint: string;
  thanksTitle: string;
  thanksBody: string;
  nextHref: string;
  nextLabel: string;
  fallbackHref: string;
  formAction?: string;
}

type SubmitState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fallbackHref?: string };

interface LeadApiErrorResult {
  message?: string;
  fallbackHref?: string;
  fieldErrors?: LeadFieldErrors;
}

const defaultAction = "/api/leads";
const fieldOrder: LeadFieldName[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "city",
  "interests",
];

function FieldError({
  id,
  message,
}: {
  id: string;
  message: string | undefined;
}) {
  if (!message) {
    return null;
  }

  return (
    <p className="form-field-error" id={id}>
      {message}
    </p>
  );
}

function hasFieldErrors(fieldErrors: LeadFieldErrors) {
  return fieldOrder.some((field) => Boolean(fieldErrors[field]));
}

export function LeadForm({
  campaignSlug,
  interests,
  submitLabel,
  finePrint,
  thanksTitle,
  thanksBody,
  nextHref,
  nextLabel,
  fallbackHref,
  formAction = defaultAction,
}: LeadFormProps) {
  const id = useId();
  const thanksRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({});

  const fieldIds = {
    firstName: `${id}-first-name`,
    lastName: `${id}-last-name`,
    email: `${id}-email`,
    phone: `${id}-phone`,
    city: `${id}-city`,
    interests: `${id}-interests`,
  };

  const errorIds = {
    firstName: `${id}-first-name-error`,
    lastName: `${id}-last-name-error`,
    email: `${id}-email-error`,
    phone: `${id}-phone-error`,
    city: `${id}-city-error`,
    interests: `${id}-interests-error`,
  };

  function clearFieldError(field: LeadFieldName) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function focusFirstFieldError(errors: LeadFieldErrors) {
    const firstField = fieldOrder.find((field) => Boolean(errors[field]));

    if (!firstField) {
      return;
    }

    requestAnimationFrame(() => {
      document.getElementById(fieldIds[firstField])?.focus();
    });
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.value = formatNorthAmericanPhoneInput(
      event.currentTarget.value,
    );
    clearFieldError("phone");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    const formData = new FormData(form);
    const payload = {
      campaign: campaignSlug,
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      city: String(formData.get("city") ?? ""),
      interests: formData.getAll("interests").map(String),
      website: String(formData.get("website") ?? ""),
    };
    const parsed = parseLeadSubmission(payload);

    if (!parsed.success) {
      const nextFieldErrors = getLeadFieldErrors(parsed.error);

      setFieldErrors(nextFieldErrors);
      setState({
        status: "error",
        message: hasFieldErrors(nextFieldErrors)
          ? "Please fix the field messages above."
          : "Please check the form and try again.",
      });
      focusFirstFieldError(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setState({
      status: "submitting",
      message: "Sending your details.",
    });

    try {
      const response = await fetch(formAction, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const result = (await response.json().catch(() => null)) as
        | LeadApiErrorResult
        | null;

      if (!response.ok) {
        const nextFieldErrors = result?.fieldErrors ?? {};

        setFieldErrors(nextFieldErrors);
        setState({
          status: "error",
          message:
            result?.message ??
            "We could not send the form. Please try again.",
          fallbackHref: result?.fallbackHref,
        });
        focusFirstFieldError(nextFieldErrors);
        return;
      }

      setState({
        status: "success",
        message: "Your details were sent.",
      });

      requestAnimationFrame(() => {
        thanksRef.current?.focus();
        thanksRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not send the form. Please try again or use the Church Center form link.",
        fallbackHref,
      });
    }
  }

  if (state.status === "success") {
    return (
      <div
        ref={thanksRef}
        tabIndex={-1}
        className="rounded-lg border border-[color:var(--campaign-line)] bg-[color:var(--campaign-surface)] px-6 py-12 text-center outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--campaign-gold)] sm:px-10"
      >
        <p
          aria-hidden="true"
          className="mb-5 font-display text-sm font-black uppercase text-[color:var(--campaign-gold)]"
        >
          Details received
        </p>
        <h3 className="font-display text-4xl font-extrabold uppercase leading-none text-[color:var(--campaign-cream)]">
          {thanksTitle}
        </h3>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[color:var(--campaign-muted)]">
          {thanksBody}
        </p>
        <a
          className="mt-8 inline-flex rounded-full border border-[color:var(--campaign-gold)] px-5 py-3 text-sm font-bold text-[color:var(--campaign-gold)] outline-none transition hover:bg-[color:var(--campaign-gold)] hover:text-[color:var(--campaign-ink)]! focus-visible:ring-2 focus-visible:ring-[color:var(--campaign-gold)]"
          href={nextHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {nextLabel}
        </a>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-[18px]"
      noValidate
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="campaign" value={campaignSlug} />
      <div className="absolute left-[-100vw]" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <fieldset>
        <legend className="form-label">
          Your name <span aria-hidden="true">*</span>
        </legend>
        <div className="grid gap-[18px] sm:grid-cols-2">
          <div>
            <label className="sr-only" htmlFor={fieldIds.firstName}>
              First name
            </label>
            <input
              className="form-input"
              id={fieldIds.firstName}
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              required
              aria-describedby={
                fieldErrors.firstName ? errorIds.firstName : undefined
              }
              aria-invalid={Boolean(fieldErrors.firstName)}
              onChange={() => clearFieldError("firstName")}
            />
            <FieldError
              id={errorIds.firstName}
              message={fieldErrors.firstName}
            />
          </div>

          <div>
            <label className="sr-only" htmlFor={fieldIds.lastName}>
              Last name
            </label>
            <input
              className="form-input"
              id={fieldIds.lastName}
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              required
              aria-describedby={
                fieldErrors.lastName ? errorIds.lastName : undefined
              }
              aria-invalid={Boolean(fieldErrors.lastName)}
              onChange={() => clearFieldError("lastName")}
            />
            <FieldError
              id={errorIds.lastName}
              message={fieldErrors.lastName}
            />
          </div>
        </div>
      </fieldset>

      <div className="grid gap-[18px] sm:grid-cols-2">
        <div>
          <label className="form-label" htmlFor={`${id}-email`}>
            Email
          </label>
          <input
            className="form-input"
            id={fieldIds.email}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            required
            aria-describedby={fieldErrors.email ? errorIds.email : undefined}
            aria-invalid={Boolean(fieldErrors.email)}
            onChange={() => clearFieldError("email")}
          />
          <FieldError id={errorIds.email} message={fieldErrors.email} />
        </div>

        <div>
          <label className="form-label" htmlFor={`${id}-phone`}>
            Phone{" "}
            <span className="text-[color:var(--campaign-soft)]">
              (optional)
            </span>
          </label>
          <input
            className="form-input"
            id={fieldIds.phone}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+1 (___) ___-____"
            aria-describedby={fieldErrors.phone ? errorIds.phone : undefined}
            aria-invalid={Boolean(fieldErrors.phone)}
            onChange={handlePhoneChange}
          />
          <FieldError id={errorIds.phone} message={fieldErrors.phone} />
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor={`${id}-city`}>
          City
        </label>
        <input
          className="form-input"
          id={fieldIds.city}
          name="city"
          type="text"
          autoComplete="address-level2"
          placeholder="Where are you watching from?"
          required
          aria-describedby={fieldErrors.city ? errorIds.city : undefined}
          aria-invalid={Boolean(fieldErrors.city)}
          onChange={() => clearFieldError("city")}
        />
        <FieldError id={errorIds.city} message={fieldErrors.city} />
      </div>

      <fieldset>
        <legend className="form-label" id={fieldIds.interests}>
          What are you hoping to find?{" "}
          <span className="text-[color:var(--campaign-soft)]">(optional)</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {interests.map((interest) => (
            <label key={interest} className="cursor-pointer">
              <input
                className="peer sr-only"
                type="checkbox"
                name="interests"
                value={interest}
              />
              <span className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--campaign-line)] bg-[color:var(--campaign-chip)] px-5 text-sm text-[color:var(--campaign-muted)] transition peer-checked:border-[color:var(--campaign-orange)] peer-checked:bg-[color:var(--campaign-chip-active)] peer-checked:text-[color:var(--campaign-cream)] peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--campaign-gold)]">
                {interest}
              </span>
            </label>
          ))}
        </div>
        <FieldError id={errorIds.interests} message={fieldErrors.interests} />
      </fieldset>

      {state.message ? (
        <div
          className={`text-sm leading-6 ${
            state.status === "error"
              ? "text-[color:var(--campaign-error)]"
              : "text-[color:var(--campaign-muted)]"
          }`}
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <p>{state.message}</p>
          {state.status === "error" && state.fallbackHref ? (
            <a
              className="mt-2 inline-flex font-bold text-[color:var(--campaign-gold)] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--campaign-gold)]"
              href={state.fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Complete the Church Center form
            </a>
          ) : null}
        </div>
      ) : null}

      <button
        className="campaign-gradient-button mt-2 min-h-14 rounded-lg px-7 py-[18px] font-display text-[18px] font-extrabold uppercase tracking-[0.04em] text-[color:var(--campaign-ink)] shadow-[0_10px_34px_rgba(230,50,28,0.28)] outline-none hover:-translate-y-0.5 hover:shadow-[0_14px_42px_rgba(255,138,51,0.38)] focus-visible:ring-2 focus-visible:ring-[color:var(--campaign-gold)] disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={state.status === "submitting"}
      >
        {state.status === "submitting" ? "Sending..." : submitLabel}
      </button>

      <p className="text-center text-xs leading-6 text-white">
        {finePrint}
      </p>
    </form>
  );
}
