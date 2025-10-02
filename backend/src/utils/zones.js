// src/utils/zones.js

/**
 * Zone Map Utility
 * - getZoneForAddress(address) → "EU1" | "EU2" | "AFR1" | "INT"
 * - isRemote({ country, postalCode, city }) → boolean
 *
 * Address shape example:
 * { country: "DE" | "Germany" | "de-DE", postalCode: "10115", city: "Berlin" }
 */

/* ---------------- normalization ---------------- */

function normalizeCountry(input = "") {
  const s = String(input).trim();
  if (!s) return "";
  if (s.length === 2) return s.toUpperCase();

  const key = s.toLowerCase().replace(/\s+/g, "");
  const map = {
    germany: "DE",
    deutschland: "DE",
    france: "FR",
    espana: "ES",
    spain: "ES",
    italia: "IT",
    italy: "IT",
    belgium: "BE",
    belgique: "BE",
    nederland: "NL",
    netherlands: "NL",
    austria: "AT",
    poland: "PL",
    unitedkingdom: "GB",
    uk: "GB",
    ireland: "IE",
    portugal: "PT",
    cameroon: "CM",
    senegal: "SN",
    nigeria: "NG",
    kenya: "KE",
    morocco: "MA",
    southafrica: "ZA",
    usa: "US",
    unitedstates: "US",
    canada: "CA",
  };

  return map[key] || s.toUpperCase(); // fallback: uppercased string
}

/* ---------------- base country → zone ---------------- */

const COUNTRY_TO_ZONE = {
  // Core EU
  DE: "EU1",
  FR: "EU1",
  IT: "EU1",
  NL: "EU1",
  BE: "EU1",
  AT: "EU1",

  // Wider Europe
  PL: "EU2",
  GB: "EU2",
  IE: "EU2",
  PT: "EU2",
  ES: "EU2",

  // Africa (sample)
  CM: "AFR1",
  SN: "AFR1",
  NG: "AFR1",
  KE: "AFR1",
  MA: "AFR1",
  ZA: "AFR1",

  // Rest of world (examples)
  US: "INT",
  CA: "INT",
};

/* ---------------- postal overrides (zone changes) ---------------- */
/** Specific postcode ranges that belong to a different zone than the country default. */
const POSTAL_ZONE_OVERRIDES = {
  FR: [
    // FR overseas departments (sample) → treat as INT
    { test: (pc) => /^97[1-6]\d{2}$/.test(pc), zone: "INT" }, // 971xx–976xx
    { test: (pc) => /^(98[46-8])\d{2}$/.test(pc), zone: "INT" }, // 984xx/986xx/987xx/988xx
  ],
  PT: [
    // Azores/Madeira often special — here mapped to INT (adjust as needed)
    { test: (pc) => /^9\d{3}(-?\d{3})?$/.test(pc), zone: "INT" },
  ],
  ES: [
    // Canary Islands → INT (35xxx/38xxx)
    { test: (pc) => /^(35|38)\d{3}$/.test(pc), zone: "INT" },
  ],
  GB: [
    // Channel Islands / Isle of Man
    { test: (pc) => /^(GY|JE|IM)/i.test(pc), zone: "INT" },
  ],
  // Example DE special cases (kept EU1; uncomment & change if your carrier treats them differently)
  // DE: [{ test: (pc) => /^27498$|^78266$/.test(pc), zone: "EU2" }],
};

/* ---------------- remote area rules (surcharges) ---------------- */
/** Matches that should trigger a remote surcharge but not change zone. */
const REMOTE_RULES = {
  DE: [
    { postal: /^27498$/, label: "Helgoland" },
    { postal: /^78266$/, label: "Büsingen am Hochrhein" },
  ],
  ES: [
    { postal: /^(35|38)\d{3}$/, label: "Islas Canarias" },
    { postal: /^07\d{3}$/, label: "Islas Baleares" },
  ],
  FR: [
    { postal: /^97[1-6]\d{2}$/, label: "DROM" },
    { postal: /^(98[46-8])\d{2}$/, label: "COM/TOM" },
  ],
  GB: [
    { postal: /^(GY|JE|IM)/i, label: "Channel Islands / Isle of Man" },
    // Rough Highlands & Islands sampler — refine for your network
    { postal: /^(HS|IV|KW|ZE|FK|PA|PH)/i, label: "Highlands & Islands" },
  ],
  PT: [{ postal: /^9\d{3}(-?\d{3})?$/, label: "Azores/Madeira" }],
  IT: [{ city: /venice|venezia|capri/i, label: "Lagoon/Island (sample)" }],
};

/* ---------------- public API ---------------- */

export function getZoneForAddress(address = {}) {
  const country = normalizeCountry(address.country);
  const postal = String(address.postalCode || "").trim();

  // 1) postal overrides → zone
  const overrides = POSTAL_ZONE_OVERRIDES[country];
  if (overrides && postal) {
    for (const rule of overrides) {
      try {
        if (rule.test(postal)) return rule.zone;
      } catch {
        // ignore faulty rule
      }
    }
  }

  // 2) default country zone
  return COUNTRY_TO_ZONE[country] || "INT";
}

export function isRemote({ country, postalCode, city } = {}) {
  const cc = normalizeCountry(country);
  const postal = String(postalCode || "").trim();
  const town = String(city || "").trim();

  const rules = REMOTE_RULES[cc];
  if (!rules) return false;

  for (const r of rules) {
    if (r.postal && postal && r.postal.test(postal)) return true;
    if (r.city && town && r.city.test(town)) return true;
  }
  return false;
}

/* ---------------- optional extras (handy) ---------------- */

export function getZoneMeta(address = {}) {
  return {
    zone: getZoneForAddress(address),
    remote: isRemote(address),
  };
}

export const __ZONE_CONFIG__ = {
  COUNTRY_TO_ZONE,
  POSTAL_ZONE_OVERRIDES,
  REMOTE_RULES,
  normalizeCountry,
};
