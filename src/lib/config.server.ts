// Env-driven business configuration. Read only inside server handlers.

const PLACEHOLDER = "(placeholder)";

export type BusinessConfig = ReturnType<typeof getBusinessConfig>;

export function getBusinessConfig() {
  const env = process.env;
  const mode: "production" | "demo" = env["APP_MODE"] === "production" ? "production" : "demo";
  const val = (k: string, fallback: string) => {
    const v = env[k]?.trim();
    return { value: v || fallback, missing: !v };
  };
  const name = val("BUSINESS_NAME", `PawRoute Mobile Grooming ${PLACEHOLDER}`);
  const phone = val("BUSINESS_PHONE", `204-555-0100 ${PLACEHOLDER}`);
  const privacyEmail = val("PRIVACY_EMAIL", `privacy@example.com ${PLACEHOLDER}`);
  const city = val("BUSINESS_CITY", "Winnipeg, MB");
  const timezone = val("BUSINESS_TIMEZONE", "America/Winnipeg");
  const area = val(
    "SERVICE_AREA_PREFIXES",
    "R2C,R2G,R2H,R2J,R2K,R2L,R2M,R2N,R2V,R2W,R2X,R2Y,R3A,R3B,R3C,R3E,R3G,R3H,R3J,R3K,R3L,R3M,R3N,R3P,R3R,R3T,R3V,R3X,R3Y",
  );
  const ownerName = val("OWNER_FIRST_NAME", "Maya");
  const siteUrl = val("PUBLIC_SITE_URL", "https://route-wise-paws.lovable.app");

  const warnings: string[] = [];
  const required = {
    BUSINESS_NAME: name,
    BUSINESS_PHONE: phone,
    PRIVACY_EMAIL: privacyEmail,
    BUSINESS_CITY: city,
    BUSINESS_TIMEZONE: timezone,
    SERVICE_AREA_PREFIXES: area,
    PUBLIC_SITE_URL: siteUrl,
  };
  for (const [k, v] of Object.entries(required))
    if (v.missing) warnings.push(`${k} is not set — using a placeholder default.`);

  const routeConfigured = Boolean(env["MAPBOX_ACCESS_TOKEN"]);
  const emailConfigured = Boolean(env["RESEND_API_KEY"] && env["FROM_EMAIL"]);
  if (!routeConfigured)
    warnings.push("MAPBOX_ACCESS_TOKEN is not set — live route optimization is unavailable.");
  if (!emailConfigured)
    warnings.push("RESEND_API_KEY / FROM_EMAIL are not set — confirmation emails are not sent.");

  return {
    mode,
    businessName: name.value,
    phone: phone.value,
    privacyEmail: privacyEmail.value,
    city: city.value,
    timezone: timezone.value,
    ownerName: ownerName.value,
    siteUrl: siteUrl.value.replace(/\/$/, ""),
    servicePrefixes: area.value
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    baseAddress: env["BUSINESS_BASE_ADDRESS"]?.trim() || null,
    routeConfigured,
    emailConfigured,
    setupWarnings: warnings,
    setupIncomplete: warnings.length > 0,
    // Business hours (minutes from midnight, local time) and open days (0=Sun).
    openMin: 9 * 60,
    closeMin: 17 * 60 + 30,
    openDays: [1, 2, 3, 4, 5, 6],
    horizonDays: 14,
  };
}

export function publicConfig(c: BusinessConfig) {
  return {
    mode: c.mode,
    businessName: c.businessName,
    phone: c.phone,
    privacyEmail: c.privacyEmail,
    city: c.city,
    timezone: c.timezone,
    ownerName: c.ownerName,
    routeConfigured: c.routeConfigured,
    emailConfigured: c.emailConfigured,
    setupIncomplete: c.setupIncomplete,
    setupWarnings: c.setupWarnings,
  };
}