const BASE_URL = process.env.NINEROUTER_BASE_URL || "https://omni.aidonext.com/v1";
const API_KEY = process.env.NINEROUTER_API_KEY || "";
const MODEL = process.env.NINEROUTER_MODEL || "high-availability-copy";

type OmniResponse = {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  cost: number;
  latencyMs: number;
};

export async function extractInvoice(
  text: string,
  schema: string
): Promise<OmniResponse> {
  const prompt = `You are an invoice data extraction engine. Extract structured data from the following invoice text.

For each page, the text is marked with --- PAGE N --- markers.

Return ONLY a valid JSON object matching the schema below. Do NOT include any explanation, markdown fences, or extra text. If a field is not found, use null.

Schema:
${schema}

Invoice text:
${text}`;

  return callOmniRouter(prompt, 0);
}

export async function chatCopilot(
  messages: { role: string; content: string }[],
  context: string
): Promise<ReadableStream> {
  const systemMsg = {
    role: "system",
    content: `You are Invoice Analytics AI Copilot. Answer questions about invoices based ONLY on the provided context.

Rules:
- Answer only from the provided context + structured data.
- If information is not in the context, say "Informasi tidak ditemukan dalam dokumen."
- Cite sources with [Halaman N] or [Invoice X, Halaman N] when possible.
- Separate document facts, calculation results, and interpretation clearly.
- Do not give legal/tax opinions as certainty. Label them "perlu verifikasi profesional."
- Respond in Bahasa Indonesia.
- Be concise and direct.

Context:
${context}`,
  };

  const body = {
    model: MODEL,
    messages: [systemMsg, ...messages],
    temperature: 0.3,
    stream: true,
  };

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Omni Router error: ${response.status} ${response.statusText}`);
  }

  // Transform Omni Router SSE (OpenAI delta format) into simple {content} SSE
  const upstream = response.body!;
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const transform = new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        } catch {
          // ignore non-JSON lines (Omni Router comment lines start with ':')
        }
      }
    },
  });

  return upstream.pipeThrough(transform);
}

async function callOmniRouter(
  prompt: string,
  temperature: number
): Promise<OmniResponse> {
  const startTime = Date.now();
  const body = {
    model: MODEL,
    messages: [{ role: "user" as const, content: prompt }],
    temperature,
    stream: false,
  };

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Omni Router error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;
  const content = data.choices?.[0]?.message?.content || "";
  const model = data.model || MODEL;
  const usage = data.usage || {};
  const cost = parseFloat(response.headers.get("x-omniroute-response-cost") || "0");

  return {
    content,
    model,
    usage: {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    },
    cost,
    latencyMs,
  };
}
