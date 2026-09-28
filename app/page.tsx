"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

type StepKey =
  | "welcome"
  | "contact"
  | "bmi"
  | "low"
  | "conditions"
  | `health-${string}`
  | "medication"
  | "dose"
  | "history"
  | "address"
  | "upload"
  | "notes"
  | "agreement"
  | "consent"
  | "policy"
  | "review"
  | "payment"
  | "result";

type HealthQuestion = {
  id: string;
  label: string;
  options: string[];
};

type FormState = {
  welcome: boolean;
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  phone: string;
  state: string;
  over18: string;
  contactMethod: string;
  heightFeet: string;
  heightInches: string;
  weightLb: string;
  currentGLP: string;
  bmiBelow27: string;
  conditions: string[];
  healthAnswers: Record<string, string>;
  glpMedication: string;
  treatmentType: string;
  currentDose: string;
  lastInjection: string;
  prescriptionFileName: string;
  fileAttached: boolean;
  shippingDifferent: boolean;
  homeStreet: string;
  homeUnit: string;
  homeCity: string;
  homeState: string;
  homeZip: string;
  shipStreet: string;
  shipUnit: string;
  shipCity: string;
  shipState: string;
  shipZip: string;
  extraNotes: string;
  agreementSigned: boolean;
  consentSigned: boolean;
  policySigned: boolean;
  consentDate: string;
  typedName: string;
};

const healthQuestions: HealthQuestion[] = [
  { id: "26", label: "Do you have a history of high blood pressure?", options: ["Yes", "No"] },
  { id: "33", label: "Have you ever been diagnosed with diabetes or prediabetes?", options: ["Yes", "No"] },
  { id: "34", label: "Do you have a history of sleep apnea?", options: ["Yes", "No"] },
  { id: "35", label: "Do you have a history of depression or anxiety?", options: ["Yes", "No"] },
  { id: "36", label: "Do you have insulin resistance or metabolic syndrome?", options: ["Yes", "No"] },
  { id: "37", label: "Do you have a history of kidney disease?", options: ["Yes", "No"] },
  { id: "38", label: "Do you have a history of thyroid disease?", options: ["Yes", "No"] },
  { id: "39", label: "Do you have a history of heart disease or stroke?", options: ["Yes", "No"] },
  { id: "40", label: "Have you had a history of gallbladder problems?", options: ["Yes", "No"] },
  { id: "41", label: "Do you have any food allergies or medication allergies?", options: ["Yes", "No"] },
  { id: "42", label: "Do you have a history of eating disorder concerns?", options: ["Yes", "No"] },
];

const weightRelatedConditions = [
  "High blood pressure",
  "Type 2 diabetes or prediabetes",
  "Sleep apnea",
  "Joint pain or arthritis",
  "Fatty liver disease",
  "High cholesterol",
  "Polycystic ovarian syndrome",
  "None of the Above",
];

const agreementTexts = {
  agreement: [
    "Thrive Weight Management Program Agreement",
    "This program is designed to support patients who are interested in ongoing wellness and medical weight management through coordinated clinical care, education, and treatment planning.",
    "A licensed provider reviews treatment appropriateness based on the patient intake, history, and program policies. Participation does not guarantee medication or treatment approval.",
    "Patients are responsible for reviewing program information, avoiding medication misuse, reporting side effects, and following guidance provided by the care team.",
  ],
  consent: [
    "Thrive GLP Medication Informed Consent",
    "I understand that medication use may require medical monitoring and that treatment plans can change based on symptoms, labs, side effects, or provider assessment.",
    "I understand that medication may not be appropriate for everyone, and a provider will determine whether it is appropriate for my care plan.",
    "I agree to follow prescribed instructions, report side effects promptly, and maintain follow-up appointments when recommended.",
  ],
  policy: [
    "Identity & Payment Information Policy",
    "I understand that identity verification and payment information may be required before treatment begins.",
    "I confirm the information I provide is accurate and that I authorize Thrive to use it for intake, billing, and program support as necessary.",
    "I understand this is part of the care process and separate from any medical treatment decision.",
  ],
};

