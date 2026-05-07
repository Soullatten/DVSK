import type { Request, Response } from "express";
import OpenAI from "openai";
import { prisma } from "../../config/database.js";
import { env } from "../../env.js";
import { success, badRequest, error as apiError } from "../../utils/apiResponse.js";
import { NAVYA_TOOLS, executeNavyaTool } from "./navya.tools.js";

const groq = new OpenAI({
  apiKey: env.GROQ_API_KEY || "missing_key",
  baseURL: "https://api.groq.com/openai/v1",
});

// llama-3.1-8b-instant: free tier gives ~500k TPD (vs 100k for 70b) and is much faster.
// Override via NAVYA_MODEL env var if you want to swap to llama-3.3-70b-versatile etc.
const MODEL_TEXT = process.env.NAVYA_MODEL || "llama-3.1-8b-instant";
const MODEL_VISION = process.env.NAVYA_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

// Cap chat history sent to the model so old turns don't burn the daily quota
const MAX_HISTORY_TURNS = 16;

interface IncomingAttachment {
  kind: "image" | "text" | "csv";
  name?: string;
  mimeType?: string;
  dataUrl?: string;
  text?: string;
}

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: IncomingAttachment[];
}

function buildSystemPrompt(stats: {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  outOfStockProducts: number;
  pageContext?: any;
  pastMemory?: string;
}) {
  const ctx = stats.pageContext ? `\nPage context: ${JSON.stringify(stats.pageContext)}` : "";
  const memory = stats.pastMemory ? `\nMemory: ${stats.pastMemory}` : "";
  return `You are Navya, AI ops partner for DVSK CLO — modern Indian streetwear label, INR pricing, Maharashtra origin (18% GST: same-state CGST+SGST, inter-state IGST, intl 0%). Audience: 16-30 yr-olds, indie/D2C, ₹500-15k price points. You speak directly to Krishiv (founder).

LIVE: ${stats.totalOrders} orders · ${stats.pendingOrders} pending · ₹${Math.round(stats.totalRevenue).toLocaleString("en-IN")} revenue · ${stats.totalProducts} active products · ${stats.outOfStockProducts} out-of-stock${ctx}${memory}

Tools: get_revenue_summary, list_recent_orders, list_top_products, list_low_stock, find_product_by_name, list_customers, list_active_visitors (READ); update_product_price, set_variant_stock, update_order_status, send_order_email, create_discount_coupon, create_campaign, create_gift_card, create_market, create_catalog, create_company, create_purchase_order, create_product, create_automation, delete_resource (WRITE). Always use tools for live numbers — never guess. Confirm before writes ("I'll do X, ok?"), then call. For send_order_email, pick templateKey by intent: order-confirmation (receipt), order-tracking (shipping), new-drop (marketing). Always confirm subject + recipient before sending.

Style: 1-3 short sentences default, bullets only for 3+ items. ₹ for money with thousands separators. No emojis unless Krishiv uses them. Direct, warm, dry. Never fabricate — if you can't find it, say so.`;
}

function flattenContent(msg: IncomingMessage): any {
  // Vision-capable messages need OpenAI-style content arrays.
  // For text-only messages, return a plain string.
  const hasImage = msg.attachments?.some((a) => a.kind === "image" && a.dataUrl);
  const hasFileText = msg.attachments?.some((a) => a.kind !== "image" && a.text);

  if (!hasImage && !hasFileText) return msg.content;

  const parts: any[] = [];
  let textBody = msg.content || "";

  if (hasFileText) {
    const filePieces = msg.attachments!
      .filter((a) => a.kind !== "image" && a.text)
      .map((a) => `\n\n--- Attached file: ${a.name || "untitled"} (${a.kind}) ---\n${a.text}`)
      .join("");
    textBody = `${textBody}${filePieces}`;
  }

  if (textBody) parts.push({ type: "text", text: textBody });

  for (const att of msg.attachments || []) {
    if (att.kind === "image" && att.dataUrl) {
      parts.push({ type: "image_url", image_url: { url: att.dataUrl } });
    }
  }

  return parts;
}

function hasAnyImage(messages: IncomingMessage[]): boolean {
  return messages.some((m) => m.attachments?.some((a) => a.kind === "image" && a.dataUrl));
}

