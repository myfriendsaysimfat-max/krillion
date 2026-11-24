// KRILLION answer judge — Google Gemini API via Netlify Functions.
// Keep GEMINI_API_KEY in Netlify environment variables; never expose it in browser code.

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return reply(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return reply(503, { error: "Gemini is not configured. Add GEMINI_API_KEY in Netlify environment variables." });
  }

  let input;
  try {
    input = JSON.parse(event.body || "{}");
  } catch {
    return reply(400, { error: "Request body must be valid JSON." });
  }

  const question = String(input.question || "").trim().slice(0, 500);
  const answer = String(input.answer || "").trim().slice(0, 200);
  const examples = Array.isArray(input.examples)
    ? input.examples.map((v) => String(v).slice(0, 100)).slice(0, 18)
    : [];

  if (!question || !answer) {
    return reply(400, { error: "Both question and answer are required." });
  }

  const instructions = `You are the answer judge for KRILLION, a fast category trivia game.
Decide whether the player's answer is a genuine, specific, factually valid answer to the category prompt.

Rules:
- Judge meaning, not exact wording. Accept alternate names, common names, translations, spelling variants, and valid specific examples.
- A specific answer can be valid even if it is absent from the examples list or Wikipedia-derived database.
- Do not accept a broad category word when the prompt asks for an individual example. For example, for "Name a mountain range", "Andes Mountains" is valid but "mountain" is not.
- Do not accept vague, made-up, unrelated, or merely associated terms.
- The examples are hints only, not a complete whitelist.
- canonicalAnswer should be a concise, recognizable canonical form of the player's answer.
- rarityPercent is an estimated rarity score from 1 to 99: higher means a less obvious / more specific / less commonly given valid answer. This is a gameplay estimate, NOT measured population statistics. Avoid assigning extreme scores without reason.
- confidence is 0 to 1. Be conservative when unsure.
- Return ONLY a JSON object with exactly these keys: accepted (boolean), canonicalAnswer (string), rarityPercent (integer 1-99), confidence (number 0-1), reason (short string).
`;

  const userPayload = { categoryPrompt: question, playerAnswer: answer, knownValidExamples: examples };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(userPayload) }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              accepted: { type: "BOOLEAN" },
              canonicalAnswer: { type: "STRING" },
              rarityPercent: { type: "INTEGER" },
              confidence: { type: "NUMBER" },
              reason: { type: "STRING" }
            },
            required: ["accepted", "canonicalAnswer", "rarityPercent", "confidence", "reason"]
          }
        }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `Gemini API returned HTTP ${response.status}`;
      console.error("Gemini API error:", response.status, message);
      return reply(response.status >= 500 ? 502 : response.status, { error: "Gemini could not judge this answer. Check the Gemini API key, model access, or quota." });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    if (!rawText) {
      return reply(502, { error: "Gemini returned an empty answer." });
    }

    const result = JSON.parse(rawText);
    const rarity = Number(result.rarityPercent);
    const confidence = Number(result.confidence);
    if (typeof result.accepted !== "boolean" || !Number.isFinite(rarity) || !Number.isFinite(confidence)) {
      return reply(502, { error: "Gemini returned an invalid judgment." });
    }

    return reply(200, {
      accepted: result.accepted,
      canonicalAnswer: String(result.canonicalAnswer || answer).trim().slice(0, 200),
      rarityPercent: Math.max(1, Math.min(99, Math.round(rarity))),
      confidence: Math.max(0, Math.min(1, confidence)),
      reason: String(result.reason || "").trim().slice(0, 240)
    });
  } catch (error) {
    console.error("KRILLION judge failure:", error?.message || error);
    return reply(502, { error: "The AI judge failed to respond. Please try again." });
  }
};

function reply(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}
