export interface CreateReviewInput {
  orderId: string;
  rating: number;           // 1-5
  comment?: string | null;
  // Exactly one of the following must be set:
  medicineId?: string | null;
  pharmacyId?: string | null;
  deliveryPartnerId?: string | null;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string | null;
}

export interface ReviewFilterParams {
  page?: number;
  limit?: number;
  medicineId?: string;
  pharmacyId?: string;
  deliveryPartnerId?: string;
  customerId?: string;
  isHidden?: boolean;
  minRating?: number;
  maxRating?: number;
}

export interface FormattedReview {
  id: string;
  customerId: string;
  orderId: string | null;
  medicineId: string | null;
  pharmacyId: string | null;
  deliveryPartnerId: string | null;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  medicine?: { id: string; name: string } | null;
  pharmacy?: { id: string; name: string } | null;
  deliveryPartner?: { id: string; userId: string } | null;
}

export interface AggregateRating {
  averageRating: number;
  totalReviews: number;
}

export interface OrderReviewStatus {
  orderId: string;
  medicineReviews: Record<string, boolean>;   // medicineId -> reviewed
  pharmacyReviewed: boolean;
  deliveryReviewed: boolean;
}
