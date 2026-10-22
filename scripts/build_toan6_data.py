import os
import re
import json

CHAPTER_METAS = {
    1: {'title': 'Chương 1: Tập hợp các số tự nhiên', 'topics': 'Tập hợp, phần tử, thứ tự trong tập số tự nhiên, các phép tính cộng trừ nhân chia, lũy thừa với số mũ tự nhiên, thứ tự thực hiện phép tính'},
    2: {'title': 'Chương 2: Tính chia hết trong tập hợp các số tự nhiên', 'topics': 'Quan hệ chia hết, dấu hiệu chia hết cho 2, 3, 5, 9, số nguyên tố, hợp số, ước chung và bội chung, ƯCLN, BCNN'},
    3: {'title': 'Chương 3: Số nguyên', 'topics': 'Tập hợp các số nguyên, phép cộng trừ nhân chia số nguyên, quy tắc dấu ngoặc, quan hệ chia hết trong tập số nguyên'},
    4: {'title': 'Chương 4: Một số hình phẳng trong thực tiễn', 'topics': 'Tam giác đều, hình vuông, lục giác đều, hình chữ nhật, hình thoi, hình bình hành, hình thang cân, chu vi và diện tích'},
    5: {'title': 'Chương 5: Tính đối xứng của hình phẳng trong tự nhiên', 'topics': 'Hình có trục đối xứng, hình có tâm đối xứng, vai trò của tính đối xứng trong tự nhiên và nghệ thuật'},
    6: {'title': 'Chương 6: Phân số', 'topics': 'Khái niệm phân số, phân số bằng nhau, rút gọn phân số, so sánh phân số, các phép tính cộng trừ nhân chia phân số, hai bài toán về phân số'},
    7: {'title': 'Chương 7: Số thập phân', 'topics': 'Số thập phân, các phép tính với số thập phân, làm tròn số và ước lượng kết quả, tỉ số và tỉ số phần trăm'},
    8: {'title': 'Chương 8: Những hình hình học cơ bản', 'topics': 'Điểm, đường thẳng, ba điểm thẳng hàng, tia, đoạn thẳng, độ dài đoạn thẳng, trung điểm, góc và số đo góc'},
    9: {'title': 'Chương 9: Dữ liệu và xác suất thực nghiệm', 'topics': 'Thu thập và tổ chức dữ liệu, biểu đồ tranh, biểu đồ cột, biểu đồ cột kép, kết quả có thể và xác suất thực nghiệm'}
}

header_re = re.compile(
    r'^\*\*(Bài\s+[\d\.]+|Luyện\s*tập(?:\s+\d+)?|Câu\s*hỏi(?:\s+\d+)?|Vận\s*dụng(?:\s+\d+)?|Thử\s*thách(?:\s+nhỏ)?|Tranh\s*luận)\s*([^:*]+)?:\*\*(.*)',
    re.IGNORECASE
)

SOL_STARTER_RES = [
    re.compile(r'^(?:chu vi|diện tích|độ dài|chiều dài|chiều rộng|chiều cao|số điểm|số tiền|số cây|số học sinh|số viên|nhiệt độ|số phần|tổng số|kết quả|thương|tích|ước|bội)\s+.*(?:là|bằng)\s*:', re.IGNORECASE),
    re.compile(r'^(?:chu vi|diện tích|độ dài|chiều dài|chiều rộng|chiều cao)\s+.*(?:là|bằng)\s*[\d\=]', re.IGNORECASE),
    re.compile(r'^(?:ta có|ta thấy|ta nhận thấy|ta hiểu|ta được|dễ thấy|theo em|theo đề bài|theo giả thiết|giả sử)\b', re.IGNORECASE),
    re.compile(r'^(?:vì|do đó|vậy|nên)\s+.*(?:nên|thì|=|là|<|>|\:)', re.IGNORECASE),
    re.compile(r'^(?:dựa vào|quan sát)\s+(?:trục số|hình vẽ|bảng|đồ thị|hình)', re.IGNORECASE),
    re.compile(r'^(?:đổi\s+\d+|bước\s*\d+|cách\s*\d+|trường hợp\s*\d+)\b', re.IGNORECASE),
    re.compile(r'^(?:thay\s+[a-z]\s*=|lần lượt nhân|phác họa|vẽ hình\s+.*theo hướng dẫn|vẽ tam giác|cắt như hình|gập \d+ hình)', re.IGNORECASE),
    re.compile(r'^\*\s*(?:cách\s*\d+|tìm các ước|tính)\s*:', re.IGNORECASE),
    re.compile(r'^\+\)\s*.*(?:là\s*:|bằng\s*:|=)', re.IGNORECASE),
    re.compile(r'^\d+\s*[\.\+\-\*\/]\s*\d+\s*=', re.IGNORECASE),
    re.compile(r'^[a-d]\)\s*.*(?:là\s*:|bằng\s*:|=)', re.IGNORECASE),
    re.compile(r'^\d+\.\s*.*(?:là\s*:|bằng\s*:|=)', re.IGNORECASE),
]

