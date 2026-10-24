import { NextRequest, NextResponse } from "next/server";

interface PlaygroundRequest {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  apiKey?: string;
  temperature?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaygroundRequest = await request.json();
    const { systemPrompt, userMessage, model = "gemini-2.5-flash", apiKey, temperature = 0.5 } = body;

    if (!systemPrompt && !userMessage) {
      return NextResponse.json({ error: "System prompt or user message is required" }, { status: 400 });
    }

    const effectiveGeminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const effectiveOpenAIKey = apiKey || process.env.OPENAI_API_KEY;
    const effectiveDeepSeekKey = apiKey || process.env.DEEPSEEK_API_KEY;

    // 1. Google Gemini
    if (model.startsWith("gemini") && effectiveGeminiKey) {
      try {
        const modelsToTry = [model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
        const uniqueModels = [...new Set(modelsToTry)];

        const contents: any[] = [];
        if (userMessage) {
          contents.push({
            role: "user",
            parts: [{ text: userMessage }]
          });
        } else {
          contents.push({
            role: "user",
            parts: [{ text: "Hello! Please follow the instructions." }]
          });
        }

        const payload: any = {
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: 2048,
          }
        };

        if (systemPrompt) {
          payload.systemInstruction = {
            parts: [{ text: systemPrompt }]
          };
        }

        for (const m of uniqueModels) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${effectiveGeminiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không nhận được phản hồi từ mô hình.";
            return NextResponse.json({
              reply,
              model: m,
              mode: "live"
            });
          }
        }
      } catch (err) {
        console.error("Gemini API error:", err);
      }
    }

    // 2. OpenAI GPT
    if ((model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) && effectiveOpenAIKey) {
      try {
        const messages: any[] = [];
        if (systemPrompt) {
          messages.push({ role: "system", content: systemPrompt });
        }
        messages.push({ role: "user", content: userMessage || "Hello! Please follow instructions." });

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveOpenAIKey}`
          },
          body: JSON.stringify({
            model: model.includes("gpt-4o") ? "gpt-4o-mini" : "gpt-3.5-turbo",
            messages,
            temperature
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content || "";
          return NextResponse.json({
            reply,
            model,
            mode: "live"
          });
        }
      } catch (err) {
        console.error("OpenAI API error:", err);
      }
    }

    // 3. DeepSeek
    if (model.startsWith("deepseek") && effectiveDeepSeekKey) {
      try {
        const messages: any[] = [];
        if (systemPrompt) {
          messages.push({ role: "system", content: systemPrompt });
        }
        messages.push({ role: "user", content: userMessage || "Hello! Please follow instructions." });

        const res = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveDeepSeekKey}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages,
            temperature
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content || "";
          return NextResponse.json({
            reply,
            model,
            mode: "live"
          });
        }
      } catch (err) {
        console.error("DeepSeek API error:", err);
      }
    }

    // 4. Intelligent Simulation Response (Khi chưa có API key hoặc ở Simulation Mode)
    const simulatedReply = generateSimulationResponse(systemPrompt, userMessage);
    return NextResponse.json({
      reply: simulatedReply,
      model: `${model} (Mô phỏng)`,
      mode: "simulation"
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

function generateSimulationResponse(systemPrompt: string, userMessage: string): string {
  const promptLower = (systemPrompt + " " + userMessage).toLowerCase();

  if (promptLower.includes("math") || promptLower.includes("toán")) {
    return `### 📐 Phản hồi từ Gia sư Toán học:\n\nChào bạn! Để giải quyết bài toán này, chúng ta sẽ thực hiện theo từng bước rõ ràng:\n\n1. **Xác định giả thiết & mục tiêu:** Nắm rõ các đại lượng đã cho và đại lượng cần tìm.\n2. **Công thức áp dụng:** Sử dụng định lý hoặc công thức liên quan.\n3. **Thực hiện tính toán từng bước:** Trình bày chi tiết để không bỏ sót điều kiện xác định.\n\n> 💡 *Gợi ý gợi mở:* Bạn đã thử áp dụng phương pháp biến đổi tương đương hoặc đặt ẩn phụ chưa?`;
  }

  if (promptLower.includes("english") || promptLower.includes("tiếng anh") || promptLower.includes("translator")) {
    return `### 🌍 AI English Language Partner:\n\n**Here is the natural and refined response:**\n\n> *"Thank you for your input! I've analyzed your text and formatted it to sound more natural and grammatically accurate."*\n\n**Key Vocabulary & Feedback:**\n- **Clarity:** Ensure subject-verb agreement.\n- **Tone:** Professional and engaging.\n\nFeel free to send more sentences or ask for alternative phrasing!`;
  }

  if (promptLower.includes("code") || promptLower.includes("python") || promptLower.includes("javascript") || promptLower.includes("lập trình")) {
    return `\`\`\`python
# Example generated based on your instructions
def execute_task(input_data: str) -> dict:
    """
    Processes the user input following the prompt persona.
    """
    result = {
        "status": "success",
        "processed_input": input_data,
        "advice": "Code optimized for performance and maintainability."
    }
    return result

# Execution
if __name__ == "__main__":
    print(execute_task("${userMessage || "demo_data"}"))
\`\`\`
*Mã nguồn đã được tối ưu hóa theo quy chuẩn clean code và xử lý ngoại lệ an toàn.*`;
  }

  return `### ✨ Phản hồi mô phỏng theo vai trò Prompt:\n\nTôi đã tiếp nhận chỉ thị từ prompt và tin nhắn của bạn:\n\n**Nội dung tiếp nhận:**\n- **Chỉ thị:** "${systemPrompt.slice(0, 100)}${systemPrompt.length > 100 ? '...' : ''}"\n- **Đầu vào thử nghiệm:** "${userMessage || '(Không có tin nhắn bổ sung)'}"\n\n**Kết quả thực thi:**\n> Tôi đã kích hoạt đúng vai trò được định nghĩa trong prompt và sẵn sàng tương tác chuyên sâu. Để kết nối với mô hình LLM trực tiếp trong thời gian thực, bạn có thể nhập API Key cá nhân trong mục Cài đặt mô hình!`;
}