const initialForm: FormState = {
  welcome: false,
  firstName: "",
  lastName: "",
  dob: "",
  email: "",
  phone: "",
  state: "",
  over18: "",
  contactMethod: "Email",
  heightFeet: "",
  heightInches: "",
  weightLb: "",
  currentGLP: "",
  bmiBelow27: "",
  conditions: [],
  healthAnswers: {},
  glpMedication: "",
  treatmentType: "",
  currentDose: "",
  lastInjection: "",
  prescriptionFileName: "",
  fileAttached: false,
  shippingDifferent: false,
  homeStreet: "",
  homeUnit: "",
  homeCity: "",
  homeState: "",
  homeZip: "",
  shipStreet: "",
  shipUnit: "",
  shipCity: "",
  shipState: "",
  shipZip: "",
  extraNotes: "",
  agreementSigned: false,
  consentSigned: false,
  policySigned: false,
  consentDate: "",
  typedName: "",
};

const states = [
  "North Carolina",
  "South Carolina",
  "Virginia",
  "Georgia",
  "Florida",
  "Tennessee",
  "Different State",
];

const calculateBMI = (state: FormState) => {
  const feet = Number(state.heightFeet || 0);
  const inches = Number(state.heightInches || 0);
  const weight = Number(state.weightLb || 0);

  if (!Number.isFinite(feet) || !Number.isFinite(inches) || !Number.isFinite(weight)) {
    return null;
  }

  if (feet < 3 || feet > 8 || inches < 0 || inches > 11 || weight < 50 || weight > 900) {
    return null;
  }

  const totalInches = feet * 12 + inches;
  const bmi = (weight * 703) / totalInches ** 2;

  return Number(bmi.toFixed(1));
};

const urgentConditionLabels = new Set([
  "High blood pressure",
  "Type 2 diabetes or prediabetes",
  "Sleep apnea",
  "High cholesterol",
  "Polycystic ovarian syndrome",
  "Fatty liver disease",
  "Joint pain or arthritis",
]);

const getVisibleHealthQuestions = (state: FormState) => {
  if (state.conditions.some((condition) => urgentConditionLabels.has(condition))) {
    return [];
  }

  const answeredYes = Object.values(state.healthAnswers).includes("Yes");
  if (answeredYes) {
    return [];
  }

  return healthQuestions;
};

const getRoute = (state: FormState): StepKey[] => {
  const route: StepKey[] = ["welcome", "contact", "bmi"];
  const bmi = calculateBMI(state);

  if (bmi !== null && bmi < 27) {
    route.push("low");
  } else if (bmi !== null && bmi >= 27 && bmi < 30) {
    route.push("conditions");
  }

  const visibleHealthQuestions = getVisibleHealthQuestions(state);
  if (visibleHealthQuestions.length > 0) {
    route.push(...visibleHealthQuestions.map((question) => `health-${question.id}` as StepKey));
  }

  route.push("medication");

  if (state.glpMedication === "Yes") {
    route.push("dose");
  }

  route.push("history", "address");

  if (state.glpMedication === "Yes") {
    route.push("upload");
  }

  route.push("notes", "agreement", "consent", "policy", "review");

  return route;
};

const stepLabelMap: Record<StepKey, string> = {
  welcome: "Welcome",
  contact: "About you",
  bmi: "Height & weight",
  low: "Current GLP treatment",
  conditions: "Weight-related conditions",
  medication: "Your GLP treatment",
  dose: "Current treatment",
  history: "Health history",
  address: "Your address",
  upload: "Prescription",
  notes: "Extra details",
  agreement: "Program agreement",
  consent: "Medication consent",
  policy: "Payment policy",
  review: "Review",
  payment: "Payment",
  result: "Result",
};

const subscribeToCheckoutReturn = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};

const getCheckoutReturnSnapshot = () => {
  const params = new URLSearchParams(window.location.search);
  const checkout = params.get("checkout");

  if (checkout === "cancelled") return "cancelled";
  if (checkout === "success") return `success:${params.get("session_id") ?? ""}`;

  return null;
};

