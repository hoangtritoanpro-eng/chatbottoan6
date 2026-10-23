# -*- coding: utf-8 -*-
"""
Script to fix all powers/exponents formatting across Toán 6 data files:
- data/toan6/de_bai_loi_giai_chuong_1.md
- data/toan6/de_bai_loi_giai_chuong_2.md
- Syncs to chatbot/data/toan6/
- Rebuilds chatbot/toan6_data.js and toan6_index.json
"""
import os
import shutil
import re

def fix_chapter_1():
    p = 'data/toan6/de_bai_loi_giai_chuong_1.md'
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Hoạt động 2 trang 23
    text = text.replace(
        '72.73 = (7 . 7) . (7 . 7 . 7) = ?',
        '$7^2 \\cdot 7^3 = (7 \\cdot 7) \\cdot (7 \\cdot 7 \\cdot 7) = ?$'
    )
    text = text.replace(
        'a)72.73 = (7.7).(7.7.7) = 7.7.7.7.7 = 75',
        'a) $7^2 \\cdot 7^3 = (7 \\cdot 7) \\cdot (7 \\cdot 7 \\cdot 7) = 7 \\cdot 7 \\cdot 7 \\cdot 7 \\cdot 7 = 7^5$'
    )

    # 2. Luyện tập 1 trang 23
    text = text.replace(
'''| a | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| a2 | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? |''',
'''| $a$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| $a^2$ | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? |'''
    )
    # in case table header separators exist
    text = re.sub(
        r'\|\s*a\s*\|\s*1\s*\|\s*2\s*\|\s*3\s*\|\s*4\s*\|\s*5\s*\|\s*6\s*\|\s*7\s*\|\s*8\s*\|\s*9\s*\|\s*10\s*\|\n\|\s*---\s*.*?\n\|\s*a2\s*\|',
        '| $a$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |\n| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n| $a^2$ |',
        text
    )
    text = text.replace('+) Với a = 1 thì a2 = 12 = 1.1 = 1', '+) Với $a = 1$ thì $a^2 = 1^2 = 1 \\cdot 1 = 1$')
    text = text.replace('+) Với a = 2 thì a2 = 22 = 2.2 = 4', '+) Với $a = 2$ thì $a^2 = 2^2 = 2 \\cdot 2 = 4$')
    text = text.replace('+) Với a = 3 thì a2 = 32 = 3.3 = 9', '+) Với $a = 3$ thì $a^2 = 3^2 = 3 \\cdot 3 = 9$')
    text = text.replace('+) Với a = 4 thì a2 = 42 = 4.4 = 16', '+) Với $a = 4$ thì $a^2 = 4^2 = 4 \\cdot 4 = 16$')
    text = text.replace('+) Với a = 5 thì a2 = 52 = 5.5 = 25', '+) Với $a = 5$ thì $a^2 = 5^2 = 5 \\cdot 5 = 25$')
    text = text.replace('+) Với a = 6 thì a2 = 62 = 6.6 = 36', '+) Với $a = 6$ thì $a^2 = 6^2 = 6 \\cdot 6 = 36$')
    text = text.replace('+) Với a = 7 thì a2 = 72 = 7.7 = 49', '+) Với $a = 7$ thì $a^2 = 7^2 = 7 \\cdot 7 = 49$')
    text = text.replace('+) Với a = 8 thì a2 = 82 = 8.8 = 64', '+) Với $a = 8$ thì $a^2 = 8^2 = 8 \\cdot 8 = 64$')
    text = text.replace('+) Với a = 9 thì a2 = 92 = 9.9 = 81', '+) Với $a = 9$ thì $a^2 = 9^2 = 9 \\cdot 9 = 81$')
    text = text.replace('+) Với a = 10 thì a2 = 102 = 10.10 = 100', '+) Với $a = 10$ thì $a^2 = 10^2 = 10 \\cdot 10 = 100$')
    text = re.sub(
        r'\|\s*a\s*\|\s*1\s*\|\s*2\s*\|\s*3\s*\|\s*4\s*\|\s*5\s*\|\s*6\s*\|\s*7\s*\|\s*8\s*\|\s*9\s*\|\s*10\s*\|\n\|\s*---\s*.*?\n\|\s*a2\s*\|\s*1\s*\|\s*4\s*\|\s*9\s*\|\s*16\s*\|\s*25\s*\|\s*36\s*\|\s*49\s*\|\s*64\s*\|\s*81\s*\|\s*100\s*\|',
        '| $a$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |\n| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n| $a^2$ | 1 | 4 | 9 | 16 | 25 | 36 | 49 | 64 | 81 | 100 |',
        text
    )

    # 3. Luyện tập 2 trang 23
    text = text.replace('a) 53 . 57', 'a) $5^3 \\cdot 5^7$')
    text = text.replace('b) 24 . 25 . 29', 'b) $2^4 \\cdot 2^5 \\cdot 2^9$')
    text = text.replace('c) 102 . 104 . 106 . 108', 'c) $10^2 \\cdot 10^4 \\cdot 10^6 \\cdot 10^8$')
    text = text.replace('a) 53 . 57 = 53 + 7 = 510', 'a) $5^3 \\cdot 5^7 = 5^{3 + 7} = 5^{10}$')
    text = text.replace('b) 24 . 25 . 29 = 24 + 5 + 9 = 218', 'b) $2^4 \\cdot 2^5 \\cdot 2^9 = 2^{4 + 5 + 9} = 2^{18}$')
    text = text.replace('c) 102 . 104 . 106 . 108 = 102 + 4 + 6 + 8  = 1020', 'c) $10^2 \\cdot 10^4 \\cdot 10^6 \\cdot 10^8 = 10^{2 + 4 + 6 + 8} = 10^{20}$')

    # 4. Vận dụng trang 23
    text = text.replace('4 257 = 4 . 103 + 2. 102 + 5 . 10 + 7.', '$4\\,257 = 4 \\cdot 10^3 + 2 \\cdot 10^2 + 5 \\cdot 10 + 7$.')
    text = text.replace('2 . 2 . 2 . 2 . 2 . 2 = 26 = 64 (hạt thóc)', '$2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 = 2^6 = 64$ (hạt thóc)')
    text = text.replace('a) 23 197 = 2 . 104 + 3 . 103 + 1 . 102 + 9 . 10 + 7.', 'a) $23\\,917 = 2 \\cdot 10^4 + 3 \\cdot 10^3 + 9 \\cdot 10^2 + 1 \\cdot 10 + 7$.')
    text = text.replace('b) 203 184 = 2 . 105 + 0 . 104 + 3 . 103 + 1 . 102 + 8 . 10 + 4.', 'b) $203\\,184 = 2 \\cdot 10^5 + 0 \\cdot 10^4 + 3 \\cdot 10^3 + 1 \\cdot 10^2 + 8 \\cdot 10 + 4$.')

    # 5. Hoạt động 3 trang 24
    text = text.replace('a) Giải thích vì sao có thể viết 65 = 63 . 62', 'a) Giải thích vì sao có thể viết $6^5 = 6^3 \\cdot 6^2$')
    text = text.replace('b) Sử dụng câu a) để suy ra 65 : 63 = 62.', 'b) Sử dụng câu a) để suy ra $6^5 : 6^3 = 6^2$.')
    text = text.replace('c) Viết thương của phép chia 107 : 104 dưới dạng lũy thừa của 10.', 'c) Viết thương của phép chia $10^7 : 10^4$ dưới dạng lũy thừa của 10.')
    text = text.replace('a) Ta có: 63 . 62 = 63 + 2 = 65 nên có thể viết 65 = 63 . 62', 'a) Ta có: $6^3 \\cdot 6^2 = 6^{3 + 2} = 6^5$ nên có thể viết $6^5 = 6^3 \\cdot 6^2$')
    text = text.replace('b) Ta có 65 = 63 . 62 nên 65 : 63 = 62', 'b) Ta có $6^5 = 6^3 \\cdot 6^2$ nên $6^5 : 6^3 = 6^2$')
    text = text.replace('c) Ta nhận thấy 107 = 104 + 3 = 104 . 103 nên 107 : 104 = 103', 'c) Ta nhận thấy $10^7 = 10^{4 + 3} = 10^4 \\cdot 10^3$ nên $10^7 : 10^4 = 10^3$')

    # 6. Luyện tập 3 trang 24
    text = text.replace('a)   76 : 74', 'a) $7^6 : 7^4$')
    text = text.replace('b)  1091100 : 1091100', 'b) $109^{100} : 109^{100}$')
    text = text.replace('a) 76 : 74= 76-4= 72.', 'a) $7^6 : 7^4 = 7^{6 - 4} = 7^2$.')
    text = text.replace('b) 1091100 : 1091100=1091100 - 100 = 1090 = 1 = 11', 'b) $109^{100} : 109^{100} = 109^{100 - 100} = 109^0 = 1$.')

    # 7. Bài 1.36 trang 24
    text = text.replace('a) 9 . 9 . 9 . 9 . 9 = 95', 'a) $9 \\cdot 9 \\cdot 9 \\cdot 9 \\cdot 9 = 9^5$')
    text = text.replace('b) 10 . 10 . 10 . 10 = 104', 'b) $10 \\cdot 10 \\cdot 10 \\cdot 10 = 10^4$')
    text = text.replace('c) 5 . 5 . 5 . 25 = 5 . 5 . 5 . 5 . 5 = 55', 'c) $5 \\cdot 5 \\cdot 5 \\cdot 25 = 5 \\cdot 5 \\cdot 5 \\cdot 5 \\cdot 5 = 5^5$')
    text = text.replace('d) a . a . a . a . a . a = a6', 'd) $a \\cdot a \\cdot a \\cdot a \\cdot a \\cdot a = a^6$')

    # 8. Bài 1.37 trang 24
    old_table_1_37 = '''|  |  |  |  |
| --- | --- | --- | --- |
| Lũy thừa | Cơ số | Số mũ | Giá trị của lũy thừa |
| 43 | ? | ? | ? |
| ? | 3 | 5 | ? |
| ? | 2 | ? | 128 |'''

    new_table_1_37 = '''| Lũy thừa | Cơ số | Số mũ | Giá trị của lũy thừa |
| :---: | :---: | :---: | :---: |
| $4^3$ | ? | ? | ? |
| ? | 3 | 5 | ? |
| ? | 2 | ? | 128 |'''
    text = text.replace(old_table_1_37, new_table_1_37)

    text = text.replace('+) Ta có 43 là lũy thừa với cơ số là 4 và số mũ là 3', '+) Ta có $4^3$ là lũy thừa với cơ số là 4 và số mũ là 3:')
    text = text.replace('43 = 4 . 4 . \xa04 = 16 . 4 = 64', '$4^3 = 4 \\cdot 4 \\cdot 4 = 16 \\cdot 4 = 64$')
    text = text.replace('43 = 4 . 4 .  4 = 16 . 4 = 64', '$4^3 = 4 \\cdot 4 \\cdot 4 = 16 \\cdot 4 = 64$')
    text = text.replace('+) Cơ số là 3, số mũ là 5 ta có lũy thừa là 35', '+) Cơ số là 3, số mũ là 5 ta có lũy thừa là $3^5$:')
    text = text.replace('35 = 3 . 3 . 3 . 3 . 3 = 9 . 3 . 3 . 3 = 27 . 3 . 3 = 81 . 3 = 243', '$3^5 = 3 \\cdot 3 \\cdot 3 \\cdot 3 \\cdot 3 = 9 \\cdot 3 \\cdot 3 \\cdot 3 = 27 \\cdot 3 \\cdot 3 = 81 \\cdot 3 = 243$')
    text = text.replace('128 = 2 . 2 . 2 . 2 . 2 . 2 . 2 = 27', '$128 = 2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 = 2^7$')

    old_sol_table_1_37 = '''|  |  |  |  |
| --- | --- | --- | --- |
| Lũy thừa | Cơ số | Số mũ | Giá trị của lũy thừa |
| 43 | **4** | **3** | **64** |
| 35 | 3 | 5 | **243** |
| 27 | 2 | **7** | 128 |'''

    new_sol_table_1_37 = '''| Lũy thừa | Cơ số | Số mũ | Giá trị của lũy thừa |
| :---: | :---: | :---: | :---: |
| $4^3$ | **4** | **3** | **64** |
| $3^5$ | 3 | 5 | **243** |
| $2^7$ | 2 | **7** | 128 |'''
    text = text.replace(old_sol_table_1_37, new_sol_table_1_37)

    # 9. Bài 1.38 trang 24
    old_1_38 = '''**Bài 1.38 trang 24 Toán lớp 6 Tập 1:**

Tính: a) 25

b) 33

c) 52

d) 109

**Lời giải:**

a) 25= 2.2.2.2.2 = 4.2.2.2 = 8.2.2 = 16.2 = 32

b) 33 = 3.3.3 = 9.3 = 27

c) 52 = 5 . 5 = 25.

d) 109 = 10.10.10.10.10.10.10.10.10 = 1 000 000 000.'''

    new_1_38 = '''**Bài 1.38 trang 24 Toán lớp 6 Tập 1:**

Tính: 
a) $2^5$

b) $3^3$

c) $5^2$

d) $10^9$

**Lời giải:**

a) $2^5 = 2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 = 4 \\cdot 2 \\cdot 2 \\cdot 2 = 8 \\cdot 2 \\cdot 2 = 16 \\cdot 2 = 32$

b) $3^3 = 3 \\cdot 3 \\cdot 3 = 9 \\cdot 3 = 27$

c) $5^2 = 5 \\cdot 5 = 25$

d) $10^9 = 10 \\cdot 10 \\cdot 10 \\cdot 10 \\cdot 10 \\cdot 10 \\cdot 10 \\cdot 10 \\cdot 10 = 1\\,000\\,000\\,000$'''
    text = text.replace(old_1_38, new_1_38)

    # 10. Bài 1.39 trang 24
    text = text.replace('+) 215 = 2. 102+ 1. 101+ 5', '+) $215 = 2 \\cdot 10^2 + 1 \\cdot 10^1 + 5$')
    text = text.replace('+) 902 = 9. 102+ 0. 101+ 2', '+) $902 = 9 \\cdot 10^2 + 0 \\cdot 10^1 + 2$')
    text = text.replace('+) 2 020 = 2. 103+ 0. 102+ 2. 101+ 0', '+) $2\\,020 = 2 \\cdot 10^3 + 0 \\cdot 10^2 + 2 \\cdot 10^1 + 0$')
    text = text.replace('+) 883 001 = 8. 105+ 8. 104+ 3. 103+ 0. 102+ 0. 101+ 1', '+) $883\\,001 = 8 \\cdot 10^5 + 8 \\cdot 10^4 + 3 \\cdot 10^3 + 0 \\cdot 10^2 + 0 \\cdot 10^1 + 1$')

    # 11. Bài 1.40 trang 24
    text = text.replace('Tính 112,1112. Từ đó hãy dự đoán kết quả của 11112.', 'Tính $11^2, 111^2$. Từ đó hãy dự đoán kết quả của $1111^2$.')
    text = text.replace('+) 112 = 11.11 = 121', '+) $11^2 = 11 \\cdot 11 = 121$')
    text = text.replace('+) 1112 = 111.111 = 12321', '+) $111^2 = 111 \\cdot 111 = 12\\,321$')
    text = text.replace('Dự đoán. 11112 = 1 234 321', 'Dự đoán: $1111^2 = 1\\,234\\,321$')

    # 12. Bài 1.41 trang 24
    text = text.replace('Biết 210 = 1024. Tính 29 và 211.', 'Biết $2^{10} = 1024$. Tính $2^9$ và $2^{11}$.')
    text = text.replace('Biết 210 = 1024', 'Biết $2^{10} = 1024$')
    text = text.replace('29 = 210 – 1 = 210 : 2 = 1024 : 2 = 512.', '$2^9 = 2^{10 - 1} = 2^{10} : 2 = 1024 : 2 = 512$.')
    text = text.replace('211 = 210 + 1 = 210 . 2 = 1024.2 = 2048', '$2^{11} = 2^{10 + 1} = 2^{10} \\cdot 2 = 1024 \\cdot 2 = 2048$')

    # 13. Bài 1.42 trang 24
    text = text.replace('Tính: a) 57.53                      b) 58 : 54', 'Tính: a) $5^7 \\cdot 5^3$        b) $5^8 : 5^4$')
    text = text.replace('Tính: a) 57.53                      b) 58 : 54', 'Tính: a) $5^7 \\cdot 5^3$        b) $5^8 : 5^4$')
    text = text.replace('a) 57.53 = 57+3 = 510', 'a) $5^7 \\cdot 5^3 = 5^{7 + 3} = 5^{10}$')
    text = text.replace('b) 58 : 54 = 58-4 = 54', 'b) $5^8 : 5^4 = 5^{8 - 4} = 5^4$')

    # 14. Bài 1.43 trang 24
    text = text.replace('Ta có: 1 + 3 + 5 = 9 = 32.', 'Ta có: $1 + 3 + 5 = 9 = 3^2$.')
    text = text.replace('a) Ta có: 1 + 3 + 5 + 7 = 16 = 4.4 = 42', 'a) Ta có: $1 + 3 + 5 + 7 = 16 = 4 \\cdot 4 = 4^2$')
    text = text.replace('b) Ta có: 1 + 3 + 5 + 7 + 9 = 25 = 5.5 = 52', 'b) Ta có: $1 + 3 + 5 + 7 + 9 = 25 = 5 \\cdot 5 = 5^2$')

    # 15. Bài 1.44 trang 24
    text = text.replace('Trái Đất có khối lượng khoảng 60.1020 tấn. Mỗi giây Mặt Trời tiêu thụ 6.106 tấn khí hydrogen (theo vnexpress.net).', 'Trái Đất có khối lượng khoảng $60 \\cdot 10^{20}$ tấn. Mỗi giây Mặt Trời tiêu thụ $6 \\cdot 10^6$ tấn khí hydrogen (theo vnexpress.net).')
    text = text.replace('(60. 1020) : ( 6. 106)', '$(60 \\cdot 10^{20}) : (6 \\cdot 10^6)$')
    text = text.replace('= (6.10.1020):(6.106) = 6.1021 : 6 : 106 = (6:6).(1021:106) = 1021-6 = 1015(giây)', '= $(6 \\cdot 10 \\cdot 10^{20}) : (6 \\cdot 10^6) = (6 \\cdot 10^{21}) : (6 \\cdot 10^6) = (6 : 6) \\cdot (10^{21} : 10^6) = 10^{21 - 6} = 10^{15}$ (giây)')
    text = text.replace('Vậy Mặt Trời cần 1015 giây để tiêu thụ một lượng khí hydrogen.', 'Vậy Mặt Trời cần $10^{15}$ giây để tiêu thụ một lượng khí hydrogen.')
    text = text.replace('Vậy Mặt Trời cần 1015 giây để tiêu thụ một lượng khí hydrogen.', 'Vậy Mặt Trời cần $10^{15}$ giây để tiêu thụ một lượng khí hydrogen.')

    # 16. Bài 1.45 trang 24
    text = text.replace('khoảng 25.105 tế bào hồng cầu', 'khoảng $25 \\cdot 10^5$ tế bào hồng cầu')
    text = text.replace('25.105. 3 600 = 3 600. 25. 105 = 36.10.10.25.105 = (36.25).107 = 900.107 = 9.102.107 = 9.109 (tế bào)', '$25 \\cdot 10^5 \\cdot 3\\,600 = 36 \\cdot 100 \\cdot 25 \\cdot 10^5 = 900 \\cdot 10^7 = 9 \\cdot 10^2 \\cdot 10^7 = 9 \\cdot 10^9$ (tế bào)')
    text = text.replace('25.105. 3 600 = 3 600. 25. 105 = 36.10.10.25.105 = (36.25).107 = 900.107 = 9.102.107 = 9.109 (tế bào)', '$25 \\cdot 10^5 \\cdot 3\\,600 = 36 \\cdot 100 \\cdot 25 \\cdot 10^5 = 900 \\cdot 10^7 = 9 \\cdot 10^2 \\cdot 10^7 = 9 \\cdot 10^9$ (tế bào)')
    text = text.replace('Vậy mỗi giờ có 9.109 tế bào hồng cầu được tạo ra.', 'Vậy mỗi giờ có $9 \\cdot 10^9$ tế bào hồng cầu được tạo ra.')

    # 17. Luyện tập 1 trang 26
    text = text.replace('a) 25.23 – 32 + 125.', 'a) $25 \\cdot 2^3 - 3^2 + 125$.')
    text = text.replace('b) 2.32 + 5.(2 + 3).', 'b) $2 \\cdot 3^2 + 5 \\cdot (2 + 3)$.')
    text = text.replace('a) 25.23 – 32 + 125 = 25.8 – 9 + 125 = 200 - 9 + 125 = 191 + 125 =316;', 'a) $25 \\cdot 2^3 - 3^2 + 125 = 25 \\cdot 8 - 9 + 125 = 200 - 9 + 125 = 191 + 125 = 316$;')
    text = text.replace('b) 2.32 + 5.(2+3) = 2.9 + 5.5 = 18 + 25 = 43.', 'b) $2 \\cdot 3^2 + 5 \\cdot (2 + 3) = 2 \\cdot 9 + 5 \\cdot 5 = 18 + 25 = 43$.')

    # 18. Bài 1.46 trang 26
    text = text.replace('b) 14 + 2 . 82;', 'b) $14 + 2 \\cdot 8^2$;')
    text = text.replace('c)\xa0{23+ [1 +(3-1)2]}:13. \xa0', 'c) $\\{2^3 + [1 + (3 - 1)^2]\\} : 13$.')
    text = text.replace('c) {23+ [1 +(3-1)2]}:13.', 'c) $\\{2^3 + [1 + (3 - 1)^2]\\} : 13$.')
    text = text.replace('b) 14 + 2 .\xa082\xa0 = 14 + 2 . 64 = 14 + 128 = 142', 'b) $14 + 2 \\cdot 8^2 = 14 + 2 \\cdot 64 = 14 + 128 = 142$')
    text = text.replace('b) 14 + 2 . 82  = 14 + 2 . 64 = 14 + 128 = 142', 'b) $14 + 2 \\cdot 8^2 = 14 + 2 \\cdot 64 = 14 + 128 = 142$')
    text = text.replace('c)\xa0{23+ [1 + (3-1)2]} : 13 = [8 + (1 + 22)] : 13 = [8 + (1 + 4)] : 13', 'c) $\\{2^3 + [1 + (3 - 1)^2]\\} : 13 = [8 + (1 + 2^2)] : 13 = [8 + (1 + 4)] : 13$')
    text = text.replace('c) {23+ [1 + (3-1)2]} : 13 = [8 + (1 + 22)] : 13 = [8 + (1 + 4)] : 13', 'c) $\\{2^3 + [1 + (3 - 1)^2]\\} : 13 = [8 + (1 + 2^2)] : 13 = [8 + (1 + 4)] : 13$')

    # 19. Bài 1.47 trang 26
    text = text.replace('1 + 2(a + b) – 43 khi a = 25; b = 9.', '$1 + 2(a + b) - 4^3$ khi $a = 25; b = 9$.')
    text = text.replace('Thay a = 25; b = 9 vào biểu thức 1 + 2(a + b) - 43 ta được:', 'Thay $a = 25; b = 9$ vào biểu thức $1 + 2(a + b) - 4^3$ ta được:')
    text = text.replace('1 + 2(a + b) - 43 = 1 + 2. (25 + 9) - 43 = 1 + 2.34 – 64 = 1 + 68 – 64 = 69 – 64 = 5', '$1 + 2(a + b) - 4^3 = 1 + 2 \\cdot (25 + 9) - 4^3 = 1 + 2 \\cdot 34 - 64 = 1 + 68 - 64 = 69 - 64 = 5$')
    text = text.replace('Vậy 1 + 2(a + b) - 43= 5 khi a = 25; b = 9.', 'Vậy $1 + 2(a + b) - 4^3 = 5$ khi $a = 25; b = 9$.')

    # 20. Bài 1.50 trang 27
    text = text.replace('b) 2.32 + 24:6.2;', 'b) $2 \\cdot 3^2 + 24 : 6 \\cdot 2$;')
    text = text.replace('c) 2.32 – 24:(6.2).', 'c) $2 \\cdot 3^2 - 24 : (6 \\cdot 2)$.')
    text = text.replace('b) 2.32 + 24:6.2 = 2.9 + 4.2 = 18 + 8 = 26;', 'b) $2 \\cdot 3^2 + 24 : 6 \\cdot 2 = 2 \\cdot 9 + 4 \\cdot 2 = 18 + 8 = 26$;')
    text = text.replace('c) 2.32 – 24:(6.2) = 2 . 9 – 24 : 12 = 18 – 2 = 16.', 'c) $2 \\cdot 3^2 - 24 : (6 \\cdot 2) = 2 \\cdot 9 - 24 : 12 = 18 - 2 = 16$.')

    # 21. Bài 1.51 trang 27
    old_1_51 = '''Viết kết quả phép tính dưới dạng một lũy thừa:

a) 33 : 32

b) 54 : 52

c) 83.82

d) 54.53:52

**Lời giải:**

a) 33 : 32= 33-2 = 31

b) 54 : 52 = 54-2 =52

c) 83.82 = 83+2 = 85

d) 54.53:52= 54+3-2 = 55'''

    new_1_51 = '''Viết kết quả phép tính dưới dạng một lũy thừa:

a) $3^3 : 3^2$

b) $5^4 : 5^2$

c) $8^3 \\cdot 8^2$

d) $5^4 \\cdot 5^3 : 5^2$

**Lời giải:**

a) $3^3 : 3^2 = 3^{3 - 2} = 3^1$

b) $5^4 : 5^2 = 5^{4 - 2} = 5^2$

c) $8^3 \\cdot 8^2 = 8^{3 + 2} = 8^5$

d) $5^4 \\cdot 5^3 : 5^2 = 5^{4 + 3 - 2} = 5^5$'''
    text = text.replace(old_1_51, new_1_51)

    # 22. Bài 1.53 trang 27
    text = text.replace('a) 110 – 72 + 22 : 2', 'a) $110 - 7^2 + 22 : 2$')
    text = text.replace('b) 9 . (82 – 15);', 'b) $9 \\cdot (8^2 - 15)$;')
    text = text.replace('d) 75 : 3 + 6 . 92;', 'd) $75 : 3 + 6 \\cdot 9^2$;')
    text = text.replace('a) 110 – 72 + 22:2 = 110 – 49 + 11 = 61 + 11 = 72;', 'a) $110 - 7^2 + 22 : 2 = 110 - 49 + 11 = 61 + 11 = 72$;')
    text = text.replace('a) 110 – 72 + 22:2 = 110 – 49 + 11 = 61 + 11 = 72;', 'a) $110 - 7^2 + 22 : 2 = 110 - 49 + 11 = 61 + 11 = 72$;')
    text = text.replace('b) 9.(82 – 15) = 9.(64 – 15 ) = 9.49 = 441;', 'b) $9 \\cdot (8^2 - 15) = 9 \\cdot (64 - 15) = 9 \\cdot 49 = 441$;')
    text = text.replace('d) 75:3 + 6.92 = 25 + 6.81 = 25 + 486 = 511', 'd) $75 : 3 + 6 \\cdot 9^2 = 25 + 6 \\cdot 81 = 25 + 486 = 511$.')

    # 23. Bài 1.57 trang 28
    old_1_57 = '''21.[ ( 1245 + 987) : 23 – 15.12 ] + 21

**Lời giải:**

21.[ ( 1245 + 987) : 23 – 15.12 ] + 21

= 21.(2 232 : 8 - 180) + 21'''

    new_1_57 = '''$21 \\cdot [(1\\,245 + 987) : 2^3 - 15 \\cdot 12] + 21$

**Lời giải:**

$21 \\cdot [(1\\,245 + 987) : 2^3 - 15 \\cdot 12] + 21$

$= 21 \\cdot (2\\,232 : 8 - 180) + 21$'''
    text = text.replace(old_1_57, new_1_57)

    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)
    print('Updated data/toan6/de_bai_loi_giai_chuong_1.md')

