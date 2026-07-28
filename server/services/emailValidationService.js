/**
 * Email Validation Service
 * Prevents fake email registrations
 */

import dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.resolveMx);

// List of known fake/temporary email services
const FAKE_EMAIL_DOMAINS = [
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "throwaway.email",
  "mailinator.com",
  "yopmail.com",
  "maildrop.cc",
  "temp-mail.org",
  "fakeinbox.com",
  "trashmail.com",
  "spam4.me",
  "getnada.com",
  "temp-mail.io",
  "testmail.com",
  "fakeemail.com"
];

/**
 * Check if email domain is real (has MX records)
 */
export async function isRealEmailDomain(email) {
  try {
    const domain = email.split("@")[1];

    // Check if domain is in fake list
    if (FAKE_EMAIL_DOMAINS.some(fake => domain.toLowerCase().includes(fake))) {
      return {
        isReal: false,
        reason: "This email service is not allowed. Please use a real email."
      };
    }

    // Check if domain has MX records (real mail server)
    const mxRecords = await dnsLookup(domain);

    if (!mxRecords || mxRecords.length === 0) {
      return {
        isReal: false,
        reason: "Email domain does not have valid mail server"
      };
    }

    return { isReal: true, reason: "Valid email domain" };
  } catch (err) {
    console.error("Email validation error");
    return {
      isReal: false,
      reason: "Could not verify email domain"
    };
  }
}

/**
 * Validate email format and domain
 */
export async function validateEmailComplete(email) {
  // Check format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      reason: "Invalid email format"
    };
  }

  // Check if domain is real
  const domainCheck = await isRealEmailDomain(email);

  return {
    valid: domainCheck.isReal,
    reason: domainCheck.reason
  };
}

export default {
  isRealEmailDomain,
  validateEmailComplete
};
