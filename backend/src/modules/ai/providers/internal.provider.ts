import { IAIProvider, MedicineContext } from "../ai.types";

export class InternalProvider implements IAIProvider {
  public readonly name = "internal";

  async generateResponse(params: {
    userMessage: string;
    medicineContext?: MedicineContext | null;
    systemInstruction: string;
  }): Promise<{
    message: string;
    source: string;
    suggestedQuestions?: string[];
  }> {
    const { userMessage, medicineContext } = params;
    const msg = userMessage.toLowerCase().trim();

    if (!medicineContext) {
      return {
        message:
          "Welcome to the MediLink Medicine Information Assistant. I can provide verified educational information about medicines in our catalog, including generic composition, category classification, and general usage details. Please select or specify a medicine to get started.",
        source: "MediLink Medicine Information System",
        suggestedQuestions: [
          "What is Paracetamol?",
          "What is Amoxicillin?",
          "How do I check if a medicine requires a prescription?",
        ],
      };
    }

    const {
      name,
      genericName,
      composition,
      manufacturer,
      category,
      prescriptionRequired,
      description,
    } = medicineContext;

    const source = `MediLink Verified Catalog (${name})`;
    const defaultSuggestions = [
      `What is ${name}?`,
      `What is the generic composition of ${name}?`,
      `What is ${name} generally used for?`,
      `What are the general precautions for ${name}?`,
      `What should I discuss with a pharmacist about ${name}?`,
    ];

    // Intent 1: Generic composition / Ingredients
    if (
      msg.includes("composition") ||
      msg.includes("generic") ||
      msg.includes("ingredient") ||
      msg.includes("what is in") ||
      msg.includes("active salt")
    ) {
      return {
        message:
          `### Generic & Composition Information for ${name}\n\n` +
          `• **Generic Name:** ${genericName}\n` +
          `• **Active Composition:** ${composition}\n` +
          `• **Manufacturer:** ${manufacturer}\n` +
          `• **Therapeutic Category:** ${category.name}\n\n` +
          `*Note: The active therapeutic substance responsible for the clinical effect is ${genericName}. Always verify packaging details for specific formulation excipients.*`,
        source,
        suggestedQuestions: defaultSuggestions,
      };
    }

    // Intent 2: Uses / What is it used for / Indications
    if (
      msg.includes("used for") ||
      msg.includes("uses") ||
      msg.includes("indication") ||
      msg.includes("purpose") ||
      msg.includes("why is it taken") ||
      msg.includes("benefit")
    ) {
      let usesText = "";
      if (description && description.trim().length > 0) {
        usesText = `**Documented Details:**\n${description}\n\n`;
      } else {
        usesText = `**Category Indications:**\n${name} is cataloged under **${category.name}**${
          category.description ? ` (${category.description})` : ""
        }.\n\n`;
      }

      return {
        message:
          `### Documented Uses for ${name}\n\n` +
          usesText +
          `• **Category:** ${category.name}\n` +
          `• **Prescription Status:** ${
            prescriptionRequired
              ? "Prescription Required (Schedule Rx medication)"
              : "Over-the-Counter (OTC) / Non-prescription in verified pharmacies"
          }\n\n` +
          `*Always follow specific clinical directions given by your healthcare practitioner.*`,
        source,
        suggestedQuestions: defaultSuggestions,
      };
    }

    // Intent 3: Precautions / General Safety / Warnings
    if (
      msg.includes("precaution") ||
      msg.includes("warning") ||
      msg.includes("caution") ||
      msg.includes("safety") ||
      msg.includes("safe")
    ) {
      return {
        message:
          `### General Precautions for ${name}\n\n` +
          `• **Label Adherence:** Always read the product information leaflet and packaging instructions before use.\n` +
          `• **Known Allergies:** Do not consume this medicine if you have known hypersensitivity to ${genericName} or other components in ${composition}.\n` +
          `• **Special Conditions:** Patients with pre-existing liver, kidney, cardiovascular conditions, or those who are pregnant or nursing should consult a doctor before use.\n` +
          `• **Prescription Requirement:** ${
            prescriptionRequired
              ? "This is a prescription medication. It should only be taken as directed on a valid doctor's prescription."
              : "Follow package guidelines carefully and do not exceed the recommended duration without clinical advice."
          }\n` +
          `• **Storage:** Store in a cool, dry place away from direct sunlight and out of reach of children.`,
        source,
        suggestedQuestions: defaultSuggestions,
      };
    }

    // Intent 4: Side effects / Adverse effects
    if (
      msg.includes("side effect") ||
      msg.includes("adverse") ||
      msg.includes("reaction") ||
      msg.includes("harm")
    ) {
      return {
        message:
          `### Documented Information on Side Effects for ${name}\n\n` +
          `Like all medicines, ${name} (containing ${genericName}) may cause mild side effects in some individuals depending on sensitivity. Commonly documented effects for this category may include mild gastrointestinal discomfort, drowsiness, or allergic reactions.\n\n` +
          `• **Important:** If you experience severe reactions such as facial swelling, rash, breathing difficulty, or persistent nausea, seek immediate medical attention.\n` +
          `• **Verified Catalog Note:** MediLink does not replace individual product package inserts. Please consult the product box leaflet or speak with your pharmacist for a comprehensive side-effect profile.`,
        source,
        suggestedQuestions: defaultSuggestions,
      };
    }

    // Intent 5: Category / Classification
    if (
      msg.includes("category") ||
      msg.includes("type") ||
      msg.includes("classification") ||
      msg.includes("class")
    ) {
      return {
        message:
          `### Category & Classification for ${name}\n\n` +
          `• **Medicine Name:** ${name}\n` +
          `• **Category:** ${category.name}\n` +
          `• **Category Scope:** ${category.description || "General therapeutic category"}\n` +
          `• **Generic Salt:** ${genericName}\n` +
          `• **Prescription Required:** ${prescriptionRequired ? "Yes (Rx)" : "No (OTC)"}`,
        source,
        suggestedQuestions: defaultSuggestions,
      };
    }

    // Intent 6: Pharmacist consultation / Discussion points
    if (
      msg.includes("pharmacist") ||
      msg.includes("doctor") ||
      msg.includes("discuss") ||
      msg.includes("consult") ||
      msg.includes("ask")
    ) {
      return {
        message:
          `### Key Discussion Points for Your Pharmacist or Doctor (${name})\n\n` +
          `1. **Current Medications:** Inform your pharmacist of all prescription drugs, vitamins, or herbal supplements you are taking.\n` +
          `2. **Allergy History:** Mention any past allergic reactions to ${genericName} or related medications.\n` +
          `3. **Medical Conditions:** Disclose any chronic health conditions (such as asthma, kidney/liver disease, or high blood pressure).\n` +
          `4. **Proper Timing:** Ask whether this medicine should be taken with or after food.\n` +
          `5. **Prescription Status:** ${
            prescriptionRequired
              ? "Ensure you provide a valid prescription from a registered medical practitioner."
              : "Confirm the appropriate product duration for your specific symptom relief."
          }`,
        source,
        suggestedQuestions: defaultSuggestions,
      };
    }

    // Default: General Overview of the medicine
    return {
      message:
        `### About ${name}\n\n` +
        `**${name}** is a medicine manufactured by **${manufacturer}**, cataloged under the category **${category.name}**.\n\n` +
        `• **Generic Name:** ${genericName}\n` +
        `• **Composition:** ${composition}\n` +
        `• **Prescription Required:** ${prescriptionRequired ? "Yes (Rx)" : "No (OTC)"}\n` +
        (description ? `• **Description:** ${description}\n\n` : `\n`) +
        `You can ask specific questions about its generic composition, common documented uses, general precautions, or category details.`,
      source,
      suggestedQuestions: defaultSuggestions,
    };
  }
}
