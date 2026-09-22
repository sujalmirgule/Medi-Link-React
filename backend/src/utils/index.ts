// Utility helper functions for MediLink backend
export const formatResponse = <T>(success: boolean, data?: T, message?: string) => ({
  success,
  ...(message && { message }),
  ...(data !== undefined && { data }),
});
