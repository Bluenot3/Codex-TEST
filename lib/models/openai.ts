export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface StreamChatOptions {
  apiKey: string;
  messages: ChatMessage[];
  model?: string;
  signal?: AbortSignal;
}

const DEFAULT_MODEL = "gpt-4o-mini";

export async function streamChatCompletion({
  apiKey,
  messages,
  model = DEFAULT_MODEL,
  signal,
}: StreamChatOptions): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `OpenAI request failed: ${response.status}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffered = "";

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = response.body!.getReader();

      const push = async (): Promise<void> => {
        try {
          const { value, done } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          buffered += decoder.decode(value, { stream: true });
          const lines = buffered.split("\n");
          buffered = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const payload = trimmed.replace(/^data:\s*/, "");
            if (payload === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch (error) {
              controller.enqueue(encoder.encode(""));
            }
          }

          await push();
        } catch (error) {
          controller.error(error);
        }
      };

      push();
    },
  });

  return stream;
}
