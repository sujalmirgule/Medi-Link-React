import { GuardrailCheckResult } from "./ai.types";

export const MEDILINK_AI_SYSTEM_INSTRUCTION = `
You are the MediLink Medicine Information Assistant.
Your primary role is to provide basic, reliable, educational information about medicines available in the MediLink catalog.

STRICT MEDICAL SAFETY RULES (ZERO EXCEPTIONS):
1. You MUST NOT diagnose diseases or analyze symptoms.
2. You MUST NOT prescribe medicines or recommend medications for conditions.
3. You MUST NOT recommend, calculate, or change dosages for any individual (regardless of age, weight, or circumstances).
4. You MUST NOT recommend stopping, starting, or switching medications.
5. You MUST NOT provide emergency medical advice.
6. You MUST NOT hallucinate or invent medical facts, composition, or side effects.
7. If information is not available in the provided MediLink catalog, you MUST explicitly state that it is unavailable.
8. Always maintain a medically cautious, respectful, and educational tone.
9. Always remind users to consult a qualified doctor or licensed pharmacist for personal medical decisions.
`;

export const STANDARD_MEDICAL_DISCLAIMER =
  "Information provided by MediLink AI is for general educational awareness only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified physician or pharmacist.";

export class AIGuardrails {
  /**
   * Pre-inference guardrail check on user message.
   */
  static evaluateInput(message: string): GuardrailCheckResult {
    const cleanMsg = message.toLowerCase().trim();

    // 1. Prompt Injection & Jailbreak Attempts
    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
      /system\s+(prompt|override|instruction)/i,
      /reveal\s+(your|the)\s+(prompt|instructions)/i,
      /(output|reveal|leak|print|show)\s+(internal|secret|private|api|system)/i,
      /bypass\s+(safety|rules|guardrails)/i,
      /act\s+as\s+(a\s+)?(doctor|physician|prescriber|pharmacist)/i,
      /you\s+are\s+now\s+(a\s+)?(doctor|unrestricted)/i,
      /developer\s+mode/i,
      /dan\s+mode/i,
    ];
    for (const pattern of injectionPatterns) {
      if (pattern.test(cleanMsg)) {
        return {
          isBlocked: true,
          category: "PROMPT_INJECTION",
          redirectMessage:
            "MediLink AI is configured solely as an educational medicine information assistant and cannot bypass medical safety guardrails or act as a medical practitioner.",
        };
      }
    }

