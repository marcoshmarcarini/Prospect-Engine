export interface RawPlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  types?: string[];
  lat?: number;
  lng?: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  cleanPhone: string;
  rating: number;
  userRatingsTotal: number;
  address: string;
  website: string | null;
  hasWebsite: boolean;
  whatsappPitch: string;
  whatsappUrl: string;
  generatedAt?: string;
  lat?: number;
  lng?: number;
}

export interface ProspectOptions {
  searchTerm?: string;
  maxResults?: number;
  sendEmail?: boolean;
  recipientEmail?: string;
}

export interface ProspectResult {
  success: boolean;
  searchTerm: string;
  totalFound: number;
  totalWithoutWebsite: number;
  leads: Lead[];
  emailSent: boolean;
  emailId?: string;
  emailError?: string;
  executionTimeMs: number;
  timestamp: string;
  warning?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  emailId?: string;
  error?: string;
}
