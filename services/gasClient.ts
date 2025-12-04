import fetch from "node-fetch";
import "dotenv/config";

const GAS_URL = process.env.GAS_URL!;

export async function callGAS(
  action: "save" | "get" | "delete" | "list",
  userId: string,
  key: string,
  content = ""
): Promise<string> {
  const res = await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({ action, userId, key, content }),
    headers: { "Content-Type": "application/json" }
  });

  const data = await res.json();
  return data.result || "Error: No result";
}
