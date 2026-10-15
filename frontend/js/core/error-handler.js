import { toast } from "./ui.js";

export function handleError(error, context = "Request") {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${context} failed:`, error);
  toast(`${context} failed: ${message}`, "error");
}
