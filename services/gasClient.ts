import fetch from "node-fetch";
import "dotenv/config";

const GAS_URL = process.env.GAS_URL!;

export async function callGAS(
  action: "save" | "get" | "delete" | "list",
  userId: string,
  key: string,
  content = ""
): Promise<string> {
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({ action, userId, key, content }),
      headers: { "Content-Type": "application/json" }
    });

    // 型情報が無いため any にキャストして result を参照
    const data: any = await res.json();
    return data?.result ? String(data.result) : "Error: No result";
  } catch (err) {
    console.error("callGAS error:", err);
    return "Error: call failed";
  }
}