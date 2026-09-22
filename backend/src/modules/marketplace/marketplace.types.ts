export interface MedicineSearchParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  availability?: string;
  sortBy?: string;
}

export interface PharmacySearchParams {
  page: number;
  limit: number;
  search?: string;
  city?: string;
}

export interface CustomerAddressInput {
  label?: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}