const getServerCheckoutReturnSnapshot = () => null;

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const renderTextField = (
  label: string,
  value: string,
  onChange: (value: string) => void,
  type: "text" | "email" | "tel" | "date" | "number" = "text",
  placeholder?: string,
  extraClass = ""
) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
    <span>{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-[#4dc8c6] focus:bg-white ${extraClass}`}
    />
  </label>
);

const renderRadioGroup = (
  label: string,
  value: string,
  options: string[],
  onChange: (value: string) => void,
  helperText?: string
) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
    <h3 className="mb-2 text-base font-semibold text-slate-800">{label}</h3>
    {helperText ? <p className="mb-4 text-sm text-slate-500">{helperText}</p> : null}
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => (
        <label
          key={option}
          className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
            value === option
              ? "border-[#4dc8c6] bg-[#e9f8f7]"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <input
            type="radio"
            name={label}
            checked={value === option}
            onChange={() => onChange(option)}
            className="h-4 w-4 accent-[#3cb7b5]"
          />
          <span className="text-sm font-semibold text-slate-700">{option}</span>
        </label>
      ))}
    </div>
  </div>
);

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const checkoutReturn = useSyncExternalStore(
    subscribeToCheckoutReturn,
    getCheckoutReturnSnapshot,
    getServerCheckoutReturnSnapshot
  );

  const route = useMemo(() => getRoute(form), [form]);
  const isPaymentStep = paymentRequired || checkoutReturn !== null;
  const currentStep = isPaymentStep ? "payment" : route[currentIndex] ?? "welcome";
  const progress = isPaymentStep ? 100 : route.length ? ((currentIndex + 1) / route.length) * 100 : 0;
  const bmi = calculateBMI(form);

  useEffect(() => {
    if (currentIndex >= route.length) {
      setCurrentIndex(route.length - 1);
    }
  }, [currentIndex, route.length]);

  useEffect(() => {
    if (!checkoutReturn?.startsWith("success:")) return;

    const sessionId = checkoutReturn.slice("success:".length);
    if (!sessionId) return;

    const controller = new AbortController();

    fetch(`/api/checkout?session_id=${encodeURIComponent(sessionId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to verify payment status.");
        }
        if (!payload?.paid) {
          throw new Error("Payment is not confirmed yet. Please check again shortly.");
        }
        setPaymentComplete(true);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          const message = error instanceof Error ? error.message : "Unable to verify payment status.";
          setPaymentMessage(message);
        }
      });

    return () => controller.abort();
  }, [checkoutReturn]);

  const updateField = (key: keyof FormState, value: string | boolean | string[]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleCondition = (value: string) => {
    setForm((current) => {
      const selected = current.conditions.includes(value)
        ? current.conditions.filter((item) => item !== value)
        : [...current.conditions, value];

      return {
        ...current,
        conditions:
          value === "None of the Above"
            ? ["None of the Above"]
            : selected.filter((item) => item !== "None of the Above"),
      };
    });
  };

  const validateCurrentStep = () => {
    if (currentStep.startsWith("health-")) {
      const questionId = currentStep.replace("health-", "");
      if (!form.healthAnswers[questionId]) {
        return "Please answer this screening question before continuing.";
      }
      return null;
    }

    switch (currentStep) {
      case "welcome":
        return form.welcome ? null : "Please confirm that you understand this is a preliminary intake.";
      case "contact":
        if (!form.firstName.trim() || !form.lastName.trim()) return "Please enter your first and last name.";
        if (!form.dob) return "Please provide your date of birth.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
        if ((form.phone.match(/\d/g) ?? []).length < 10) return "Please enter a valid phone number.";
        if (!form.state) return "Please select your state of residence.";
        if (!form.over18) return "Please confirm you are at least 18 years old.";
        return null;
      case "bmi":
        if (!form.heightFeet || !form.heightInches || !form.weightLb) return "Please complete your height and weight.";
        if (calculateBMI(form) === null) return "Please enter a valid height and weight.";
        return null;
      case "low":
        if (!form.currentGLP) return "Please answer whether you are currently taking a GLP medication.";
        return null;
      case "conditions":
        if (form.conditions.length === 0) return "Please select at least one condition or choose None of the Above.";
        return null;
      case "medication":
        if (!form.glpMedication) return "Please answer the GLP medication question.";
        return null;
      case "dose":
        if (!form.treatmentType || !form.currentDose || !form.lastInjection) return "Please complete the treatment details.";
        return null;
      case "history":
        return null;
      case "address":
        if (!form.homeStreet || !form.homeCity || !form.homeState || !form.homeZip) return "Please complete your current address.";
        if (form.shippingDifferent && (!form.shipStreet || !form.shipCity || !form.shipState || !form.shipZip)) {
          return "Please complete your shipping address if it differs from your current address.";
        }
        return null;
      case "upload":
        return null;
      case "notes":
        return null;
      case "agreement":
        if (!form.agreementSigned) return "Please acknowledge the program agreement before continuing.";
        return null;
      case "consent":
        if (!form.consentSigned) return "Please acknowledge the medication informed consent before continuing.";
        return null;
      case "policy":
        if (!form.policySigned || !form.consentDate) return "Please acknowledge the policy and enter the agreement date.";
        return null;
      case "review":
        return form.typedName.trim() ? null : "Please verify the information and confirm the intake is accurate.";
      default:
        return null;
    }
  };

  const moveNext = () => {
    const invalidMessage = validateCurrentStep();
    if (invalidMessage) {
      setSubmissionMessage(invalidMessage);
      return;
    }

    setSubmissionMessage(null);

    if (currentStep === "review") {
      setSubmissionMessage("Your intake has been completed and is ready for review.");
      return;
    }

    if (currentStep === "result") {
      setCurrentIndex(0);
      setForm(initialForm);
      setSubmissionMessage(null);
      return;
    }

    setCurrentIndex((value) => Math.min(value + 1, route.length - 1));
  };

  const moveBack = () => {
    setCurrentIndex((value) => Math.max(value - 1, 0));
    setSubmissionMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentStep !== "review" || isSubmitting) return;

    const invalidMessage = validateCurrentStep();
    if (invalidMessage) {
      setSubmissionMessage(invalidMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      setSubmissionMessage("Submitting intake...");

      const response = await fetch("/api/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            body: {
              patient_id: `patient_${Date.now()}`,
              form_id: "2395278",
              first_name: form.firstName,
              last_name: form.lastName,
              email: form.email,
              is_recurring: false,
            },
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || `Request failed with status ${response.status}`);
      }

      setSubmissionMessage(null);
      setPaymentMessage(null);
      setCurrentIndex(route.length);
      setPaymentRequired(true);
    } catch (error) {
      console.error("Mock POST failed:", error);
      const message = error instanceof Error ? error.message : "There was a problem submitting the intake. Please try again.";
      setSubmissionMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartCheckout = async () => {
    if (isStartingCheckout || paymentComplete) return;

    setIsStartingCheckout(true);
    setPaymentMessage(null);

    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to start secure checkout.");
      }
      if (typeof payload?.url !== "string") {
        throw new Error("The checkout session did not return a valid URL.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start secure checkout.";
      setPaymentMessage(message);
      setIsStartingCheckout(false);
    }
  };

  const renderAgreementSection = (section: "agreement" | "consent" | "policy") => (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Required acknowledgment</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-900">{agreementTexts[section][0]}</h3>
      </div>

      <div className="space-y-4 text-sm leading-6 text-slate-600">
        {agreementTexts[section].slice(1).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={section === "agreement" ? form.agreementSigned : section === "consent" ? form.consentSigned : form.policySigned}
          onChange={(event) =>
            section === "agreement"
              ? updateField("agreementSigned", event.target.checked)
              : section === "consent"
                ? updateField("consentSigned", event.target.checked)
                : updateField("policySigned", event.target.checked)
          }
          className="mt-1 h-4 w-4 accent-[#3cb7b5]"
        />
        <span>I have read and understand this agreement and voluntarily acknowledge its terms.</span>
      </label>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          <span>Type your full name</span>
          <input
            type="text"
            value={form.typedName}
            onChange={(event) => updateField("typedName", event.target.value)}
            placeholder="Your full name"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-[#4dc8c6]"
          />
        </label>

        {section === "policy" ? (
          <div className="pt-2">
            {renderTextField(
              "Agreement date",
              form.consentDate,
              (value) => updateField("consentDate", value),
              "date",
              undefined,
              "max=" + new Date().toISOString().slice(0, 10)
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderHealthQuestionScreen = () => {
    const questionId = currentStep.replace("health-", "");
    const question = healthQuestions.find((entry) => entry.id === questionId);

    if (!question) {
      return null;
    }

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Screening</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Health screening</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{question.label}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 transition ${
                form.healthAnswers[question.id] === option ? "border-[#4dc8c6] bg-[#e9f8f7]" : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name={question.label}
                checked={form.healthAnswers[question.id] === option}
                onChange={() => {
                  setForm((current) => ({
                    ...current,
                    healthAnswers: {
                      ...current.healthAnswers,
                      [question.id]: option,
                    },
                  }));
                }}
                className="h-4 w-4 accent-[#3cb7b5]"
              />
              <span className="text-sm font-semibold text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderScreen = () => {
    if (currentStep.startsWith("health-")) {
      return renderHealthQuestionScreen();
    }

    switch (currentStep) {
      case "welcome":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Welcome to Thrive</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Your journey with Thrive starts here.</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Complete your screening, tell us about your health, and review your program agreements before a licensed provider determines if treatment is appropriate.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold text-slate-800">Before you begin</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This intake helps our care team understand your health history. Completing it does not guarantee treatment or a prescription.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This is a test page. Use fictional details. Answers stay on this page and are cleared when the page is refreshed.
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.welcome}
                onChange={(event) => updateField("welcome", event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#3cb7b5]"
              />
              <span>
                I understand that this is a preliminary intake and that a licensed provider makes all treatment decisions.
              </span>
            </label>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">About you</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Let&apos;s get to know you.</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">Enter your contact information to begin. Required fields are marked with an asterisk.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {renderTextField("First name *", form.firstName, (value) => updateField("firstName", value), "text", "Jane")}
              {renderTextField("Last name *", form.lastName, (value) => updateField("lastName", value), "text", "Smith")}
              {renderTextField("Date of birth *", form.dob, (value) => updateField("dob", value), "date")}
              {renderTextField("Email *", form.email, (value) => updateField("email", value), "email", "jane@company.com")}
              {renderTextField(
                "Phone number *",
                form.phone,
                (value) => updateField("phone", formatPhoneNumber(value)),
                "tel",
                "(555) 123-4567"
              )}
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                <span>State of residence *</span>
                <select
                  value={form.state}
                  onChange={(event) => updateField("state", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-[#4dc8c6] focus:bg-white"
                >
                  <option value="">Select your state</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-4 text-base font-semibold text-slate-800">Are you at least 18 years old? *</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      form.over18 === option.value ? "border-[#4dc8c6] bg-[#e9f8f7]" : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="over18"
                      checked={form.over18 === option.value}
                      onChange={() => updateField("over18", option.value)}
                      className="h-4 w-4 accent-[#3cb7b5]"
                    />
                    <span className="text-sm font-semibold text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {renderRadioGroup(
              "Preferred method of contact",
              form.contactMethod,
              ["Email", "Text Message", "Phone Call"],
              (value) => updateField("contactMethod", value),
              "Choose the best way for our care team to reach out."
            )}
          </div>
        );

      case "bmi":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Screening</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Height & weight</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">We use your height and weight to calculate your body mass index.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-5 md:grid-cols-3">
                {renderTextField("Height — feet *", form.heightFeet, (value) => updateField("heightFeet", value), "number", "5")}
                {renderTextField("Height — inches *", form.heightInches, (value) => updateField("heightInches", value), "number", "8")}
                {renderTextField("Weight — pounds *", form.weightLb, (value) => updateField("weightLb", value), "number", "180")}
              </div>
            </div>

            <div className="rounded-2xl border border-[#cceeed] bg-[#e9f8f7] p-5">
              <p className="text-sm text-slate-500">Your calculated BMI</p>
              <strong className="mt-2 block text-4xl font-bold text-slate-900">{bmi !== null ? bmi.toFixed(1) : "—"}</strong>
            </div>
          </div>
        );

      case "low":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Screening</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Current GLP treatment</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">For a BMI below 27, this preliminary pathway requires current GLP treatment.</p>
            </div>
            {renderRadioGroup("Are you currently taking a GLP medication?", form.currentGLP, ["Yes", "No"], (value) => updateField("currentGLP", value))}
          </div>
        );

      case "conditions":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Screening</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Weight-related health conditions</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">Select all that apply, or choose None of the Above.</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              {weightRelatedConditions.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${
                    form.conditions.includes(option)
                      ? "border-[#4dc8c6] bg-[#e9f8f7]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.conditions.includes(option)}
                    onChange={() => toggleCondition(option)}
                    className="h-4 w-4 accent-[#3cb7b5]"
                  />
                  <span className="text-sm font-semibold text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case "medication":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Treatment history</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Your GLP treatment</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">Tell us about your current medication use.</p>
            </div>
            {renderRadioGroup("Do you currently take a GLP medication?", form.glpMedication, ["Yes", "No"], (value) => updateField("glpMedication", value))}
          </div>
        );

      case "dose":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Treatment history</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Your current treatment</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">These questions record your existing prescription; they are not dosing recommendations.</p>
            </div>

            <div className="space-y-5">
              {renderRadioGroup("Which medication are you taking?", form.treatmentType, ["Ozempic", "Wegovy", "Semaglutide", "Other"], (value) => updateField("treatmentType", value))}
              {renderRadioGroup("What treatment phase are you in?", form.currentDose, ["Maintenance", "Titration", "New start"], (value) => updateField("currentDose", value))}
              {renderTextField("Current dose", form.lastInjection, (value) => updateField("lastInjection", value), "text", "Example: 0.5 mg weekly")}
              {renderTextField("Last injection date", form.consentDate, (value) => updateField("consentDate", value), "date")}
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Your health</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Medications & medical history</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">Include prescription medications, supplements, and relevant conditions.</p>
            </div>

            <div className="space-y-5">
              {[
                { label: "Are you taking any other prescription medications?", value: form.bmiBelow27 },
                { label: "Have you used supplements or over-the-counter medications recently?", value: form.bmiBelow27 },
                { label: "Do you have any significant medical conditions to share?", value: form.bmiBelow27 },
              ].map((question) => (
                <div key={question.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-4 text-base font-semibold text-slate-800">{question.label}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      "Yes",
                      "No",
                    ].map((option) => (
                      <label key={option} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <input type="radio" name={question.label} className="h-4 w-4 accent-[#3cb7b5]" />
                        <span className="text-sm font-semibold text-slate-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <label className="block space-y-2 text-sm font-semibold text-slate-700">
                Additional details
                <textarea
                  value={form.extraNotes}
                  onChange={(event) => updateField("extraNotes", event.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-[#4dc8c6]"
                  placeholder="Please include any relevant conditions, medications, or symptoms."
                />
              </label>
            </div>
          </div>
        );

      case "address":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Your address</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Where can we reach you?</h2>
            </div>

            <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-xl font-semibold text-slate-800">Current address</h3>
              <div className="grid gap-5 md:grid-cols-2">
                {renderTextField("Street address *", form.homeStreet, (value) => updateField("homeStreet", value), "text", "123 Main Street")}
                {renderTextField("Apartment / suite", form.homeUnit, (value) => updateField("homeUnit", value), "text", "Suite 205")}
                {renderTextField("City *", form.homeCity, (value) => updateField("homeCity", value), "text", "Raleigh")}
                {renderTextField("State *", form.homeState, (value) => updateField("homeState", value), "text", "NC")}
                {renderTextField("ZIP code *", form.homeZip, (value) => updateField("homeZip", value), "text", "27601")}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.shippingDifferent}
                onChange={(event) => updateField("shippingDifferent", event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#3cb7b5]"
              />
              <span>My shipping address is different from my current address.</span>
            </label>

            {form.shippingDifferent ? (
              <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-xl font-semibold text-slate-800">Shipping address</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  {renderTextField("Street address *", form.shipStreet, (value) => updateField("shipStreet", value), "text", "456 Pine Ave")}
                  {renderTextField("Apartment / suite", form.shipUnit, (value) => updateField("shipUnit", value), "text", "Apt 2")}
                  {renderTextField("City *", form.shipCity, (value) => updateField("shipCity", value), "text", "Durham")}
                  {renderTextField("State *", form.shipState, (value) => updateField("shipState", value), "text", "NC")}
                  {renderTextField("ZIP code *", form.shipZip, (value) => updateField("shipZip", value), "text", "27701")}
                </div>
              </div>
            ) : null}
          </div>
        );

      case "upload":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Treatment history</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Your current prescription</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">You can provide this later if you do not have it nearby.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <label className="flex cursor-pointer flex-col gap-3 text-sm font-semibold text-slate-700">
                <span>Upload prescription</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    updateField("prescriptionFileName", file.name);
                    updateField("fileAttached", true);
                  }}
                  className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm"
                />
              </label>

              <p className="mt-4 text-sm text-slate-500">
                {form.fileAttached ? `Selected file: ${form.prescriptionFileName}` : "No file selected. JPG, PNG, HEIC, or PDF up to 10 MB."}
              </p>
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Your health</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Anything else to share?</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">Add anything you would like your provider to know.</p>
            </div>

            <label className="block space-y-2 text-sm font-semibold text-slate-700">
              Additional information
              <textarea
                value={form.extraNotes}
                onChange={(event) => updateField("extraNotes", event.target.value)}
                rows={6}
                placeholder="Share any medications, symptoms, goals, or concerns you want reviewed."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-[#4dc8c6]"
              />
            </label>
          </div>
        );

      case "agreement":
        return renderAgreementSection("agreement");

      case "consent":
        return renderAgreementSection("consent");

      case "policy":
        return renderAgreementSection("policy");

      case "review":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">Final review</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Review your intake</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">Use Back to make changes before completing the test intake.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <dl className="space-y-4 text-sm text-slate-700">
                <div className="flex justify-between gap-5 border-b border-slate-200 pb-2"><dt className="font-medium text-slate-500">Name</dt><dd className="text-right font-semibold text-slate-900">{form.firstName} {form.lastName}</dd></div>
                <div className="flex justify-between gap-5 border-b border-slate-200 pb-2"><dt className="font-medium text-slate-500">Date of birth</dt><dd className="text-right font-semibold text-slate-900">{form.dob || "—"}</dd></div>
                <div className="flex justify-between gap-5 border-b border-slate-200 pb-2"><dt className="font-medium text-slate-500">Email</dt><dd className="text-right font-semibold text-slate-900">{form.email || "—"}</dd></div>
                <div className="flex justify-between gap-5 border-b border-slate-200 pb-2"><dt className="font-medium text-slate-500">Phone</dt><dd className="text-right font-semibold text-slate-900">{form.phone || "—"}</dd></div>
                <div className="flex justify-between gap-5 border-b border-slate-200 pb-2"><dt className="font-medium text-slate-500">State</dt><dd className="text-right font-semibold text-slate-900">{form.state || "—"}</dd></div>
                <div className="flex justify-between gap-5 border-b border-slate-200 pb-2"><dt className="font-medium text-slate-500">BMI</dt><dd className="text-right font-semibold text-slate-900">{bmi !== null ? bmi.toFixed(1) : "—"}</dd></div>
                <div className="flex justify-between gap-5 border-b border-slate-200 pb-2"><dt className="font-medium text-slate-500">Current GLP medication</dt><dd className="text-right font-semibold text-slate-900">{form.glpMedication || "—"}</dd></div>
                <div className="flex justify-between gap-5 border-b border-slate-200 pb-2"><dt className="font-medium text-slate-500">Prescription file</dt><dd className="text-right font-semibold text-slate-900">{form.fileAttached ? form.prescriptionFileName : "Not uploaded yet"}</dd></div>
              </dl>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.agreementSigned && form.consentSigned && form.policySigned}
                onChange={(event) => {
                  const checked = event.target.checked;
                  updateField("agreementSigned", checked);
                  updateField("consentSigned", checked);
                  updateField("policySigned", checked);
                }}
                className="mt-1 h-4 w-4 accent-[#3cb7b5]"
              />
              <span>I confirm the information I have provided is accurate and complete.</span>
            </label>
          </div>
        );

      case "payment": {
        const checkoutSucceeded = checkoutReturn?.startsWith("success:");
        const checkoutCancelled = checkoutReturn === "cancelled";

        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#47aead]">
                Intake submitted
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                {paymentComplete ? "Payment received" : "Complete your payment"}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                {paymentComplete
                  ? "Your payment has been confirmed. You can safely close this page."
                  : "Continue to Stripe's secure checkout to complete payment. Your health information is not sent to Stripe."}
              </p>
            </div>

            {checkoutCancelled ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Checkout was canceled. You can try again when you are ready.
              </div>
            ) : null}

            {checkoutSucceeded && !paymentComplete && !paymentMessage ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Verifying your payment with Stripe...
              </div>
            ) : null}

            {paymentMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {paymentMessage}
              </div>
            ) : null}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const currentStepLabel =
    currentStep.startsWith("health-")
      ? healthQuestions.find((question) => `health-${question.id}` === currentStep)?.label ?? "Screening"
      : stepLabelMap[currentStep] ?? "Step";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(77,200,198,0.14),transparent_34%),linear-gradient(180deg,_#f8fbfd_0%,_#eef5f8_100%)] px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_54px_rgba(12,39,66,0.12)]">
        <header className="bg-[linear-gradient(135deg,_#0c2742,_#153c5e)] px-6 py-5 text-white md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-200">ThriveMedRX</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">Patient Intake</h1>
            </div>
            <div className="text-right text-xs text-slate-200">
              <div className="font-extrabold uppercase tracking-[0.14em]">{currentStepLabel}</div>
              <div className="mt-1">{isPaymentStep ? route.length + 1 : currentIndex + 1} of {route.length + (isPaymentStep ? 1 : 0)}</div>
            </div>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,_#75ddd9,_#43c0bd)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <div className="min-h-[520px] p-5 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderScreen()}

            {submissionMessage ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {submissionMessage}
              </div>
            ) : null}
          </form>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-5 py-4 md:px-8">
          {currentStep !== "payment" ? (
            <button
              type="button"
              onClick={moveBack}
              disabled={currentIndex === 0}
              className="min-w-[118px] rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
          ) : null}

          {currentStep !== "review" && currentStep !== "payment" ? (
            <button
              type="button"
              onClick={moveNext}
              className="min-w-[118px] rounded-xl bg-[linear-gradient(135deg,_#58d0cc,_#3fb5b4)] px-5 py-3 text-sm font-bold text-slate-900 shadow-[0_7px_18px_rgba(63,181,180,0.2)] transition hover:brightness-105"
            >
              {currentIndex === route.length - 1 ? "Complete" : "Continue"}
            </button>
          ) : null}

          {currentStep === "payment" ? (
            <button
              type="button"
              onClick={handleStartCheckout}
              disabled={isStartingCheckout || paymentComplete || Boolean(checkoutReturn?.startsWith("success:"))}
              className="min-w-[190px] rounded-xl bg-[linear-gradient(135deg,_#58d0cc,_#3fb5b4)] px-5 py-3 text-sm font-bold text-slate-900 shadow-[0_7px_18px_rgba(63,181,180,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paymentComplete
                ? "Payment complete"
                : checkoutReturn?.startsWith("success:")
                  ? "Verifying payment"
                  : isStartingCheckout
                    ? "Opening checkout..."
                    : "Continue to secure checkout"}
            </button>
          ) : null}

          {currentStep === "review" ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[118px] rounded-xl bg-[linear-gradient(135deg,_#58d0cc,_#3fb5b4)] px-5 py-3 text-sm font-bold text-slate-900 shadow-[0_7px_18px_rgba(63,181,180,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Complete intake"}
            </button>
          ) : null}
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-[11px] text-slate-500">
          Payment is handled by Stripe Checkout. Health information is not sent to Stripe.
        </footer>
      </div>
    </main>
  );
}