export async function navyaChat(req: Request, res: Response) {
  try {
    const { messages, pastMemory, pageContext } = req.body as {
      messages: IncomingMessage[];
      pastMemory?: string;
      pageContext?: any;
    };

    if (!messages || !Array.isArray(messages)) {
      return badRequest(res, "Invalid request: 'messages' must be an array.");
    }

    let totalOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;
    let totalProducts = 0;
    let outOfStockProducts = 0;

    try {
      totalOrders = await prisma.order.count({ where: { status: { not: "CANCELLED" } } });
      pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });
      const revenueResult = await prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
      });
      totalRevenue = revenueResult._sum.total ? Number(revenueResult._sum.total) : 0;
      totalProducts = await prisma.product.count({ where: { isActive: true } });
      outOfStockProducts = await prisma.product.count({
        where: { isActive: true, variants: { every: { stock: 0 } } },
      });
    } catch (dbError) {
      console.error("Database connection issue in chat route:", dbError);
    }

    const systemPrompt = buildSystemPrompt({
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalProducts,
      outOfStockProducts,
      pageContext,
      pastMemory,
    });

    const useVision = hasAnyImage(messages);
    const model = useVision ? MODEL_VISION : MODEL_TEXT;

    // Trim history to recent turns (saves daily token budget significantly)
    const trimmed = messages.slice(-MAX_HISTORY_TURNS);

    const llmMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...trimmed.map((m) => ({
        role: m.role,
        content: flattenContent(m),
      })),
    ];

    // ─── Tool-execution loop with graceful fallback ───────────────────────────
    const MAX_ITERATIONS = 5;
    let iterations = 0;
    let finalReply = "";
    const toolEvents: Array<{ name: string; args: any; result: any }> = [];

    const callModel = async (withTools: boolean) =>
      groq.chat.completions.create({
        model,
        messages: llmMessages,
        ...(withTools && {
          tools: NAVYA_TOOLS as any,
          tool_choice: "auto" as const,
          parallel_tool_calls: false,
        }),
        temperature: 0.3,
      });

    while (iterations < MAX_ITERATIONS) {
      iterations += 1;
      let completion;
      try {
        completion = await callModel(true);
      } catch (err: any) {
        // Groq sometimes 400s when the model returns malformed tool JSON.
        // Fallback: re-run WITHOUT tools so we at least get a text response
        // grounded in whatever tool results we already have in the transcript.
        const isToolError =
          err?.status === 400 &&
          (err?.message?.includes("tool") ||
            err?.message?.includes("function") ||
            err?.message?.includes("failed_generation"));
        if (isToolError) {
          console.warn("[Navya] tool-call generation failed, falling back to text-only:", err?.message);
          try {
            completion = await callModel(false);
          } catch (err2: any) {
            console.error("[Navya] fallback also failed:", err2?.message);
            throw err2;
          }
        } else {
          throw err;
        }
      }

      const choice = completion.choices[0]?.message;
      if (!choice) break;

      llmMessages.push(choice as any);

      const toolCalls = (choice as any).tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        finalReply = choice.content || "";
        break;
      }

      for (const tc of toolCalls) {
        const name = tc.function?.name;
        let args: any = {};
        try {
          args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch {
          args = {};
        }
        let result: any;
        try {
          result = await executeNavyaTool(name, args);
        } catch (err: any) {
          result = { error: err?.message || "Tool execution failed" };
        }
        toolEvents.push({ name, args, result });
        llmMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        } as any);
      }
    }

    if (!finalReply) {
      // If we ran tools but never got a text reply, summarize what we found
      if (toolEvents.length > 0) {
        const summary = toolEvents
          .map((e) => `${e.name}: ${JSON.stringify(e.result).slice(0, 200)}`)
          .join("\n");
        finalReply = `Here's what I found:\n${summary}`;
      } else {
        finalReply = "Sorry, I couldn't put a clean answer together this turn — try rephrasing?";
      }
    }

    return success(res, { reply: finalReply, toolEvents });
  } catch (error: any) {
    console.error("Navya chat error:", error?.message || error);
    if (error?.message?.includes("missing_key") || error?.status === 401) {
      return apiError(res, 500, "MISSING_KEY", "Server is missing or has an invalid GROQ_API_KEY in .env");
    }
    // Friendly handling for daily token quota
    if (error?.status === 429) {
      const raw = error?.message || "";
      const match = raw.match(/try again in ([\d.]+)([sm])/i);
      const wait = match ? `Try again in ${match[1]}${match[2]}.` : "Try again in a few minutes.";
      return apiError(
        res,
        429,
        "RATE_LIMIT",
        `Daily AI quota hit on Groq's free tier. ${wait} You can switch to a smaller model by setting NAVYA_MODEL in backend .env or upgrade at https://console.groq.com/settings/billing.`
      );
    }
    return apiError(res, 500, "AI_REQUEST_FAILED", error?.message || "AI request failed");
  }
}
