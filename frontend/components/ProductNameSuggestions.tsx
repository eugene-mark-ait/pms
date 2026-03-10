"use client";

import { useEffect } from "react";

const SUGGESTED_NAMES = [
  { name: "RentFlow", domain: "rentflow.com" },
  { name: "UnitKey", domain: "unitkey.com" },
  { name: "LeaseLens", domain: "leaselens.com" },
  { name: "PropStack", domain: "propstack.com" },
  { name: "Rentwise", domain: "rentwise.com" },
  { name: "TenantBase", domain: "tenantbase.com" },
  { name: "LandlordHQ", domain: "landlordhq.com" },
  { name: "RentalOps", domain: "rentalops.com" },
  { name: "Unitly", domain: "unitly.com" },
  { name: "Rentify", domain: "rentify.com" },
  { name: "PropFlow", domain: "propflow.com" },
  { name: "LeaseBase", domain: "leasebase.com" },
  { name: "RentSync", domain: "rentsync.com" },
  { name: "UnitVault", domain: "unitvault.com" },
  { name: "LandlordLab", domain: "landlordlab.com" },
];

export default function ProductNameSuggestions() {
  useEffect(() => {
    console.log("\n--- Suggested product names (Property Management SaaS) ---");
    console.log("Verify .com availability at namecheap.com or whois\n");
    SUGGESTED_NAMES.forEach(({ name, domain }) => {
      console.log(`Name: ${name}\nDomain: ${domain}\nAvailable: (verify at registrar)\n`);
    });
    console.log("--- End of suggestions ---\n");
  }, []);
  return null;
}
