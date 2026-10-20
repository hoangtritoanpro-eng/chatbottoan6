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
    8: {'title': 'Chương 8: Những hình học cơ bản', 'topics': 'Điểm, đường thẳng, ba điểm thẳng hàng, tia, đoạn thẳng, độ dài đoạn thẳng, trung điểm, góc và số đo góc'},
    9: {'title': 'Chương 9: Dữ liệu và xác suất thực nghiệm', 'topics': 'Thu thập và tổ chức dữ liệu, biểu đồ tranh, biểu đồ cột, biểu đồ cột kép, kết quả có thể và xác suất thực nghiệm'}
}

header_re = re.compile(r'^\*\*(Bài\s+[\d\.]+|Luyện\s*tập(?:\s+\d+)?|Câu\s*hỏi(?:\s+\d+)?|Vận\s*dụng(?:\s+\d+)?|Thử\s*thách(?:\s+nhỏ)?|Tranh\s*luận)\s*([^:*]+)?:\*\*(.*)', re.IGNORECASE)

chapters_data = []
all_exercises = []

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
                full_content = '\n'.join(curr_body).strip()
                parts = re.split(r'\n\*\*Lời giải:?\*\*|\nLời giải:?', full_content, maxsplit=1)
                q_text = parts[0].strip()
                sol_text = parts[1].strip() if len(parts) > 1 else ''
                code_m = re.search(r'Bài\s+(\d+\.\d+)', curr_title, re.IGNORECASE)
                code = code_m.group(1) if code_m else ''
                
                ex_obj = {
                    'chapter': ch,
                    'title': curr_title,
                    'code': code,
                    'question': q_text,
                    'solution': sol_text,
                    'content': full_content
                }
                ex_list.append(ex_obj)
                all_exercises.append(ex_obj)
                
            curr_title = line_s
            curr_body = [line]
        elif curr_title is not None:
            curr_body.append(line)
            
    if curr_title and curr_body:
        full_content = '\n'.join(curr_body).strip()
        parts = re.split(r'\n\*\*Lời giải:?\*\*|\nLời giải:?', full_content, maxsplit=1)
        q_text = parts[0].strip()
        sol_text = parts[1].strip() if len(parts) > 1 else ''
        code_m = re.search(r'Bài\s+(\d+\.\d+)', curr_title, re.IGNORECASE)
        code = code_m.group(1) if code_m else ''
        ex_obj = {
            'chapter': ch,
            'title': curr_title,
            'code': code,
            'question': q_text,
            'solution': sol_text,
            'content': full_content
        }
        ex_list.append(ex_obj)
        all_exercises.append(ex_obj)
        
    meta = CHAPTER_METAS.get(ch, {'title': f'Chương {ch}', 'topics': ''})
    chapters_data.append({
        'chapter': ch,
        'title': meta['title'],
        'topics': meta['topics'],
        'file': f'de_bai_loi_giai_chuong_{ch}.md',
        'total_exercises': len(ex_list),
        'sample_items': ex_list
    })

print(f'Total exercises processed: {len(all_exercises)}')

js_content = '// Multi-Persona AI Chatbot - Dữ liệu đầy đủ Toán 6 SGK Kết Nối Tri Thức (9 Chương)\n'
js_content += 'window.TOAN6_DATA = ' + json.dumps(chapters_data, ensure_ascii=False) + ';\n\n'
js_content += 'window.TOAN6_ALL_EXERCISES = ' + json.dumps(all_exercises, ensure_ascii=False) + ';\n'

with open('chatbot/toan6_data.js', 'w', encoding='utf-8') as out_f:
    out_f.write(js_content)

size_kb = os.path.getsize('chatbot/toan6_data.js') / 1024
print(f'Successfully generated chatbot/toan6_data.js ({size_kb:.1f} KB)')