def fix_chapter_2():
    p = 'data/toan6/de_bai_loi_giai_chuong_2.md'
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()

    # Bài 2.21 trang 42
    text = text.replace('A = 44.95', '$A = 4^4 \\cdot 9^5$')

    # Bài 2.37 trang 53
    text = text.replace('a) 2.33 và 3.5', 'a) $2 \\cdot 3^3$ và $3 \\cdot 5$')
    text = text.replace('b) 2.5.72 và 3.52.7', 'b) $2 \\cdot 5 \\cdot 7^2$ và $3 \\cdot 5^2 \\cdot 7$')
    text = text.replace('2.33.5 = 270', '$2 \\cdot 3^3 \\cdot 5 = 270$')

    # Bài 2.38 trang 53
    text = text.replace('45 = 32.5', '$45 = 3^2 \\cdot 5$')
    text = text.replace('18 = 2.32', '$18 = 2 \\cdot 3^2$')
    text = text.replace('27 = 33', '$27 = 3^3$')
    text = text.replace('BCNN(30; 45) = 2.32.5 = 90', 'BCNN(30; 45) = $2 \\cdot 3^2 \\cdot 5 = 90$')

    # Bài 2.39 trang 53
    text = text.replace('28 = 22.7', '$28 = 2^2 \\cdot 7$')
    text = text.replace('32 = 25', '$32 = 2^5$')
    text = text.replace('BCNN(28; 32) = 25.7 = 224', 'BCNN(28; 32) = $2^5 \\cdot 7 = 224$')

    # Bài 2.40 trang 53
    text = text.replace('BCNN(3; 4; 9) = 22.32 = 36', 'BCNN(3, 4, 9) = $2^2 \\cdot 3^2 = 36$')

    # Bài 2.43 trang 53
    text = text.replace('BCNN(12, 15) = 22.3.5 = 60', 'BCNN(12, 15) = $2^2 \\cdot 3 \\cdot 5 = 60$')
    text = text.replace('4 = 22', '$4 = 2^2$')
    text = text.replace('BCNN(10, 4, 14) = 22.5.7 = 140', 'BCNN(10, 4, 14) = $2^2 \\cdot 5 \\cdot 7 = 140$')

    # Bài 2.44 trang 53
    text = text.replace('20 = 22.5', '$20 = 2^2 \\cdot 5$')
    text = text.replace('BCNN(20,15) = 22.3.5 = 60', 'BCNN(20, 15) = $2^2 \\cdot 3 \\cdot 5 = 60$')

    # Luyện tập 3 trang 53
    text = text.replace('12 = 22.3', '$12 = 2^2 \\cdot 3$')
    text = text.replace('9 = 32', '$9 = 3^2$')
    text = text.replace('BCNN(7, 9, 12) = 22.32.7 = 252', 'BCNN(7, 9, 12) = $2^2 \\cdot 3^2 \\cdot 7 = 252$')
    text = text.replace('16 = 24', '$16 = 2^4$')
    text = text.replace('BCNN(16, 12) = 24.3 = 48', 'BCNN(16, 12) = $2^4 \\cdot 3 = 48$')

    # Bài 2.53 / 2.54 trang 56
    text = text.replace('142 + 52 + 22', '$14^2 + 5^2 + 2^2$')
    text = text.replace('196 + 25 + 4 = 225', '$196 + 25 + 4 = 225$')
    text = text.replace('120 =  23.3.5', '$120 = 2^3 \\cdot 3 \\cdot 5$')

    # Bài 2.55 trang 56
    text = text.replace('98 = 2.72', '$98 = 2 \\cdot 7^2$')
    text = text.replace('36 = 22.32', '$36 = 2^2 \\cdot 3^2$')
    text = text.replace('54 = 2.33', '$54 = 2 \\cdot 3^3$')
    text = text.replace('BCNN(21, 98) = 2.3.72= 294', 'BCNN(21, 98) = $2 \\cdot 3 \\cdot 7^2 = 294$')
    text = text.replace('ƯCLN(36, 54) =  2.32 = 18', 'ƯCLN(36, 54) = $2 \\cdot 3^2 = 18$')
    text = text.replace('BCNN(36, 54) = 2.32 = 108', 'BCNN(36, 54) = $2^2 \\cdot 3^3 = 108$')

    # Bài 2.57 trang 56
    text = text.replace('BCNN(15, 9) = 32.5 = 45', 'BCNN(15, 9) = $3^2 \\cdot 5 = 45$')

    # Bài 2.61 trang 56
    text = text.replace('3a.52 và 33.5b có ƯCLN là 33.52 và BCNN là 34.53', '$3^a \\cdot 5^2$ và $3^3 \\cdot 5^b$ có ƯCLN là $3^3 \\cdot 5^2$ và BCNN là $3^4 \\cdot 5^3$')
    text = text.replace('(3a.52; 33.5b)', '($3^a \\cdot 5^2; 3^3 \\cdot 5^b$)')
    text = text.replace('( 33.53).(34.53)', '($3^3 \\cdot 5^2) \\cdot (3^4 \\cdot 5^3)$')
    text = text.replace('33+4.52+3= 37.55', '$3^{3+4} \\cdot 5^{2+3} = 3^7 \\cdot 5^5$')

    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)
    print('Updated data/toan6/de_bai_loi_giai_chuong_2.md')

if __name__ == '__main__':
    fix_chapter_1()
    fix_chapter_2()
    # Copy updated markdown files to chatbot/data/toan6/
    for ch in [1, 2]:
        src = f'data/toan6/de_bai_loi_giai_chuong_{ch}.md'
        dst = f'chatbot/data/toan6/de_bai_loi_giai_chuong_{ch}.md'
        shutil.copyfile(src, dst)
        print(f'Synced {src} -> {dst}')
