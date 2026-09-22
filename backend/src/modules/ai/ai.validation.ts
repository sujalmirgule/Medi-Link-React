import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z
    .string({
      required_error: "Message is required",
      invalid_type_error: "Message must be a string",
    })
    .trim()
    .min(1, "Message cannot be empty")
    .max(1000, "Message cannot exceed 1000 characters"),
  medicineId: z
    .string({
      invalid_type_error: "Medicine ID must be a string",
    })
    .uuid("Invalid medicine ID format")
    .optional(),
});

export type ChatRequestDto = z.infer<typeof chatRequestSchema>;