def clean_text(s, ch):
    if not s:
        return ''
    cleaned = re.sub(r'^[ \t]*\\not\\vdots[ \t]*\n?', '*(Hình vẽ minh họa trong SGK)*\n\n', s, flags=re.MULTILINE)
    cleaned = re.sub(r'!\[(.*?)\]\((images_chuong_\d+/[^)]+)\)', r'![\1](data/toan6/\2)', cleaned)
    cleaned = re.sub(r'\[\[IMG:(.*?)\]\]', rf'![Hình vẽ](data/toan6/images_chuong_{ch}/\1)', cleaned)
    cleaned = re.sub(r'\*\*(\d+)\.\*\*', r'\1. ', cleaned)
    cleaned = re.sub(r'\*\*([a-d])\)\*\*', r'\1) ', cleaned)
    cleaned = re.sub(r'\*\*(\d+)\)\*\*', r'\1) ', cleaned)
    cleaned = re.sub(r'\*\*(\d+)\*\*', r'\1. ', cleaned)
    return cleaned.strip()

def is_sol_line(line):
    l = line.strip()
    if not l:
        return False
    return any(r.search(l) for r in SOL_STARTER_RES)

def split_question_solution(curr_title, inline_q, full_content, ch):
    cleaned = clean_text(full_content, ch)
    inline_q_clean = clean_text(inline_q, ch)

    # 1. Tách nếu có nhãn "Lời giải"
    parts = re.split(r'\n\*\*Lời giải:?\*\*|\nLời giải:?|\*\*Lời giải:?\*\*|Lời giải:', cleaned, maxsplit=1)
    if len(parts) > 1 and parts[1].strip():
        q_before = parts[0].strip()
        sol_text = parts[1].strip()
        if q_before:
            if inline_q_clean:
                q_text = f"{inline_q_clean}\n\n{q_before}"
            else:
                q_text = q_before
        else:
            q_text = inline_q_clean or curr_title
        return q_text, sol_text, cleaned

    # 2. Không có nhãn "Lời giải" (Chương 3, 4, một số bài)
    paragraphs = [p.strip() for p in cleaned.split('\n\n') if p.strip()]

    if not paragraphs:
        return inline_q_clean or curr_title, "", cleaned

    seen_nums = set()
    seen_letters = set()

    # Thu thập số / chữ từ inline_q nếu có
    if inline_q_clean:
        for m_n in re.finditer(r'(?:^|\n)(\d+)\.\s*(?:([a-d])\))?', inline_q_clean):
            seen_nums.add(m_n.group(1))
            if m_n.group(2): seen_letters.add(m_n.group(2))
        for m_l in re.finditer(r'(?:^|\n)([a-d])\)', inline_q_clean):
            seen_letters.add(m_l.group(1))

    sol_idx = -1
    for idx, p in enumerate(paragraphs):
        fl = p.splitlines()[0].strip()
        # Bỏ qua dòng tiêu đề lặp lại ở đầu
        if idx == 0 and fl.startswith('**') and 'trang' in fl.lower():
            continue

        m_num = re.match(r'^(\d+)\.\s*(?:([a-d])\))?', fl)
        m_let = re.match(r'^([a-d])\)', fl)

        # Lặp lại số thứ tự (ví dụ: '1.' hoặc 'a)' xuất hiện lần thứ 2) -> điểm bắt đầu lời giải
        if m_num:
            num = m_num.group(1)
            letter = m_num.group(2)
            if num in seen_nums:
                sol_idx = idx
                break
            seen_nums.add(num)
            if letter:
                if letter in seen_letters:
                    sol_idx = idx
                    break
                seen_letters.add(letter)
        elif m_let:
            letter = m_let.group(1)
            if letter in seen_letters:
                sol_idx = idx
                break
            seen_letters.add(letter)

        # Khớp mẫu mở đầu lời giải
        if is_sol_line(fl):
            if inline_q_clean or idx > 0:
                sol_idx = idx
                break

    if sol_idx >= 0:
        q_parts = []
        if inline_q_clean:
            q_parts.append(inline_q_clean)
        if sol_idx > 0:
            q_parts.extend(paragraphs[:sol_idx])
        q_text = '\n\n'.join(q_parts).strip() or inline_q_clean or curr_title
        sol_text = '\n\n'.join(paragraphs[sol_idx:]).strip()
        return q_text, sol_text, cleaned

    # Nếu có inline_q_clean mà không có ranh giới rõ ràng trong body:
    if inline_q_clean:
        p0 = paragraphs[0]
        if is_sol_line(p0.splitlines()[0]) or (p0.startswith('*(Hình vẽ') and len(paragraphs) > 1 and is_sol_line(paragraphs[1].splitlines()[0])):
            q_text = inline_q_clean
            sol_text = '\n\n'.join(paragraphs).strip()
            return q_text, sol_text, cleaned

        if p0.startswith('*(Hình vẽ') or re.match(r'^[a-d]\)', p0):
            q_text = f"{inline_q_clean}\n\n{p0}"
            sol_text = '\n\n'.join(paragraphs[1:]).strip() if len(paragraphs) > 1 else ""
            return q_text, sol_text, cleaned
        else:
            q_text = inline_q_clean
            sol_text = '\n\n'.join(paragraphs).strip()
            return q_text, sol_text, cleaned

    # Fallback khi KHÔNG có inline_q: đoạn đầu là đề bài, phần còn lại là lời giải
    q_text = paragraphs[0]
    sol_text = '\n\n'.join(paragraphs[1:]).strip() if len(paragraphs) > 1 else cleaned
    return q_text, sol_text, cleaned


