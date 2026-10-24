"""
Multi-Persona Telegram Chatbot (powered by prompts.chat dataset & Gemini/OpenAI API)

Cài đặt thư viện:
    pip install python-telegram-bot google-generativeai pandas

Chạy bot:
    python telegram_bot.py
"""

import os
import pandas as pd
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters

# 1. Cấu hình Tokens
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")

# 2. Đọc dữ liệu từ prompts.csv
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts.csv")
try:
    df = pd.read_csv(CSV_PATH)
    print(f"✅ Đã nạp thành công {len(df)} vai trò từ prompts.csv")
except Exception as e:
    print(f"⚠️ Không đọc được prompts.csv ({e}), sử dụng bộ vai trò mặc định.")
    df = pd.DataFrame([
        {"act": "Socratic Tutor", "prompt": "I want you to act as a Socratic tutor. Ask guiding questions instead of direct answers."},
        {"act": "Math Teacher", "prompt": "I want you to act as a math teacher. Explain steps clearly."},
        {"act": "Spoken English Teacher", "prompt": "I want you to act as a spoken English teacher. Correct grammar mistakes and ask questions."},
        {"act": "Python Developer", "prompt": "I want you to act as a Senior Python Developer. Provide clean, idiomatic code."},
    ])

# Lưu trạng thái vai trò của từng người dùng {user_id: {"act": "...", "prompt": "..."}}
user_personas = {}

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_personas[user_id] = {
        "act": "Socratic Tutor",
        "prompt": "I want you to act as a Socratic tutor. Ask guiding questions to lead the user to discover the answer."
    }
    
    welcome_text = (
        "🤖 **Chào mừng bạn đến với Multi-Persona AI Chatbot!**\n\n"
        "Tôi có thể biến hình thành hàng ngàn chuyên gia khác nhau để hỗ trợ bạn.\n\n"
        "📌 **Các lệnh nhanh:**\n"
        "• `/roles` : Xem và chọn vai trò phổ biến\n"
        "• `/act <tên>` : Đổi vai trò (VD: `/act Math Teacher`)\n"
        "• `/current` : Xem vai trò hiện tại\n"
        "• `/help` : Hướng dẫn sử dụng\n\n"
        "✨ *Vai trò hiện tại của bạn:* **Socratic Tutor** (Dạy học gợi mở)"
    )
    await update.message.reply_text(welcome_text, parse_mode="Markdown")

async def roles_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [
            InlineKeyboardButton("🎓 Socratic Tutor", callback_data="act_socratic"),
            InlineKeyboardButton("📐 Math Teacher", callback_data="act_math")
        ],
        [
            InlineKeyboardButton("🗣️ English Teacher", callback_data="act_english"),
            InlineKeyboardButton("🐍 Python Dev", callback_data="act_python")
        ],
        [
            InlineKeyboardButton("💼 Career Counselor", callback_data="act_career"),
            InlineKeyboardButton("⚖️ Debater", callback_data="act_debater")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("👉 **Hãy chọn một vai trò chuyên gia:**", reply_markup=reply_markup, parse_mode="Markdown")

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id
    choice = query.data

    role_map = {
        "act_socratic": ("Socratic Tutor", "I want you to act as a Socratic tutor. Ask guiding questions instead of direct answers."),
        "act_math": ("Math Teacher", "I want you to act as a math teacher. Explain math equations step by step."),
        "act_english": ("English Teacher", "I want you to act as a spoken English teacher. Strictly correct grammar and typos."),
        "act_python": ("Python Developer", "I want you to act as a senior Python developer. Provide clean PEP8 code."),
        "act_career": ("Career Counselor", "I want you to act as a career counselor for career guidance."),
        "act_debater": ("Debater", "I want you to act as a debater researching and defending debate motions.")
    }

    if choice in role_map:
        act, prompt = role_map[choice]
        user_personas[user_id] = {"act": act, "prompt": prompt}
        await query.edit_message_text(f"✨ **Đã chuyển sang vai trò:** `{act}`\n\nHãy gửi câu hỏi cho tôi ngay bây giờ!", parse_mode="Markdown")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_text = update.message.text

    persona = user_personas.get(user_id, {
        "act": "Socratic Tutor",
        "prompt": "I want you to act as a Socratic tutor."
    })

    # Gọi AI hoặc trả về phản hồi
    if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY":
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            try:
                model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash",
                    system_instruction=persona["prompt"] + "\nVui lòng trả lời trực diện, súc tích bằng Tiếng Việt."
                )
                response = model.generate_content(user_text)
            except Exception:
                model = genai.GenerativeModel(
                    model_name="gemini-2.0-flash",
                    system_instruction=persona["prompt"] + "\nVui lòng trả lời trực diện, súc tích bằng Tiếng Việt."
                )
                response = model.generate_content(user_text)
            reply_text = response.text
        except Exception as e:
            reply_text = f"⚠️ Lỗi gọi Gemini API: {str(e)}"
    else:
        # Simulation Mode
        reply_text = (
            f"💡 **[Phản hồi từ {persona['act']}]:**\n\n"
            f"Tôi đã tiếp nhận câu hỏi của bạn: *\"{user_text}\"*\n\n"
            f"> *Để kết nối AI thực tế, bạn chỉ cần điền `GEMINI_API_KEY` vào tệp script.*"
        )

    await update.message.reply_text(reply_text, parse_mode="Markdown")

def main():
    if TELEGRAM_BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN":
        print("⚠️ Vui lòng cung cấp TELEGRAM_BOT_TOKEN trước khi chạy bot.")
        return

    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("roles", roles_command))
    app.add_handler(CallbackQueryHandler(button_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("🚀 Telegram Bot đang hoạt động! Nhấn Ctrl+C để dừng.")
    app.run_polling()

if __name__ == "__main__":
    main()