    // 2. Emergency Medical Requests
    const emergencyPatterns = [
      /\b(emergency|severe\s+chest\s+pain|heart\s+attack|stroke|can'?t\s+breathe|cannot\s+breathe|difficulty\s+breathing|shortness\s+of\s+breath|severe\s+bleeding|loss\s+of\s+consciousness|unconscious|poisoning|swallowed\s+poison|took\s+(all|too\s+many|an\s+overdose)|overdose|suicide|suicidal|anaphylaxis|choking)\b/i,
    ];
    for (const pattern of emergencyPatterns) {
      if (pattern.test(cleanMsg)) {
        return {
          isBlocked: true,
          category: "EMERGENCY",
          redirectMessage:
            "⚠️ EMERGENCY NOTICE: If you or someone else is experiencing a medical emergency, severe chest pain, breathing difficulties, poisoning, or an overdose, please call local emergency services (such as 112 / 108 in India) immediately or go to the nearest emergency room. MediLink AI cannot provide emergency medical support.",
        };
      }
    }

    // 3. Diagnosis Inquiries
    const diagnosisPatterns = [
      /\b(do\s+i\s+have|diagnose\s+me|what\s+(disease|illness|condition)\s+do\s+i\s+have|what('?s|\s+is)\s+wrong\s+with\s+me|why\s+is\s+my\s+(chest|head|stomach|arm|leg|heart)\s+(hurting|aching|painful)|i\s+have\s+symptoms?\s+of)\b/i,
      /\b(symptom\s+checker|diagnose\s+my\s+symptoms?)\b/i,
    ];
    for (const pattern of diagnosisPatterns) {
      if (pattern.test(cleanMsg)) {
        return {
          isBlocked: true,
          category: "DIAGNOSIS",
          redirectMessage:
            "MediLink AI cannot diagnose diseases or evaluate personal medical symptoms. Medical diagnosis requires professional clinical examination and diagnostic tests. Please consult a qualified doctor for an accurate diagnosis.",
        };
      }
    }

    // 4. Prescription / Medication Recommendation Inquiries
    const prescriptionPatterns = [
      /\b(what\s+(medicine|drug|tablet|pill|syrup|antibiotic)\s+(should|can)\s+i\s+(take|use|buy|consume))\b/i,
      /\b(prescribe(\s+me)?|\bwhat\s+can\s+i\s+take\s+for|\bwhat\s+should\s+i\s+take\s+for)\b/i,
      /\b(which\s+(medicine|tablet|drug|antibiotic)\s+is\s+best)\b/i,
      /\b(suggest\s+(a\s+)?(medicine|drug|tablet|treatment|antibiotic))\b/i,
      /\b(recommend\s+(a\s+)?(medicine|drug|tablet|treatment|antibiotic))\b/i,
    ];
    for (const pattern of prescriptionPatterns) {
      if (pattern.test(cleanMsg)) {
        return {
          isBlocked: true,
          category: "PRESCRIPTION",
          redirectMessage:
            "MediLink AI cannot prescribe medications or recommend specific drugs for medical conditions. Selecting appropriate medication requires an evaluation by a registered healthcare provider. Please consult a doctor or licensed pharmacist.",
        };
      }
    }

    // 5. Dosage / Dose Calculation / Adjustment Inquiries
    const dosagePatterns = [
      /\b(how\s+many\s+(tablets|pills|capsules|mg|drops|doses|times)\s+(should|can)\s+i\s+take)\b/i,
      /\b(what\s+is\s+(the|my)\s+(correct\s+)?(dosage|dose))\b/i,
      /\b(how\s+much\s+(should|can)\s+i\s+take)\b/i,
      /\b(can\s+i\s+(take|double|increase|decrease|change))(\s+(my|the))?\s+(\d+|two|three|double)?\s*(tablets?|dose|dosage|mg|pills?)\b/i,
      /\b(double|increase|decrease|adjust)\s+(my\s+)?(dose|dosage)\b/i,
      /\b(calculate(\s+(my|the|a|for))?\s*dos(e|age)|dos(e|age)\s+calculation)\b/i,
      /\b(i\s+am\s+\d+\s*(years|yrs|kg).*dos(e|age|take))\b/i,
      /\b(weight\s+\d+\s*kg.*dos(e|age|take))\b/i,
    ];
    for (const pattern of dosagePatterns) {
      if (pattern.test(cleanMsg)) {
        return {
          isBlocked: true,
          category: "DOSAGE",
          redirectMessage:
            "MediLink AI does not provide or calculate personalized dosages. Exact dosage depends on individual health parameters, severity of illness, age, body weight, kidney/liver function, and your clinician's specific prescription. Always follow the product label packaging instructions or consult your physician or pharmacist.",
        };
      }
    }

    // 6. Treatment Alteration / Stopping / Switching Inquiries
    const treatmentPatterns = [
      /\b(can\s+i\s+(stop|discontinue|quit|skip)\s+(taking\s+)?(my\s+)?(medicine|medication|tablets?|treatment))\b/i,
      /\b(should\s+i\s+(stop|discontinue|quit|skip)\s+(my\s+)?(medicine|medication|tablets?))\b/i,
      /\b(can\s+i\s+(switch|replace|change)\s+(from\s+)?.*?to\b)/i,
      /\b(switch|replace|change)\s+(from\s+)?(my\s+)?(medicine|medication|prescription|drug)\b/i,
      /\b(replace\s+(my\s+)?(medicine|prescription))\b/i,
    ];
    for (const pattern of treatmentPatterns) {
      if (pattern.test(cleanMsg)) {
        return {
          isBlocked: true,
          category: "TREATMENT_CHANGE",
          redirectMessage:
            "You should never stop, alter, or switch prescription medications without speaking directly to your prescribing doctor. Abruptly stopping or changing medicines can lead to adverse health outcomes. Please contact your physician.",
        };
      }
    }

    // 7. Special Populations (Pregnancy / Breastfeeding / Pediatrics / Elderly)
    const specialPopPatterns = [
      /\b(is\s+it\s+safe\s+(during|in)\s+pregnancy|can\s+i\s+take\s+(this|it)\s+while\s+pregnant|safe\s+for\s+breastfeeding|lactation|can\s+i\s+give\s+(this\s+to\s+)?(my\s+)?(baby|infant|toddler|child|newborn))\b/i,
    ];
    for (const pattern of specialPopPatterns) {
      if (pattern.test(cleanMsg)) {
        return {
          isBlocked: true,
          category: "SPECIAL_POPULATION",
          redirectMessage:
            "Special caution is required when using medicines during pregnancy, breastfeeding, or in infants and children. Always seek direct medical guidance from a qualified gynecologist or pediatrician before taking or administering any medicine in these circumstances.",
        };
      }
    }

    // 8. Drug Interaction Inquiries
    const interactionPatterns = [
      /\b(can\s+i\s+take\s+\w+\s+(with|and|together\s+with)\s+\w+)\b/i,
      /\b(drug\s+interaction\s+between|interact\s+with)\b/i,
    ];
    for (const pattern of interactionPatterns) {
      if (pattern.test(cleanMsg)) {
        return {
          isBlocked: true,
          category: "INTERACTION_UNVERIFIED",
          redirectMessage:
            "MediLink does not currently maintain a comprehensive verified drug-drug interaction database. Because interactions can alter drug efficacy or cause adverse effects, please discuss potential drug combinations with a licensed pharmacist or physician before taking them together.",
        };
      }
    }

    return { isBlocked: false };
  }

  /**
   * Post-inference guardrail validation to catch any potential safety leaks.
   */
  static evaluateOutput(output: string): string {
    let sanitized = output;

    // Check for diagnostic or prescribing patterns that might have slipped through
    const dangerousPhrases = [
      /you\s+have\s+(diabetes|cancer|hypertension|infection)/gi,
      /i\s+prescribe/gi,
      /take\s+\d+\s+tablets\s+daily/gi,
      /you\s+should\s+take\s+\d+\s*mg/gi,
    ];

    for (const regex of dangerousPhrases) {
      if (regex.test(sanitized)) {
        return (
          "Information regarding specific clinical diagnosis or personal dosage is restricted for patient safety. Please review the packaging instructions or consult your doctor or pharmacist.\n\n" +
          STANDARD_MEDICAL_DISCLAIMER
        );
      }
    }

    return sanitized;
  }
}
