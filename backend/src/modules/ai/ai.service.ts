import { prisma } from "../../lib/prisma";
import {
  AIChatRequest,
  AIChatResponseData,
  MedicineContext,
} from "./ai.types";
import {
  AIGuardrails,
  MEDILINK_AI_SYSTEM_INSTRUCTION,
  STANDARD_MEDICAL_DISCLAIMER,
} from "./ai.guardrails";
import { AIProviderFactory } from "./ai.provider";

export class AIService {
  /**
   * Process a customer medicine information inquiry.
   */
  static async processChat(
    userId: string,
    request: AIChatRequest
  ): Promise<AIChatResponseData> {
    const { message, medicineId } = request;

    // 1. Fetch medicine context if medicineId is provided
    let medicineContext: MedicineContext | null = null;
    let medicineSummary: AIChatResponseData["medicine"] = null;

    if (medicineId) {
      const medicine = await prisma.medicine.findUnique({
        where: { id: medicineId },
        include: { category: true },
      });

      if (!medicine || !medicine.isActive) {
        const error: any = new Error("Medicine not found in MediLink catalog");
        error.statusCode = 404;
        error.status = 404;
        throw error;
      }

      medicineContext = {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        composition: medicine.composition,
        description: medicine.description,
        manufacturer: medicine.manufacturer,
        category: {
          id: medicine.category.id,
          name: medicine.category.name,
          description: medicine.category.description,
        },
        prescriptionRequired: medicine.prescriptionRequired,
      };

      medicineSummary = {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        composition: medicine.composition,
        category: medicine.category.name,
        prescriptionRequired: medicine.prescriptionRequired,
        manufacturer: medicine.manufacturer,
        description: medicine.description,
      };
    }

    // 2. Pre-inference safety guardrail check
    const guardrailResult = AIGuardrails.evaluateInput(message);
    if (guardrailResult.isBlocked && guardrailResult.redirectMessage) {
      return {
        message: guardrailResult.redirectMessage,
        source: "MediLink Safety & Medical Policy Guardrails",
        disclaimer: STANDARD_MEDICAL_DISCLAIMER,
        medicine: medicineSummary,
        blockedCategory: guardrailResult.category,
        suggestedQuestions: [
          medicineContext ? `What is ${medicineContext.name}?` : "What is Paracetamol?",
          medicineContext ? `What is the generic composition of ${medicineContext.name}?` : "What is generic composition?",
          medicineContext ? `What is ${medicineContext.name} generally used for?` : "What are common medicine categories?",
          "What should I ask my pharmacist?",
        ],
        safetyNotice:
          "For your health and safety, MediLink AI does not provide diagnoses, personal prescriptions, dosage calculations, or emergency advice.",
      };
    }

    // 3. Invoke AI Provider
    const provider = AIProviderFactory.getProvider();
    let providerOutput;
    try {
      providerOutput = await provider.generateResponse({
        userMessage: message,
        medicineContext,
        systemInstruction: MEDILINK_AI_SYSTEM_INSTRUCTION,
      });
    } catch (err: any) {
      // Fallback controlled failure without leaking internal stack traces or secrets
      return {
        message:
          "The MediLink AI Assistant is temporarily unable to generate a response. Please check the medicine details on this page or consult a licensed pharmacist or physician.",
        source: "MediLink Medicine Information System",
        disclaimer: STANDARD_MEDICAL_DISCLAIMER,
        medicine: medicineSummary,
        suggestedQuestions: [
          medicineContext ? `What is ${medicineContext.name}?` : "What is this medicine?",
        ],
      };
    }

    // 4. Post-inference guardrail safety filter
    const sanitizedMessage = AIGuardrails.evaluateOutput(providerOutput.message);

    return {
      message: sanitizedMessage,
      source: providerOutput.source,
      disclaimer: STANDARD_MEDICAL_DISCLAIMER,
      medicine: medicineSummary,
      suggestedQuestions: providerOutput.suggestedQuestions || [
        "What is this medicine generally used for?",
        "What is its generic composition?",
        "What precautions are listed?",
      ],
      blockedCategory: null,
    };
  }
}
