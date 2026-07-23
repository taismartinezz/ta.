import { randomBytes } from "crypto";

// Higher entropy than the trip slug — this grants edit access to one
// person's private submission, not just visibility into a shared trip.
export function generateEditToken(): string {
  return randomBytes(16).toString("hex");
}
