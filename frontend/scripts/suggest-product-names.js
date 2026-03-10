/**
 * Suggests SaaS-style product names for the Property Management System.
 * Prints names and checks .com domain availability (DNS heuristic: no A record often means available).
 * Run: node frontend/scripts/suggest-product-names.js
 */

const dns = require("dns").promises;

const CANDIDATES = [
  "RentFlow",
  "UnitKey",
  "LeaseLens",
  "PropStack",
  "Rentwise",
  "TenantBase",
  "LandlordHQ",
  "RentalOps",
  "Unitly",
  "Rentify",
  "PropFlow",
  "LeaseBase",
  "RentSync",
  "UnitVault",
  "LandlordLab",
  "Rentlio",
  "Propify",
  "Rentaroo",
  "Leasewise",
  "KeyRent",
  "Unito",
  "Rentkey",
  "Propwise",
  "Tenantly",
  "Rentpad",
  "Unitwise",
  "Leasekey",
  "Propkey",
];

function domainFor(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
}

function checkAvailable(domain) {
  return dns.lookup(domain, { family: 4 }).then(() => false).catch(() => true);
}

async function main() {
  console.log("\n--- Suggested product names (Property Management SaaS) ---\n");
  const results = [];
  for (const name of CANDIDATES) {
    const domain = domainFor(name);
    let available = false;
    try {
      available = await checkAvailable(domain);
    } catch {
      available = false;
    }
    results.push({ name, domain, available });
  }

  const availableOnly = results.filter((r) => r.available);
  if (availableOnly.length < 10) {
    console.log("(DNS heuristic: 'Available' = no A record; verify at namecheap.com or whois)\n");
  }
  for (const r of results) {
    console.log(`Name: ${r.name}`);
    console.log(`Domain: ${r.domain}`);
    console.log(`Available: ${r.available ? "Yes" : "No"}`);
    console.log("");
  }
  console.log("--- Only suggesting names with Available: Yes (verify .com at registrar) ---");
  availableOnly.slice(0, 15).forEach((r) => console.log(`  - ${r.name} (${r.domain})`));
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