chapters_data = []
all_exercises = []
index_summary = []

for ch in range(1, 10):
    fpath = f'data/toan6/de_bai_loi_giai_chuong_{ch}.md'
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = content.split('\n')

    ex_list = []
    curr_title = None
    curr_inline_q = None
    curr_body = []

    for line in lines:
        line_s = line.strip()
        m = header_re.match(line_s)
        if m:
            if curr_title and (curr_body or curr_inline_q):
                full_c = '\n'.join(curr_body).strip()
                q_text, sol_text, clean_c = split_question_solution(curr_title, curr_inline_q, full_c, ch)
                code_m = re.search(r'Bài\s+(\d+\.\d+)', curr_title, re.IGNORECASE)
                code = code_m.group(1) if code_m else ''

                ex_obj = {
                    'chapter': ch,
                    'title': curr_title,
                    'code': code,
                    'question': q_text,
                    'solution': sol_text,
                    'content': clean_c
                }
                ex_list.append(ex_obj)
                all_exercises.append(ex_obj)

            label = m.group(1).strip()
            page = m.group(2).strip() if m.group(2) else ""
            curr_title = f"**{label} {page}:**".replace('  ', ' ')
            curr_inline_q = m.group(3).strip() if m.group(3) else ""
            curr_body = []
        elif curr_title is not None:
            curr_body.append(line)

    if curr_title and (curr_body or curr_inline_q):
        full_c = '\n'.join(curr_body).strip()
        q_text, sol_text, clean_c = split_question_solution(curr_title, curr_inline_q, full_c, ch)
        code_m = re.search(r'Bài\s+(\d+\.\d+)', curr_title, re.IGNORECASE)
        code = code_m.group(1) if code_m else ''
        ex_obj = {
            'chapter': ch,
            'title': curr_title,
            'code': code,
            'question': q_text,
            'solution': sol_text,
            'content': clean_c
        }
        ex_list.append(ex_obj)
        all_exercises.append(ex_obj)

    meta = CHAPTER_METAS.get(ch, {'title': f'Chương {ch}', 'topics': ''})
    ch_info = {
        'chapter': ch,
        'title': meta['title'],
        'topics': meta['topics'],
        'file': f'de_bai_loi_giai_chuong_{ch}.md',
        'total_exercises': len(ex_list),
        'sample_items': ex_list
    }
    chapters_data.append(ch_info)

    index_summary.append({
        'chapter': ch,
        'title': meta['title'],
        'topics': meta['topics'],
        'exercise_count': len(ex_list),
        'sample_exercises': [ex['title'] for ex in ex_list[:3]]
    })

print(f'Total exercises processed: {len(all_exercises)}')

# 1. Ghi chatbot/toan6_data.js
js_content = '// Multi-Persona AI Chatbot - Dữ liệu đầy đủ Toán 6 SGK Kết Nối Tri Thức (9 Chương)\n'
js_content += 'window.TOAN6_DATA = ' + json.dumps(chapters_data, ensure_ascii=False) + ';\n\n'
js_content += 'window.TOAN6_ALL_EXERCISES = (window.TOAN6_DATA || []).flatMap(function(c) { return c.sample_items || []; });\n'

with open('chatbot/toan6_data.js', 'w', encoding='utf-8') as out_f:
    out_f.write(js_content)

# 2. Ghi toan6_index.json (cả data/toan6 và chatbot/data/toan6)
for target_dir in ['data/toan6', 'chatbot/data/toan6']:
    os.makedirs(target_dir, exist_ok=True)
    idx_path = os.path.join(target_dir, 'toan6_index.json')
    with open(idx_path, 'w', encoding='utf-8') as f:
        json.dump(index_summary, f, ensure_ascii=False, indent=2)

size_kb = os.path.getsize('chatbot/toan6_data.js') / 1024
print(f'Successfully generated chatbot/toan6_data.js ({size_kb:.1f} KB) and toan6_index.json')
