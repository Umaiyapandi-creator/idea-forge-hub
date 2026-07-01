// Hard allowlist of authorized Founder emails.
// Only these accounts may ever log in as Founder / access the Founder dashboard.
export const FOUNDER_EMAILS: readonly string[] = [
  "esakkimuthu01447@gmail.com",
];

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return FOUNDER_EMAILS.includes(email.trim().toLowerCase());
}
