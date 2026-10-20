# 🤖 Multi-Persona AI Chatbot (Dựa trên prompts.chat)

Bộ công cụ Chatbot Đa Năng có khả năng tự động "biến hình" thành hàng ngàn vai trò chuyên gia khác nhau (Gia sư Toán, Giáo viên Tiếng Anh, Socratic Tutor, Senior Python Dev, Marketing Strategist...) được tích hợp từ tập dữ liệu `prompts.csv`.

---

## 🚀 3 Cách Trải nghiệm Chatbot

### Cách 1: Chạy Web Chatbot giao diện đẹp (Khuyên dùng - Không cần cài đặt gì)
1. Truy cập thư mục `c:\Users\ADMIN\Downloads\promt\chatbot\`.
2. Nhấp đúp chuột vào tệp **[`index.html`](file:///c:/Users/ADMIN/Downloads/promt/chatbot/index.html)** để mở trên trình duyệt (Chrome/Edge).
3. Bạn có thể:
   - Chọn vai trò nhanh từ danh sách bên trái (Giáo dục, Lập trình, Ngoại ngữ, Công việc).
   - Nhập API Key của **Google Gemini** (hoặc dùng chế độ **Mô phỏng Demo** có sẵn).
   - Trò chuyện trực tiếp với giao diện hiện đại, hỗ trợ định dạng Markdown và Highlight code.

---

### Cách 2: Chạy Chatbot trực tiếp trên Terminal PowerShell
Mở PowerShell tại thư mục dự án và chạy:
```powershell
powershell -ExecutionPolicy Bypass -File .\chatbot\bot.ps1
```
* **Các lệnh hỗ trợ trong Terminal:**
  * `/list` : Xem danh sách vai trò phổ biến.
  * `/act math` : Chuyển sang làm Gia sư Toán.
  * `/act english` : Chuyển sang làm Giáo viên Tiếng Anh.
  * `/act python` : Chuyển sang làm Chuyên gia Python.
  * `/key <API_KEY>` : Cài đặt Gemini API Key.
  * `/exit` : Thoát bot.

---

### Cách 3: Triển khai Bot lên Telegram
1. Cài đặt thư viện Python:
   ```bash
   pip install python-telegram-bot google-generativeai pandas
   ```
2. Mở tệp **[`telegram_bot.py`](file:///c:/Users/ADMIN/Downloads/promt/chatbot/telegram_bot.py)** và điền `TELEGRAM_BOT_TOKEN` (lấy từ `@BotFather`) và `GEMINI_API_KEY`.
3. Chạy bot:
   ```bash
   python telegram_bot.py
   ```
