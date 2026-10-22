/*
 * TEACH – Dạy học Đáp ứng học sinh (lớp tích hợp cho Multi-Persona Chatbot)
 *
 * 3 trụ cột:
 *   1. Hiểu người học   -> Hồ sơ, tự đánh giá, kiểm tra đầu vào
 *   2. Thiết kế phù hợp -> Luyện tập phân hóa 3 mức từ kho data/toan6
 *   3. Phản hồi kịp thời -> Gợi mở, Sổ lỗi sai, tự viết Điểm mấu chốt
 *
 * Phụ thuộc (khai báo trong index.html): window.TOAN6_DATA, currentRole, chatHistory,
 * addMessage(), sendMessage(), selectRole(), PERSONAS, showToast(), renderMarkdownWithMath().
 */
(function () {
  "use strict";

  const STORAGE_KEY = "teach_profile_v1";

  const LEVELS = {
    1: "Mức 1 – Nhận biết",
    2: "Mức 2 – Thông hiểu",
    3: "Mức 3 – Vận dụng"
  };

  const GROUPS = {
    1: "Cần hỗ trợ",
    2: "Đạt",
    3: "Nâng cao"
  };

  const ASSESS = { chac: "Em đã chắc", mo_ho: "Còn mơ hồ", chua_biet: "Chưa biết" };
  const ASSESS_SCORE = { chac: 2, mo_ho: 1, chua_biet: 0 };

  const STYLES = {
    vi_du: "Ví dụ thực tế",
    hinh_anh: "Hình ảnh, sơ đồ",
    bai_tap: "Làm nhiều bài tập"
  };

  // Các bài học theo SGK Toán 6 Kết nối tri thức (dùng cho bảng tự đánh giá)
  const TOPICS = {
    1: ["Tập hợp", "Cách ghi số tự nhiên", "Thứ tự trong tập hợp số tự nhiên", "Phép cộng và phép trừ số tự nhiên", "Phép nhân và phép chia số tự nhiên", "Lũy thừa với số mũ tự nhiên", "Thứ tự thực hiện các phép tính"],
    2: ["Quan hệ chia hết và tính chất", "Dấu hiệu chia hết cho 2, 5, 3, 9", "Số nguyên tố, hợp số", "Ước chung và ước chung lớn nhất", "Bội chung và bội chung nhỏ nhất"],
    3: ["Tập hợp các số nguyên", "Thứ tự trong tập hợp số nguyên", "Phép cộng và phép trừ số nguyên", "Quy tắc dấu ngoặc", "Phép nhân số nguyên", "Phép chia hết, ước và bội của số nguyên"],
    4: ["Tam giác đều, hình vuông, lục giác đều", "Hình chữ nhật, hình thoi, hình bình hành, hình thang cân", "Chu vi và diện tích các hình"],
    5: ["Hình có trục đối xứng", "Hình có tâm đối xứng", "Vai trò của tính đối xứng trong thế giới tự nhiên"],
    6: ["Mở rộng phân số, phân số bằng nhau", "So sánh phân số, hỗn số dương", "Phép cộng và phép trừ phân số", "Phép nhân và phép chia phân số", "Hai bài toán về phân số"],
    7: ["Số thập phân", "Tính toán với số thập phân", "Làm tròn và ước lượng", "Tỉ số và tỉ số phần trăm"],
    8: ["Điểm và đường thẳng", "Điểm nằm giữa hai điểm, tia", "Đoạn thẳng, độ dài đoạn thẳng", "Trung điểm của đoạn thẳng", "Góc", "Số đo góc"],
    9: ["Dữ liệu và thu thập dữ liệu", "Bảng thống kê và biểu đồ tranh", "Biểu đồ cột và biểu đồ cột kép", "Kết quả có thể và sự kiện trong trò chơi, thí nghiệm", "Xác suất thực nghiệm"]
  };

  const EDU_ROLE_IDS = ["math_teacher", "socratic", "teach_pedagogy"];

  // ---------- Trạng thái ----------
  function defaultProfile() {
    return {
      role: "student",       // "student" | "teacher"
      name: "",
      chapter: 1,
      style: "vi_du",
      guidance: "goi_mo",    // "goi_mo" (gợi mở từng bước) | "day_du" (lời giải đầy đủ)
      selfAssess: {},        // { "Tập hợp": "chac" | "mo_ho" | "chua_biet" }
      level: 2,              // 1..3
      mistakes: [],          // { date, chapter, exercise, loi, visao, cachdung }
      started: false
    };
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = Object.assign(defaultProfile(), JSON.parse(raw));
        let ch = parseInt(p.chapter, 10);
        if (isNaN(ch) || ch < 1 || ch > 9) ch = 1;
        p.chapter = ch;
        return p;
      }
    } catch (e) { /* hồ sơ hỏng -> dùng mặc định */ }
    return defaultProfile();
  }

  function saveProfile() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch (e) { /* bỏ qua */ }
  }

  let profile = loadProfile();
  let draft = null;              // bản nháp hồ sơ khi đang mở modal
  let active = [];               // bài đang luyện / đang kiểm tra
  let activeMode = null;         // "diagnostic" | "practice"
  const usedTitles = new Set();  // tránh lặp bài trong phiên
  let modalTab = "profile";

  // ---------- Tiện ích ----------
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function shortTitle(ex) {
    const m = ex.title.match(/^\*\*([^*]+?):?\*\*/);
    return (m ? m[1] : ex.title.replace(/\*/g, "")).trim();
  }

  function questionBody(ex) {
    let q = (ex.question || "").replace(/^\*\*[^*]+\*\*\s*/, "").trim();
    q = q.replace(/\*\*(\d+)\.\*\*/g, "$1. ")
         .replace(/\*\*([a-d])\)\*\*/g, "$1) ")
         .replace(/\*\*(\d+)\)\*\*/g, "$1) ")
         .replace(/\*\*(\d+)\*\*/g, "$1. ");
    return q.trim();
  }

  function levelOf(ex) {
    const t = shortTitle(ex).toLowerCase();
    if (/^(vận dụng|thử thách|tranh luận)/.test(t)) return 3;
    if (/^bài\s*\d/.test(t)) return 2;
    return 1; // Câu hỏi, Luyện tập
  }

  function isUsable(ex) {
    const q = questionBody(ex);
    const s = (ex.solution || "").trim();
    return (q.length >= 10 && s.length >= 10) || (ex.content && ex.content.length >= 25);
  }

  function chapterItems(ch) {
    let numCh = parseInt(ch, 10);
    if (isNaN(numCh) || numCh < 1 || numCh > 9) numCh = 1;
    const data = (window.TOAN6_DATA || []).find(c => c.chapter === numCh);
    if (!data || !data.sample_items || !data.sample_items.length) {
      return (window.TOAN6_DATA && window.TOAN6_DATA[0] && window.TOAN6_DATA[0].sample_items) || [];
    }
    const usable = data.sample_items.filter(isUsable);
    return usable.length ? usable : data.sample_items;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Chọn n bài ở một mức, ưu tiên bài chưa dùng trong phiên
  function pickExercises(ch, level, n) {
    const all = chapterItems(ch);
    let pool = all.filter(ex => levelOf(ex) === level && !usedTitles.has(ex.title));
    if (pool.length < n) pool = all.filter(ex => levelOf(ex) === level);
    if (pool.length < n) pool = all;
    const picked = shuffle(pool).slice(0, n);
    picked.forEach(ex => usedTitles.add(ex.title));
    return picked;
  }

  function isEduPersona() {
    if (typeof currentRole === "undefined" || !currentRole) return false;
    return currentRole.id.startsWith("toan6") || EDU_ROLE_IDS.includes(currentRole.id);
  }

  function hasLiveApi() {
    const key = (document.getElementById("api-key-input") || {}).value || "";
    const model = (document.getElementById("model-select") || {}).value || "";
    return key.trim() !== "" && model !== "simulation";
  }

  function postBot(md) {
    addMessage("bot", md);
    chatHistory.push({ role: "model", parts: [{ text: md }] });
  }

  function sendText(text) {
    const input = document.getElementById("user-input");
    input.value = text;
    sendMessage();
  }

  function prefill(text, placeholder) {
    const input = document.getElementById("user-input");
    input.value = text;
    input.focus();
    const idx = placeholder ? text.indexOf(placeholder) : -1;
    if (idx >= 0) input.setSelectionRange(idx, idx + placeholder.length);
    else input.setSelectionRange(text.length, text.length);
  }

  function groupFromAssess(selfAssess, ch) {
    const topics = TOPICS[ch] || [];
    const rated = topics.filter(t => selfAssess[t]);
    if (rated.length === 0) return null;
    const score = rated.reduce((s, t) => s + ASSESS_SCORE[selfAssess[t]], 0);
    const ratio = score / (rated.length * 2);
    if (ratio >= 0.75) return 3;
    if (ratio >= 0.4) return 2;
    return 1;
  }

  function topicsBy(value, p) {
    p = p || profile;
    return (TOPICS[p.chapter] || []).filter(t => p.selfAssess[t] === value);
  }

  // Chuẩn hóa số: "3 640 128" / "3.640.128" -> "3640128", "2,5" -> "2.5"
  function normalizeNumbers(text) {
    let s = String(text);
    let prev;
    do { prev = s; s = s.replace(/(\d)[\s.](?=\d{3}(?!\d))/g, "$1"); } while (s !== prev);
    return s.replace(/(\d),(\d)/g, "$1.$2");
  }

  function numbersIn(text) {
    return (normalizeNumbers(text).match(/\d+(?:\.\d+)?/g) || []);
  }

  // Lấy số cuối cùng trong dòng kết luận của lời giải (VD: "Vậy ... 200 (ghế băng)")
  function expectedAnswer(ex) {
    const lines = (ex.solution || "").split("\n").map(l => l.trim()).filter(Boolean);
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 3); i--) {
      const nums = numbersIn(lines[i]);
      if (nums.length) return nums[nums.length - 1];
    }
    return null;
  }

  function splitAnswers(text, count) {
    if (count <= 1) return [text];
    const parts = [];
    const re = /câu\s*(\d)\s*[:.)\-]/gi;
    const marks = [];
    let m;
    while ((m = re.exec(text)) !== null) marks.push({ n: parseInt(m[1], 10), start: m.index, bodyStart: re.lastIndex });
    for (let i = 0; i < marks.length; i++) {
      const end = i + 1 < marks.length ? marks[i + 1].start : text.length;
      parts[marks[i].n - 1] = text.slice(marks[i].bodyStart, end);
    }
    return parts;
  }

  // ---------- Ngữ cảnh gửi cho AI ----------
  function exerciseBlock(ex, idx) {
    const q = questionBody(ex) || ex.content;
    const s = (ex.solution || "").trim() || ex.content;
    return `${idx != null ? `Câu ${idx + 1} (${LEVELS[levelOf(ex)]}): ` : ""}${shortTitle(ex)}
Đề bài: ${q}
Lời giải chuẩn SGK (chỉ để đối chiếu): ${s}`;
  }

  function getContext(alreadyIncludedEx) {
    if (!isEduPersona() || !profile.started) return "";

    if (profile.role === "teacher") {
      return `

[TEACH – NGƯỜI DÙNG LÀ GIÁO VIÊN]
- Chương đang dạy: ${profile.chapter}. ${(TOPICS[profile.chapter] || []).join("; ")}.
- Trả lời ở vai trò chuyên gia hỗ trợ giáo viên (xưng "thầy/cô"), KHÔNG xưng hô như đang dạy học sinh.
- Ưu tiên sản phẩm dùng được ngay trên lớp: câu hỏi chẩn đoán, phiếu phân hóa 3 mức (Nhận biết – Thông hiểu – Vận dụng), kế hoạch bài dạy 45 phút, dự đoán lỗi sai thường gặp và cách phản hồi kịp thời, câu chốt "🔑 Điểm mấu chốt".
- Bài tập đưa ra phải bám sát SGK Toán 6 Kết nối tri thức.`;
    }

    const lines = [];
    lines.push(`

[TEACH – HỒ SƠ NGƯỜI HỌC (Hiểu người học)]
- Học sinh lớp 6${profile.name ? `, tên: ${profile.name}` : ""}. Chương đang học: ${profile.chapter}.
- Nhóm hiện tại: ${GROUPS[profile.level]} → đang luyện ${LEVELS[profile.level]}.`);
    const chac = topicsBy("chac"), moHo = topicsBy("mo_ho"), chuaBiet = topicsBy("chua_biet");
    if (chac.length) lines.push(`- Em tự đánh giá đã chắc: ${chac.join("; ")}.`);
    if (moHo.length) lines.push(`- Còn mơ hồ: ${moHo.join("; ")}.`);
    if (chuaBiet.length) lines.push(`- Chưa biết: ${chuaBiet.join("; ")}.`);
    lines.push(`- Em học tốt nhất qua: ${STYLES[profile.style]}. Hãy giải thích bằng cách này.`);
    const recent = profile.mistakes.slice(-5);
    if (recent.length) {
      lines.push(`- Lỗi sai gần đây (tránh để em lặp lại): ${recent.map(m => m.loi).join("; ")}.`);
    }

    lines.push(`
[TEACH – CÁCH HƯỚNG DẪN (Thiết kế phù hợp)]`);
    if (profile.guidance === "goi_mo") {
      lines.push(`- Chế độ GỢI MỞ: KHÔNG trình bày toàn bộ lời giải ngay. Mỗi lượt chỉ đưa MỘT gợi ý hoặc MỘT câu hỏi dẫn dắt rồi chờ em trả lời.
- Chỉ trình bày lời giải đầy đủ khi em yêu cầu rõ ràng ("xem lời giải", "cho em đáp án").
- Lời giải chuẩn trong ngữ cảnh chỉ dùng để đối chiếu, không chép nguyên văn cho em.`);
    } else {
      lines.push(`- Chế độ LỜI GIẢI ĐẦY ĐỦ: trình bày lời giải theo từng bước bám sát SGK, sau đó hỏi em 1 câu ngắn để kiểm tra em đã hiểu.`);
    }

    lines.push(`
[TEACH – PHẢN HỒI KỊP THỜI]
- Khi em gửi bài làm/câu trả lời: khen điểm làm đúng TRƯỚC → chỉ rõ dòng/bước sai và VÌ SAO sai → gợi ý cách sửa.
- Nếu em gửi câu bắt đầu bằng "🔑 Điểm mấu chốt em rút ra", hãy nhận xét câu đó (đúng/thiếu gì) và hoàn thiện giúp em bằng 1 câu ngắn.`);

    const exs = active.filter(ex => ex !== alreadyIncludedEx);
    if (exs.length) {
      lines.push(`
[BÀI ${activeMode === "diagnostic" ? "KIỂM TRA ĐẦU VÀO" : "ĐANG LUYỆN"} – em đang làm, ưu tiên đối chiếu với các bài này]
${exs.map((ex, i) => exerciseBlock(ex, activeMode === "diagnostic" ? i : null)).join("\n\n")}`);
    }

    if (activeMode === "diagnostic") {
      lines.push(`- Khi em trả lời bài kiểm tra đầu vào: nhận xét từng câu (đúng/sai/chưa biết), KHÔNG chê. Sau đó kết luận nhóm phù hợp và ghi ở dòng riêng cuối cùng đúng định dạng: [[MUC_DO: 1]] (Cần hỗ trợ), [[MUC_DO: 2]] (Đạt) hoặc [[MUC_DO: 3]] (Nâng cao).`);
    }

    lines.push(`
[GHI SỔ LỖI SAI – bắt buộc khi phát hiện lỗi]
Nếu câu trả lời của em có lỗi sai (tính toán, hiểu nhầm khái niệm, thiếu bước, thiếu đơn vị...), thêm vào CUỐI CÙNG của phản hồi (sau phần Điểm mấu chốt), mỗi lỗi một dòng, đúng định dạng:
[[SO_LOI: <lỗi gì, ngắn gọn> || <vì sao sai> || <cách làm đúng>]]
Không thêm dòng này nếu em không mắc lỗi. Không giải thích về định dạng này.`);

    return lines.join("\n");
  }

  // Quyết định bài SGK nào dùng làm ngữ cảnh cho tin nhắn hiện tại
  function resolveExercise(text, matchedEx) {
    const explicit = /\d+\.\d+|trang\s*\d+/i.test(text || "");
    if (explicit && matchedEx) {
      if (profile.role === "student" && profile.started && isEduPersona()) {
        active = [matchedEx];
        activeMode = "practice";
        renderChips();
      }
      return matchedEx;
    }
    // Đang có bài luyện -> không để tìm kiếm theo từ khóa chèn nhầm bài khác
    if (active.length && profile.role === "student") return null;
    return matchedEx;
  }

  // ---------- Đọc dấu hiệu [[...]] trong phản hồi của AI ----------
  const MARKER_STRIP_RE = /\n?[ \t]*\[\[(?:SO_LOI|MUC_DO):[\s\S]*?(?:\]\]|$)/g;

  function stripMarkers(text) {
    if (!text || text.indexOf("[[") === -1) return text;
    return text.replace(MARKER_STRIP_RE, "").replace(/\s+$/, "");
  }

  function captureFromReply(reply) {
    if (!reply || reply.indexOf("[[") === -1) return;
    let added = 0;
    const loiRe = /\[\[SO_LOI:([\s\S]*?)\]\]/g;
    let m;
    while ((m = loiRe.exec(reply)) !== null) {
      const parts = m[1].split("||").map(s => s.trim());
      if (!parts[0]) continue;
      profile.mistakes.push({
        date: new Date().toLocaleDateString("vi-VN"),
        chapter: profile.chapter,
        exercise: active[0] ? shortTitle(active[0]) : "",
        loi: parts[0],
        visao: parts[1] || "",
        cachdung: parts[2] || ""
      });
      added++;
    }
    const lv = reply.match(/\[\[MUC_DO:\s*([123])\s*\]\]/);
    if (lv) {
      profile.level = parseInt(lv[1], 10);
      activeMode = null;
      active = [];
      showToast(`🎯 Nhóm của em: ${GROUPS[profile.level]} → luyện ${LEVELS[profile.level]}`);
    }
    if (added) showToast(`📒 Đã ghi ${added} lỗi vào Sổ lỗi sai`);
    if (added || lv) {
      saveProfile();
      renderChips();
    }
  }

  // ---------- Phản hồi khi KHÔNG có API (chế độ mô phỏng) ----------
  function simulateReply(query) {
    if (!profile.started || profile.role !== "student" || !isEduPersona()) return null;
    const q = (query || "").toLowerCase();

    // HS hỏi một bài cụ thể ở chế độ gợi mở -> giao bài, không đưa lời giải
    if (/\d+\.\d+|trang\s*\d+/.test(q) && typeof findRelevantToan6Exercise === "function") {
      const ex = findRelevantToan6Exercise(query);
      if (ex && profile.guidance === "goi_mo") {
        active = [ex];
        activeMode = "practice";
        renderChips();
        return `### 🎯 ${shortTitle(ex)}\n\n${questionBody(ex)}\n\n---\n\n✍️ Em thử làm trước và gửi bài làm (ghi đủ các bước) nhé. Bí thì bấm **💡 Gợi ý**, muốn đối chiếu thì bấm **📖 Xem lời giải**.`;
      }
    }

    if (!active.length) return null;

    if (q.includes("gợi ý")) {
      const ex = active[0];
      const steps = (ex.solution || "").split("\n").map(l => l.trim()).filter(Boolean);
      const first = steps[0] || "Đọc kỹ đề, xác định cái đã cho và cái cần tìm.";
      return `💡 **Gợi ý bước đầu tiên** (${shortTitle(ex)}):\n\n> ${first}\n\nEm thử làm tiếp từ đây rồi gửi bài làm nhé!\n\n*(Chế độ mô phỏng – nhập API Key để được gợi ý gợi mở theo từng bước.)*`;
    }

    if (q.startsWith("🔑") || q.includes("điểm mấu chốt em rút ra")) {
      return `👏 Cảm ơn em đã tự viết điểm mấu chốt – đây là cách nhớ bài lâu nhất!\n\nEm hãy so sánh với lời giải chuẩn (bấm **📖 Xem lời giải**) xem câu của mình đã nêu được **quy tắc chính** và **lỗi cần tránh** chưa nhé.\n\n*(Chế độ mô phỏng – nhập API Key để được nhận xét chi tiết câu chốt của em.)*`;
    }

    // Chấm sơ bộ theo kết quả cuối cùng
    const answers = splitAnswers(query, active.length);
    let correct = 0, checkable = 0;
    const rows = active.map((ex, i) => {
      const ans = answers[i] || (active.length === 1 ? query : "");
      const expected = expectedAnswer(ex);
      const label = active.length > 1 ? `**Câu ${i + 1}**` : `**${shortTitle(ex)}**`;
      if (!ans.trim()) return `- ${label}: chưa thấy câu trả lời.`;
      if (/chưa biết|không biết/i.test(ans)) return `- ${label}: em ghi *chưa biết* – không sao, thầy/cô sẽ hướng dẫn phần này. 👍`;
      if (!expected) return `- ${label}: câu này cần nhận xét bằng lời, chế độ mô phỏng chưa tự chấm được.`;
      checkable++;
      if (numbersIn(ans).includes(expected)) {
        correct++;
        return `- ${label}: ✅ kết quả cuối **khớp** với đáp án SGK.`;
      }
      return `- ${label}: ⚠️ kết quả cuối **chưa khớp** đáp án SGK. Em kiểm tra lại từng bước nhé.`;
    });

    let tail = "";
    if (activeMode === "diagnostic") {
      const level = correct >= 3 ? 3 : correct === 2 ? 2 : 1;
      profile.level = level;
      saveProfile();
      active = [];
      activeMode = null;
      renderChips();
      tail = `\n\n🎯 **Nhóm gợi ý:** ${GROUPS[level]} → em bắt đầu với **${LEVELS[level]}**. Bấm **🎯 Luyện tập** để làm bài vừa sức nhé!`;
    } else if (checkable && correct < checkable) {
      tail = `\n\n📖 Bấm **Xem lời giải** để đối chiếu, rồi ghi lỗi của mình vào **📒 Sổ lỗi sai** (Lỗi gì → Vì sao sai → Cách đúng).`;
    } else if (checkable && correct === checkable) {
      tail = `\n\n🎉 Giỏi lắm! Em bấm **⬆️ Khó hơn** để thử thách bản thân, và đừng quên **✍️ Tự viết điểm mấu chốt** nhé.`;
    }

    return `### 📝 Nhận xét sơ bộ\n\n${rows.join("\n")}${tail}\n\n*(Chế độ mô phỏng chỉ so kết quả cuối cùng – nhập API Key để được nhận xét từng bước.)*`;
  }

  // ---------- Hành động của HỌC SINH ----------
  function startDiagnostic() {
    let ch = parseInt(profile.chapter, 10);
    if (isNaN(ch) || ch < 1 || ch > 9) { ch = 1; profile.chapter = 1; saveProfile(); }
    let items = [1, 2, 3].map(lv => pickExercises(ch, lv, 1)[0]).filter(Boolean);
    if (!items.length) {
      const all = chapterItems(ch);
      items = shuffle(all).slice(0, 3);
    }
    if (!items.length) { showToast("⚠️ Chưa có dữ liệu bài tập cho chương này"); return; }
    active = items;
    activeMode = "diagnostic";
    const body = items.map((ex, i) =>
      `**Câu ${i + 1} · ${LEVELS[levelOf(ex)] || "Bài tập"}** — *${shortTitle(ex)}*\n\n${questionBody(ex)}`
    ).join("\n\n---\n\n");
    postBot(`### 🩺 Kiểm tra nhanh đầu vào – Chương ${ch}\n*Bài lấy từ SGK, mỗi mức 1 câu. Em làm trung thực nhé: câu nào chưa biết cứ ghi **"chưa biết"**, không sao cả!*\n\n---\n\n${body}\n\n---\n\n👉 Trả lời theo mẫu: \`Câu 1: ...\`  \`Câu 2: ...\`  \`Câu 3: ...\` (ghi cả cách làm).`);
    renderChips();
  }

  function practice(delta) {
    let ch = parseInt(profile.chapter, 10);
    if (isNaN(ch) || ch < 1 || ch > 9) { ch = 1; profile.chapter = 1; }
    profile.level = Math.min(3, Math.max(1, profile.level + (delta || 0)));
    saveProfile();
    let ex = pickExercises(profile.chapter, profile.level, 1)[0];
    if (!ex) {
      const all = chapterItems(profile.chapter);
      ex = all[0];
    }
    if (!ex) { showToast("⚠️ Chưa có dữ liệu bài tập cho chương này"); return; }
    active = [ex];
    activeMode = "practice";
    postBot(`### 🎯 Luyện tập ${LEVELS[profile.level]} · Chương ${profile.chapter}\n\n**${shortTitle(ex)}**\n\n${questionBody(ex)}\n\n---\n\n✍️ Em làm bài rồi gửi câu trả lời (ghi đủ các bước để thầy/cô thấy cách em nghĩ). Bí thì bấm **💡 Gợi ý**.`);
    renderChips();
  }

  function hint() {
    if (!active.length) return;
    sendText("💡 Em cần một gợi ý cho bước tiếp theo (đừng cho em đáp án ngay ạ).");
  }

  function showSolution() {
    if (!active.length) return;
    const md = active.map((ex, i) => {
      const s = (ex.solution || "").trim() || ex.content;
      return `**${active.length > 1 ? `Câu ${i + 1} – ` : ""}${shortTitle(ex)}**\n\n${s}`;
    }).join("\n\n---\n\n");
    postBot(`### 📖 Lời giải chuẩn SGK\n\n${md}\n\n---\n\n👉 Em đối chiếu với bài làm của mình. Sai ở đâu thì ghi vào **📒 Sổ lỗi sai**, rồi bấm **✍️ Tự viết điểm mấu chốt** nhé!`);
  }

  function writeKeyPoint() {
    prefill("🔑 Điểm mấu chốt em rút ra: ");
  }

  // ---------- Hành động của GIÁO VIÊN ----------
  function answerKey(items) {
    return items.map((ex, i) => `**Câu ${i + 1}.** ${ex.solution}`).join("\n\n");
  }

  function buildSurvey() {
    let ch = parseInt(profile.chapter, 10);
    if (isNaN(ch) || ch < 1 || ch > 9) { ch = 1; profile.chapter = 1; }
    let items = [...pickExercises(ch, 1, 2), ...pickExercises(ch, 2, 2), ...pickExercises(ch, 3, 1)];
    if (!items.length) {
      const all = chapterItems(ch);
      items = shuffle(all).slice(0, 5);
    }
    if (!items.length) { showToast("⚠️ Chưa có dữ liệu bài tập cho chương này"); return; }
    const qs = items.map((ex, i) => `**Câu ${i + 1}** *(${LEVELS[levelOf(ex)]} · ${shortTitle(ex)})*\n\n${questionBody(ex)}`).join("\n\n");
    const assessRows = (TOPICS[ch] || []).map(t => `| ${t} | ☐ | ☐ | ☐ |`).join("\n");
    postBot(`### 📋 Phiếu khảo sát đầu vào – Chương ${ch}
*Bài lấy từ SGK Toán 6 Kết nối tri thức (kho \`data/toan6\`). Thời gian gợi ý: 10–15 phút.*

#### Phần A – Em tự đánh giá
| Nội dung | Em đã chắc | Còn mơ hồ | Chưa biết |
|---|:-:|:-:|:-:|
${assessRows}

#### Phần B – Bài làm
${qs}

---

#### 🗂️ Gợi ý chia nhóm (linh hoạt, điều chỉnh sau mỗi chủ đề)
- Đúng 0–2 câu → **Cần hỗ trợ** (bắt đầu Mức 1)
- Đúng 3–4 câu → **Đạt** (bắt đầu Mức 2)
- Đúng 5 câu → **Nâng cao** (bắt đầu Mức 3)

#### ✅ Đáp án (dành cho giáo viên)
${answerKey(items)}`);
  }

  function buildWorksheet() {
    const ch = profile.chapter;
    const groups = [1, 2, 3].map(lv => ({ lv, items: pickExercises(ch, lv, 2) }));
    let n = 0;
    const all = [];
    const body = groups.map(g => {
      const qs = g.items.map(ex => { n++; all.push(ex); return `**Câu ${n}** *(${shortTitle(ex)})*\n\n${questionBody(ex)}`; }).join("\n\n");
      return `#### ${LEVELS[g.lv]}\n${qs || "*(Chương này chưa có bài phù hợp ở mức này)*"}`;
    }).join("\n\n---\n\n");
    postBot(`### 📄 Phiếu luyện tập phân hóa 3 mức – Chương ${ch}
*Học sinh làm mức vừa sức, xong thì lên mức tiếp. Bài lấy từ SGK (kho \`data/toan6\`).*

${body}

---

#### ✅ Đáp án (dành cho giáo viên)
${answerKey(all)}`);
  }

  function askLessonPlan() {
    const placeholder = "[tên bài]";
    prefill(`Thiết kế kế hoạch bài dạy phân hóa theo TEACH (Hiểu người học – Thiết kế phù hợp – Phản hồi kịp thời) cho bài ${placeholder} – Toán 6 Chương ${profile.chapter}, thời lượng 45 phút. Gồm: câu hỏi khởi động chẩn đoán, hoạt động 3 mức, dự kiến lỗi sai và cách phản hồi, câu chốt Điểm mấu chốt.`, placeholder);
  }

  function askCommonMistakes() {
    sendText(`Liệt kê các lỗi sai và hiểu lầm thường gặp của học sinh lớp 6 ở Chương ${profile.chapter} (${(TOPICS[profile.chapter] || []).join("; ")}). Mỗi lỗi gồm: ví dụ bài làm sai, nguyên nhân, câu hỏi gợi mở để học sinh tự phát hiện, và câu chốt Điểm mấu chốt.`);
  }

  // ---------- Thanh nút nhanh ----------
  function chip(label, handler, opts) {
    opts = opts || {};
    const b = document.createElement("button");
    b.type = "button";
    b.className = "teach-chip" + (opts.cls ? " " + opts.cls : "");
    b.textContent = label;
    if (opts.title) b.title = opts.title;
    if (opts.disabled) b.disabled = true;
    b.addEventListener("click", handler);
    return b;
  }

  function renderChips() {
    const bar = document.getElementById("teach-chips");
    if (!bar) return;
    bar.innerHTML = "";
    if (!isEduPersona()) { bar.classList.remove("visible"); return; }
    bar.classList.add("visible");

    if (!profile.started) {
      bar.appendChild(chip("✨ Bắt đầu lộ trình TEACH", () => openModal("profile"), { cls: "start", title: "Tạo hồ sơ để gia sư hiểu em/thầy cô" }));
      return;
    }

    if (profile.role === "teacher") {
      bar.appendChild(chip(`👩‍🏫 Giáo viên · C${profile.chapter}`, () => openModal("profile"), { cls: "profile", title: "Đổi hồ sơ, chương" }));
      bar.appendChild(chip("📋 Phiếu khảo sát đầu vào", buildSurvey));
      bar.appendChild(chip("📄 Phiếu luyện tập 3 mức", buildWorksheet));
      bar.appendChild(chip("🗂️ Kế hoạch bài dạy", askLessonPlan));
      bar.appendChild(chip("🔍 Lỗi sai thường gặp", askCommonMistakes));
      bar.appendChild(chip("📘 Quy trình TEACH", () => openModal("guide")));
      return;
    }

    const noActive = !active.length;
    bar.appendChild(chip(`🧑‍🎓 ${profile.name || "Học sinh"} · C${profile.chapter} · ${GROUPS[profile.level]}`, () => openModal("profile"), { cls: "profile", title: "Xem/sửa hồ sơ" }));
    bar.appendChild(chip("🩺 Kiểm tra đầu vào", startDiagnostic, { title: "3 câu từ SGK, mỗi mức 1 câu" }));
    bar.appendChild(chip(`🎯 Luyện tập Mức ${profile.level}`, () => practice(0)));
    bar.appendChild(chip("⬇️ Dễ hơn", () => practice(-1), { disabled: profile.level <= 1 }));
    bar.appendChild(chip("⬆️ Khó hơn", () => practice(1), { disabled: profile.level >= 3 }));
    bar.appendChild(chip("💡 Gợi ý", hint, { disabled: noActive, title: noActive ? "Chưa có bài đang làm" : "" }));
    bar.appendChild(chip("📖 Xem lời giải", showSolution, { disabled: noActive, title: noActive ? "Chưa có bài đang làm" : "" }));
    bar.appendChild(chip("✍️ Tự viết điểm mấu chốt", writeKeyPoint));
    bar.appendChild(chip(`📒 Sổ lỗi sai (${profile.mistakes.length})`, () => openModal("log")));
  }

  // ---------- Modal ----------
  function ensureModal() {
    if (document.getElementById("teach-modal")) return;
    const wrap = document.createElement("div");
    wrap.className = "modal-overlay";
    wrap.id = "teach-modal";
    wrap.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">🎯 Lộ trình TEACH – Dạy học Đáp ứng học sinh</div>
          <button class="modal-close" type="button" data-act="close">✕</button>
        </div>
        <div class="teach-tabs">
          <button class="teach-tab" type="button" data-tab="profile">1. Hồ sơ & Tự đánh giá</button>
          <button class="teach-tab" type="button" data-tab="log">2. Sổ lỗi sai</button>
          <button class="teach-tab" type="button" data-tab="guide">3. Quy trình TEACH</button>
        </div>
        <div class="modal-body" id="teach-modal-body"></div>
        <div class="modal-footer" id="teach-modal-footer"></div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", e => {
      if (e.target === wrap || e.target.closest("[data-act='close']")) closeModal();
      const tab = e.target.closest("[data-tab]");
      if (tab) { modalTab = tab.dataset.tab; renderModal(); }
    });
  }

  function openModal(tab) {
    ensureModal();
    modalTab = tab || "profile";
    draft = JSON.parse(JSON.stringify(profile));
    renderModal();
    document.getElementById("teach-modal").classList.add("active");
  }

  function closeModal() {
    const m = document.getElementById("teach-modal");
    if (m) m.classList.remove("active");
  }

  function renderModal() {
    document.querySelectorAll("#teach-modal .teach-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === modalTab));
    const body = document.getElementById("teach-modal-body");
    const footer = document.getElementById("teach-modal-footer");
    if (modalTab === "profile") renderProfileTab(body, footer);
    else if (modalTab === "log") renderLogTab(body, footer);
    else renderGuideTab(body, footer);
  }

  function renderProfileTab(body, footer) {
    const d = draft;
    const isStudent = d.role === "student";
    const chapterOpts = (window.TOAN6_DATA || []).map(c =>
      `<option value="${c.chapter}" ${c.chapter === d.chapter ? "selected" : ""}>${escapeHtml(c.title)}</option>`).join("");
    const assessRows = (TOPICS[d.chapter] || []).map(t => `
      <tr><td>${escapeHtml(t)}</td><td>${Object.keys(ASSESS).map(v =>
        `<button type="button" class="teach-pill ${d.selfAssess[t] === v ? "active" : ""}" data-topic="${escapeHtml(t)}" data-v="${v}">${ASSESS[v]}</button>`).join("")}</td></tr>`).join("");
    const group = groupFromAssess(d.selfAssess, d.chapter) || d.level;

    body.innerHTML = `
      <div class="teach-section">
        <h4>Bạn là ai?</h4>
        <div class="teach-seg">
          <button type="button" data-role="student" class="${isStudent ? "active" : ""}">🧑‍🎓 Học sinh</button>
          <button type="button" data-role="teacher" class="${!isStudent ? "active" : ""}">👩‍🏫 Giáo viên</button>
        </div>
      </div>
      <div class="teach-section teach-row">
        <label>${isStudent ? "Tên em (không bắt buộc)" : "Tên thầy/cô (không bắt buộc)"}
          <input type="text" id="teach-name" value="${escapeHtml(d.name)}" maxlength="40">
        </label>
        <label>${isStudent ? "Chương đang học" : "Chương đang dạy"}
          <select id="teach-chapter">${chapterOpts}</select>
        </label>
      </div>
      ${isStudent ? `
      <div class="teach-section">
        <h4>🎯 Hiểu người học – Em tự đánh giá</h4>
        <div class="teach-hint">Chọn trung thực cho từng bài, để gia sư biết nên bắt đầu từ đâu.</div>
        <table class="teach-assess">${assessRows}</table>
      </div>
      <div class="teach-section teach-row">
        <label>Em học tốt nhất qua
          <select id="teach-style">${Object.keys(STYLES).map(k => `<option value="${k}" ${d.style === k ? "selected" : ""}>${STYLES[k]}</option>`).join("")}</select>
        </label>
        <label>Cách gia sư hướng dẫn
          <select id="teach-guidance">
            <option value="goi_mo" ${d.guidance === "goi_mo" ? "selected" : ""}>Gợi mở từng bước (khuyên dùng)</option>
            <option value="day_du" ${d.guidance === "day_du" ? "selected" : ""}>Lời giải đầy đủ</option>
          </select>
        </label>
      </div>
      <div class="teach-summary">📊 Nhóm hiện tại: <strong>${GROUPS[group]}</strong> → bắt đầu luyện <strong>${LEVELS[group]}</strong>. Bấm <em>🩺 Kiểm tra đầu vào</em> sau khi lưu để xác định chính xác hơn.</div>
      ` : `
      <div class="teach-summary">Sau khi lưu, các nút dưới khung chat sẽ giúp thầy/cô: tạo <strong>phiếu khảo sát đầu vào</strong>, <strong>phiếu luyện tập 3 mức</strong> (bài từ SGK, kèm đáp án), soạn <strong>kế hoạch bài dạy phân hóa</strong> và tra <strong>lỗi sai thường gặp</strong>.</div>
      `}`;

    footer.innerHTML = `
      ${profile.started ? `<button class="btn-neo" type="button" data-act="reset" style="margin-right:auto">↺ Tạo lại hồ sơ</button>` : ""}
      <button class="btn-neo" type="button" data-act="close">Đóng</button>
      <button class="btn-neo btn-neo-primary" type="button" data-act="save">💾 Lưu & Bắt đầu</button>`;

    body.querySelectorAll("[data-role]").forEach(b => b.onclick = () => { syncDraft(); d.role = b.dataset.role; renderModal(); });
    body.querySelectorAll(".teach-pill").forEach(b => b.onclick = () => {
      syncDraft();
      d.selfAssess[b.dataset.topic] = b.dataset.v;
      renderModal();
    });
    body.querySelector("#teach-chapter").onchange = () => { syncDraft(); renderModal(); };
    footer.querySelector("[data-act='save']").onclick = () => { syncDraft(); saveFromDraft(); };
    const reset = footer.querySelector("[data-act='reset']");
    if (reset) reset.onclick = () => {
      if (!confirm("Xóa hồ sơ TEACH và Sổ lỗi sai trên trình duyệt này?")) return;
      profile = defaultProfile();
      saveProfile();
      active = []; activeMode = null;
      draft = JSON.parse(JSON.stringify(profile));
      renderChips();
      renderModal();
    };
  }

  function syncDraft() {
    const v = id => { const el = document.getElementById(id); return el ? el.value : null; };
    if (v("teach-name") !== null) draft.name = v("teach-name").trim();
    if (v("teach-chapter") !== null) draft.chapter = parseInt(v("teach-chapter"), 10);
    if (v("teach-style") !== null) draft.style = v("teach-style");
    if (v("teach-guidance") !== null) draft.guidance = v("teach-guidance");
  }

  function saveFromDraft() {
    const chapterChanged = draft.chapter !== profile.chapter;
    const group = groupFromAssess(draft.selfAssess, draft.chapter);
    if (group) draft.level = group;
    draft.started = true;
    profile = draft;
    saveProfile();
    if (chapterChanged) { active = []; activeMode = null; }
    closeModal();

    // Chuyển sang gia sư phù hợp
    const targetId = profile.role === "teacher" ? "teach_pedagogy" : `toan6_c${profile.chapter}`;
    const persona = (typeof PERSONAS !== "undefined") && PERSONAS.find(p => p.id === targetId);
    if (persona && currentRole.id !== targetId) selectRole(persona);

    postBot(profile.role === "teacher" ? teacherWelcome() : studentWelcome());
    renderChips();
    showToast("✅ Đã lưu hồ sơ TEACH");
  }

  function studentWelcome() {
    const moHo = topicsBy("mo_ho").concat(topicsBy("chua_biet"));
    return `### 🎯 Bắt đầu lộ trình TEACH – Chương ${profile.chapter}
Chào **${escapeHtml(profile.name) || "em"}**! Gia sư đã nắm hồ sơ của em:
- Nhóm hiện tại: **${GROUPS[profile.level]}** → bắt đầu **${LEVELS[profile.level]}**
${moHo.length ? `- Phần cần ôn kỹ: ${moHo.join("; ")}\n` : ""}- Em học tốt nhất qua: ${STYLES[profile.style]}
- Cách hướng dẫn: ${profile.guidance === "goi_mo" ? "gợi mở từng bước" : "lời giải đầy đủ"}

**Tuần đầu, em làm 3 việc:**
1. 🩺 Bấm **Kiểm tra đầu vào**: làm trung thực, chưa biết thì ghi "chưa biết".
2. 🎯 **Luyện tập** vừa sức: ghi đủ các bước để gia sư thấy cách em nghĩ.
3. 📒 Sai ở đâu thì ghi vào **Sổ lỗi sai** (Lỗi gì → Vì sao sai → Cách đúng).

Cuối mỗi bài, bấm **✍️ Tự viết điểm mấu chốt** bằng lời của em nhé!`;
  }

  function teacherWelcome() {
    return `### 👩‍🏫 Bắt đầu dạy học TEACH – Chương ${profile.chapter}
Gợi ý tuần đầu cho thầy/cô:
1. 📋 **Phiếu khảo sát đầu vào**: tự đánh giá và 5 câu từ SGK, kèm đáp án và gợi ý chia nhóm.
2. 🗂️ **Chia nhóm linh hoạt** (Cần hỗ trợ / Đạt / Nâng cao), điều chỉnh sau mỗi chủ đề.
3. 📄 **Phiếu luyện tập 3 mức**: học sinh làm mức vừa sức, xong thì lên mức tiếp.
4. 🔑 Mỗi tiết đều **chốt Điểm mấu chốt**; học sinh tự viết lại bằng lời của mình.

> 💡 Tuần đầu chỉ cần làm tốt 2 việc: **khảo sát đầu vào** và **chốt Điểm mấu chốt cuối tiết**.

Các nút dưới khung chat giúp thầy/cô làm nhanh từng việc.`;
  }

  function renderLogTab(body, footer) {
    const rows = profile.mistakes.map((m, i) => `
      <tr>
        <td>${escapeHtml(m.date)}<br><small>${escapeHtml(m.exercise || `Chương ${m.chapter}`)}</small></td>
        <td>${escapeHtml(m.loi)}</td>
        <td>${escapeHtml(m.visao)}</td>
        <td>${escapeHtml(m.cachdung)}</td>
        <td class="del"><button type="button" data-del="${i}" title="Xóa">🗑️</button></td>
      </tr>`).reverse().join("");

    body.innerHTML = `
      <div class="teach-section">
        <h4>📒 Sổ lỗi sai</h4>
        <div class="teach-hint">Gia sư tự ghi khi phát hiện lỗi (cần API Key). Em cũng có thể tự ghi sau khi xem lời giải: tự ghi giúp nhớ lâu hơn!</div>
        <table class="teach-log">
          <thead><tr><th>Ngày / Bài</th><th>Lỗi gì</th><th>Vì sao sai</th><th>Cách đúng</th><th></th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5" class="teach-empty">Chưa có lỗi nào. Sai là để học, đừng ngại ghi lại nhé!</td></tr>`}</tbody>
        </table>
      </div>
      <div class="teach-section">
        <h4>✍️ Tự ghi một lỗi</h4>
        <div class="teach-row">
          <label>Lỗi gì<input type="text" id="teach-loi" placeholder="VD: Quên cộng thêm 1 ghế cho phần dư"></label>
          <label>Vì sao sai<input type="text" id="teach-visao" placeholder="VD: Chưa nghĩ 2 bạn dư ngồi đâu"></label>
          <label>Cách đúng<input type="text" id="teach-cachdung" placeholder="VD: Chia có dư mà cần chứa hết → thương + 1"></label>
        </div>
      </div>`;

    footer.innerHTML = `
      <button class="btn-neo" type="button" data-act="analyze" style="margin-right:auto" ${profile.mistakes.length ? "" : "disabled"}>🔍 Nhờ gia sư phân tích sổ lỗi</button>
      <button class="btn-neo" type="button" data-act="close">Đóng</button>
      <button class="btn-neo btn-neo-primary" type="button" data-act="add">➕ Thêm vào sổ</button>`;

    body.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
      profile.mistakes.splice(parseInt(b.dataset.del, 10), 1);
      saveProfile(); renderChips(); renderModal();
    });
    footer.querySelector("[data-act='add']").onclick = () => {
      const loi = document.getElementById("teach-loi").value.trim();
      if (!loi) { showToast("⚠️ Em ghi ít nhất ô \"Lỗi gì\" nhé"); return; }
      profile.mistakes.push({
        date: new Date().toLocaleDateString("vi-VN"),
        chapter: profile.chapter,
        exercise: active[0] ? shortTitle(active[0]) : "",
        loi,
        visao: document.getElementById("teach-visao").value.trim(),
        cachdung: document.getElementById("teach-cachdung").value.trim()
      });
      saveProfile(); renderChips(); renderModal();
      showToast("📒 Đã ghi vào Sổ lỗi sai");
    };
    footer.querySelector("[data-act='analyze']").onclick = () => {
      const list = profile.mistakes.slice(-10).map((m, i) => `${i + 1}. ${m.loi}${m.visao ? ` (vì: ${m.visao})` : ""}`).join("\n");
      closeModal();
      sendText(`Đây là sổ lỗi sai gần đây của em:\n${list}\n\nThầy/cô giúp em tìm ra các lỗi em hay lặp lại, giải thích nguyên nhân chung, và cho em 2 bài luyện tập đúng vào chỗ yếu đó nhé.`);
    };
  }

  function renderGuideTab(body, footer) {
    const md = `### Giai đoạn 1 – Chuẩn bị (tuần đầu)
| 👩‍🏫 Giáo viên | 🧑‍🎓 Học sinh |
|---|---|
| Khảo sát đầu vào (nút **📋 Phiếu khảo sát**) | Làm bài trung thực (nút **🩺 Kiểm tra đầu vào**) |
| Tìm hiểu cách học, chỗ khó của từng em | Tự đánh giá: chắc / mơ hồ / chưa biết (tab Hồ sơ) |
| Chia nhóm linh hoạt: Cần hỗ trợ / Đạt / Nâng cao | Chuẩn bị vở nháp ghi cách nghĩ, không chỉ đáp số |

### Giai đoạn 2 – Trong mỗi tiết
| Bước | 👩‍🏫 Giáo viên | 🧑‍🎓 Học sinh |
|---|---|---|
| Mở đầu | 1–2 câu chẩn đoán | Nói rõ chỗ chưa chắc |
| Hình thành kiến thức | Hỏi gợi mở, không giảng hết | Tự tìm ra quy tắc |
| Luyện tập | Phiếu 3 mức (nút **📄**) | Làm mức vừa sức, xong lên mức tiếp (**⬆️ Khó hơn**) |
| Phản hồi | Khen trước, chỉ rõ dòng sai, vì sao | Sửa ngay, ghi **📒 Sổ lỗi sai** |
| Chốt bài | 🔑 Điểm mấu chốt | **✍️ Tự viết điểm mấu chốt** |

### Giai đoạn 3 – Sau tiết học
- **Giáo viên:** cập nhật nhóm, thiết kế tiết sau dựa trên lỗi vừa phát hiện (nút **🔍 Lỗi sai thường gặp**).
- **Học sinh:** làm lại bài sai, xem lại Sổ lỗi, bấm **🔍 Nhờ gia sư phân tích sổ lỗi**.

> 💡 Không cần áp dụng hết ngay. Tuần đầu chỉ cần: **khảo sát đầu vào** và **chốt Điểm mấu chốt cuối tiết**.`;
    body.innerHTML = `<div class="teach-guide">${renderMarkdownWithMath(md)}</div>`;
    footer.innerHTML = `<button class="btn-neo btn-neo-primary" type="button" data-act="close">Đã hiểu</button>`;
  }

  // ---------- Móc nối với chatbot ----------
  function onRoleChange(role) {
    const m = role && role.id.match(/^toan6_c(\d)$/);
    if (m) {
      const ch = parseInt(m[1], 10);
      if (ch !== profile.chapter) {
        profile.chapter = ch;
        active = []; activeMode = null;
        saveProfile();
      }
    }
    renderChips();
  }

  function onClearChat() {
    active = [];
    activeMode = null;
    renderChips();
  }

  function init() {
    ensureModal();
    renderChips();
  }

  window.TEACH = {
    getContext,
    resolveExercise,
    stripMarkers,
    captureFromReply,
    simulateReply,
    onRoleChange,
    onClearChat,
    openModal,
    renderChips,
    hasLiveApi
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
