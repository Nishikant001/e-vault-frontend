// src/Pages/BookDemo/BookDemoFlow.jsx
//
// Orchestrates the pre-auth Book Demo funnel:
//   Welcome -> Policies & FAQ (+ Agree) -> Eligibility -> onDone()
//
// This component owns ONLY the pre-auth steps. It knows nothing about
// login/register/dashboards — it just calls onDone(answers) once the
// person has agreed to policies and answered the eligibility questions.
// The parent (App.jsx) decides what happens next: skip straight to the
// Book Demo page if already logged in, or send the person to auth first.

import { useState } from "react";
import BookDemoWelcome from "./BookDemoWelcome";
import BookDemoPolicies from "./BookDemoPolicies";
import BookDemoEligibility from "./BookDemoEligibility";

const STEP_LABELS = ["Welcome", "Policies", "Eligibility"];

export default function BookDemoFlow({ onDone, onExit }) {
  const [step, setStep] = useState(0); // 0 welcome, 1 policies, 2 eligibility

  if (step === 0) {
    return (
      <BookDemoWelcome
        stepIndex={0}
        totalSteps={STEP_LABELS}
        onContinue={() => setStep(1)}
        onExit={onExit}
      />
    );
  }

  if (step === 1) {
    return (
      <BookDemoPolicies
        stepIndex={1}
        totalSteps={STEP_LABELS}
        onContinue={() => setStep(2)}
        onBack={() => setStep(0)}
      />
    );
  }

  return (
    <BookDemoEligibility
      stepIndex={2}
      totalSteps={STEP_LABELS}
      onBack={() => setStep(1)}
      onContinue={(answers) => onDone(answers)}
    />
  );
}
