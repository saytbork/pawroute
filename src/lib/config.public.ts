export type PublicConfig = {
  mode: "production" | "demo";
  businessName: string;
  phone: string;
  privacyEmail: string;
  city: string;
  timezone: string;
  ownerName: string;
  routeConfigured: boolean;
  emailConfigured: boolean;
  setupIncomplete: boolean;
  setupWarnings: string[];
};