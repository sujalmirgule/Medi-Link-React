export interface AIChatRequest {
  message: string;
  medicineId?: string;
}

export interface MedicineContext {
  id: string;
  name: string;
  genericName: string;
  composition: string;
  description: string | null;
  manufacturer: string;
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  prescriptionRequired: boolean;
}

export interface AIChatResponseData {
  message: string;
  source: string;
  disclaimer: string;
  medicine?: {
    id: string;
    name: string;
    genericName: string;
    composition: string;
    category: string;
    prescriptionRequired: boolean;
    manufacturer?: string;
    description?: string | null;
  } | null;
  suggestedQuestions?: string[];
  safetyNotice?: string;
  blockedCategory?: string | null;
}

export interface GuardrailCheckResult {
  isBlocked: boolean;
  category?: "EMERGENCY" | "DIAGNOSIS" | "PRESCRIPTION" | "DOSAGE" | "TREATMENT_CHANGE" | "SPECIAL_POPULATION" | "PROMPT_INJECTION" | "INTERACTION_UNVERIFIED";
  redirectMessage?: string;
}

export interface IAIProvider {
  name: string;
  generateResponse(params: {
    userMessage: string;
    medicineContext?: MedicineContext | null;
    systemInstruction: string;
  }): Promise<{
    message: string;
    source: string;
    suggestedQuestions?: string[];
  }>;
}
