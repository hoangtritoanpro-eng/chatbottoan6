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

def split_question_solution(curr_title, full_content, ch):
    # Dọn dẹp lỗi \not\vdots từ nguồn cào web cũ, thay bằng chú thích hình vẽ
    cleaned = re.sub(r'^[ \t]*\\not\\vdots[ \t]*\n?', '*(Hình vẽ minh họa trong SGK)*\n\n', full_content, flags=re.MULTILINE)

    # Đảm bảo đường dẫn ảnh trỏ đúng data/toan6/images_chuong_...
    cleaned = re.sub(r'!\[(.*?)\]\((images_chuong_\d+/[^)]+)\)', r'![\1](data/toan6/\2)', cleaned)
    cleaned = re.sub(r'\[\[IMG:(.*?)\]\]', rf'![Hình vẽ](data/toan6/images_chuong_{ch}/\1)', cleaned)

    # Dọn dẹp các dấu ** dính liền vào số thứ tự và chữ (ví dụ: **1.**a) -> 1. a), **2.** -> 2.)
    cleaned = re.sub(r'\*\*(\d+)\.\*\*', r'\1. ', cleaned)
    cleaned = re.sub(r'\*\*([a-d])\)\*\*', r'\1) ', cleaned)
    cleaned = re.sub(r'\*\*(\d+)\)\*\*', r'\1) ', cleaned)
    cleaned = re.sub(r'\*\*(\d+)\*\*', r'\1. ', cleaned)

    # 1. Tách nếu có nhãn "Lời giải"
    parts = re.split(r'\n\*\*Lời giải:?\*\*|\nLời giải:?|\*\*Lời giải:?\*\*|Lời giải:', cleaned, maxsplit=1)
    if len(parts) > 1 and parts[1].strip():
        q_text = parts[0].strip() or curr_title
        sol_text = parts[1].strip()
        return q_text, sol_text, cleaned

    # 2. Không có nhãn "Lời giải" (Chương 3, 4, một số bài Chương 5)
    paragraphs = [p.strip() for p in cleaned.split('\n\n') if p.strip()]
    if len(paragraphs) <= 1:
        return curr_title, cleaned, cleaned

    seen_nums = set()
    seen_letters = set()
    sol_idx = -1

    for idx, p in enumerate(paragraphs):
        fl = p.splitlines()[0].strip()
        # Bỏ qua nếu dòng đầu là tiêu đề bài trùng lặp
        if idx == 0 and fl.startswith('**') and 'trang' in fl.lower():
            continue

        m_num = re.match(r'^(\d+)\.\s*(?:([a-d])\))?', fl)
        m_let = re.match(r'^([a-d])\)', fl)

        if m_num:
            num = m_num.group(1)
            letter = m_num.group(2)
            if num in seen_nums:
                sol_idx = idx
                break
            seen_nums.add(num)
            if letter:
                seen_letters.add(letter)
        elif m_let:
            letter = m_let.group(1)
            if letter in seen_letters:
                sol_idx = idx
                break
            seen_letters.add(letter)

        p_lower = fl.lower()
        sol_starters = (
            'ta có', 'vì ', 'do đó', 'vậy ', 'dựa vào', 'đặc điểm chung',
            'một số ', 'bước 1', 'nhiệt độ ', 'các tam giác', '+)', 'biểu diễn ',
            'khi được hỏi', 'theo em', 'học sinh ', 'có nhiều cách', 'vẽ tam giác',
            'vẽ hình', 'cắt như hình', 'gập 3 hình', 'dưới đây là', 'sắp xếp ',
            '1. số dương', 'thay dấu', 'rút gọn', 'đổi 1 giờ', 'sau 10 phút',
            'từ hoạt động', 'trục đối xứng', 'khi đặt thước', 'nhận thấy', 'giả sử',
            'ba số ', 'số dương'
        )
        if any(p_lower.startswith(s) for s in sol_starters) and idx > 0:
            sol_idx = idx
            break

    if sol_idx > 0:
        q_text = '\n\n'.join(paragraphs[:sol_idx]).strip()
        sol_text = '\n\n'.join(paragraphs[sol_idx:]).strip()
        return q_text, sol_text, cleaned

    # Fallback an toàn: đoạn đầu là đề bài, phần còn lại là lời giải
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
    curr_body = []

    for line in lines:
        line_s = line.strip()
        m = header_re.match(line_s)
        if m:
            if curr_title and curr_body:
                full_c = '\n'.join(curr_body).strip()
                q_text, sol_text, clean_c = split_question_solution(curr_title, full_c, ch)
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

            curr_title = m.group(0).strip()
            rest = line_s[m.end():].strip()
            curr_body = [rest] if rest else []
        elif curr_title is not None:
            curr_body.append(line)

    if curr_title and curr_body:
        full_c = '\n'.join(curr_body).strip()
        q_text, sol_text, clean_c = split_question_solution(curr_title, full_c, ch)
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
