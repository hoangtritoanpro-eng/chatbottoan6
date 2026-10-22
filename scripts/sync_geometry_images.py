import os
import re
import urllib.request
import unicodedata
import json
import time

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def slugify(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def title_to_slug(title):
    t = re.sub(r'^\*\*|\*\*$', '', title).strip().rstrip(':')
    t = re.sub(r'(\d+)\.(\d+)', r'\1-\2', t)
    slug = slugify(t)
    return f"https://vietjack.com/toan-6-ket-noi/{slug}-ket-noi-tri-thuc.jsp"

def download_file(url, dest_dirs):
    filename = os.path.basename(url.split('?')[0])
    # Don't download formula fragments that start with a-bai... if they are small fractions unless needed
    downloaded = False
    for d in dest_dirs:
        os.makedirs(d, exist_ok=True)
        dest_path = os.path.join(d, filename)
        if not os.path.exists(dest_path):
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as r:
                    content = r.read()
                    with open(dest_path, 'wb') as f:
                        f.write(content)
                    downloaded = True
            except Exception as e:
                print(f"    Download error {url}: {e}")
                return None
    return filename

def process_chapter(ch):
    fpath = f'data/toan6/de_bai_loi_giai_chuong_{ch}.md'
    with open(fpath, 'r', encoding='utf-8') as f:
        md_text = f.read()

    header_re = re.compile(
        r'^\*\*(Bài\s+[\d\.]+|Luyện\s*tập(?:\s+\d+)?|Câu\s*hỏi(?:\s+\d+)?|Vận\s*dụng(?:\s+\d+)?|Thử\s*thách(?:\s+nhỏ)?|Tranh\s*luận)\s*([^:*]+)?:\*\*(.*)',
        re.IGNORECASE
    )

    lines = md_text.split('\n')
    blocks = []
    curr_hdr = None
    curr_lines = []

    for line in lines:
        line_s = line.strip()
        m = header_re.match(line_s)
        if m:
            if curr_hdr:
                blocks.append((curr_hdr, curr_lines))
            curr_hdr = line_s
            curr_lines = []
        elif curr_hdr is not None:
            curr_lines.append(line)
    if curr_hdr:
        blocks.append((curr_hdr, curr_lines))

    print(f"\n================ PROCESSING CHAPTER {ch} ({len(blocks)} exercises) ================")
    
    dest_dirs = [f'data/toan6/images_chuong_{ch}', f'chatbot/data/toan6/images_chuong_{ch}']
    for d in dest_dirs:
        os.makedirs(d, exist_ok=True)

    new_blocks = []
    total_imgs = 0

    for i, (hdr, b_lines) in enumerate(blocks):
        m = header_re.match(hdr)
        label = m.group(1).strip()
        page = m.group(2).strip() if m.group(2) else ""
        clean_title = f"{label} {page}".strip()
        url = title_to_slug(clean_title)

        q_imgs = []
        s_imgs = []

        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                html = resp.read().decode('utf-8', errors='ignore')

            # Isolate main content
            end = html.find('Tham khảo lời giải')
            if end == -1: end = html.find('Các bài học để học tốt')
            if end != -1: html = html[:end]

            m_lg = re.search(r'<(?:p|b|span|div)[^>]*>(?:\s*<[^>]+>)*\s*Lời giải:?', html, re.IGNORECASE)
            if m_lg:
                q_html = html[:m_lg.start()]
                s_html = html[m_lg.start():]
            else:
                q_html = html
                s_html = ""

            def extract_and_download(sub_html):
                srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', sub_html)
                saved = []
                for s in srcs:
                    if 'toan-6-ket-noi/images/' in s and not any(k in s for k in ['toan-lop-6-ket-noi', 'banner', 'ads']):
                        full_s = s
                        if full_s.startswith('../'):
                            full_s = 'https://vietjack.com/' + full_s.replace('../', '')
                        elif not full_s.startswith('http'):
                            full_s = 'https://vietjack.com/toan-6-ket-noi/' + full_s
                        
                        fname = download_file(full_s, dest_dirs)
                        if fname and fname not in saved:
                            saved.append(fname)
                return saved

            q_imgs = extract_and_download(q_html)
            s_imgs = extract_and_download(s_html)

            if q_imgs or s_imgs:
                print(f"[{i+1}/{len(blocks)}] {clean_title} -> Q:{len(q_imgs)}, S:{len(s_imgs)} imgs")
                total_imgs += len(q_imgs) + len(s_imgs)
            else:
                print(f"[{i+1}/{len(blocks)}] {clean_title} -> (no diagrams)")

        except Exception as e:
            print(f"[{i+1}/{len(blocks)}] {clean_title} -> Failed {url.split('/')[-1]}: {e}")

        # Update block lines: replace \not\vdots with downloaded images
        body_text = '\n'.join(b_lines)

        # Replace first \not\vdots with question images
        if q_imgs:
            q_img_md = '\n\n' + '\n\n'.join([f"![Hình vẽ](data/toan6/images_chuong_{ch}/{img})" for img in q_imgs]) + '\n\n'
            if r'\not\vdots' in body_text:
                # Replace first occurrence
                body_text = re.sub(r'^[ \t]*\\not\\vdots[ \t]*\n?', q_img_md, body_text, count=1, flags=re.MULTILINE)
            elif not any(img in body_text for img in q_imgs):
                # Append after question title or first paragraph
                body_text = q_img_md + body_text

        # Replace remaining \not\vdots with solution images
        if s_imgs:
            s_img_md = '\n\n' + '\n\n'.join([f"![Hình vẽ](data/toan6/images_chuong_{ch}/{img})" for img in s_imgs]) + '\n\n'
            if r'\not\vdots' in body_text:
                body_text = re.sub(r'^[ \t]*\\not\\vdots[ \t]*\n?', s_img_md, body_text, flags=re.MULTILINE)
            elif not any(img in body_text for img in s_imgs):
                body_text = body_text + s_img_md

        new_blocks.append((hdr, body_text))
        time.sleep(0.1) # Be polite

    # Write back updated markdown
    out_lines = []
    for hdr, body in new_blocks:
        out_lines.append(hdr)
        out_lines.append("")
        out_lines.append(body.strip())
        out_lines.append("")

    with open(fpath, 'w', encoding='utf-8') as f_out:
        f_out.write('\n'.join(out_lines).strip() + '\n')

    print(f"Finished Chapter {ch}: Downloaded {total_imgs} images, updated {fpath}")

process_chapter(4)
process_chapter(5)
