# Multi-Persona AI Chatbot (PowerShell Edition)
# Chạy trực tiếp trên Terminal Windows không cần cài đặt thêm phần mềm!

$csvPath = Join-Path $PSScriptRoot "..\prompts.csv"
$toan6Path = Join-Path $PSScriptRoot "data\toan6\toan6_index.json"

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Multi-Persona AI Chatbot (prompts.chat)" -ForegroundColor Yellow
Write-Host "   Tu dong bien hinh theo vai tro chuyen gia tu prompts.csv" -ForegroundColor DarkGray
Write-Host "   Tich hop kho kien thuc: Toan 6 SGK Ket noi tri thuc (9 Chuong)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Cac lenh ho tro:" -ForegroundColor White
Write-Host "  /toan6 [1-9]      - Xem va nap du lieu Toan 6 (Chuong 1 - 9)" -ForegroundColor Yellow
Write-Host "  /list             - Xem cac vai tro pho bien khac" -ForegroundColor Gray
Write-Host "  /act [ten]        - Doi vai tro (VD: /act python, /act english)" -ForegroundColor Gray
Write-Host "  /prompt           - Xem prompt chi tiet cua vai tro hien tai" -ForegroundColor Gray
Write-Host "  /key [api_key]    - Cai dat Google Gemini API Key" -ForegroundColor Gray
Write-Host "  /clear            - Xoa man hinh" -ForegroundColor Gray
Write-Host "  /exit             - Thoat Chatbot" -ForegroundColor Gray
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

# Default Persona
$currentAct = "Gia su Toan 6 (KNTT)"
$currentPrompt = "Ban la mot Gia su Toan 6 xuat sac, am hieu sau sac bo SGK Ket noi tri thuc tu Chuong 1 den Chuong 9. Huong dan tung buoc theo phuong phap goi mo Socratic, giai thich ban chat khai niem de hieu va than thien."
$apiKey = $env:GEMINI_API_KEY

Write-Host "`nVai tro mac dinh: [$currentAct]" -ForegroundColor Green
Write-Host "Nhap cau hoi toan hoac go lenh de bat dau tro chuyen:`n" -ForegroundColor White

function Call-GeminiApi($prompt, $query, $key) {
    if (-not $key) {
        return "[Mo phong] Phan hoi theo vai tro [$currentAct]: Toi da tiep nhan cau hoi '$query'. (De nhan cau tra loi LLM thuc te, ban co the go /key [GEMINI_API_KEY])"
    }

    # Uu tien model vua thanh cong va cac model Flash sieu toc thuc te
    $candidates = @()
    if ($global:WorkingGeminiModel) { $candidates += $global:WorkingGeminiModel }
    $candidates += @("gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash")
    $models = $candidates | Select-Object -Unique
    $lastErr = ""

    foreach ($m in $models) {
        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=$key"
            $genConfig = @{
                temperature = 0.3
                maxOutputTokens = 2048
            }
            if ($m -like "*3.8*" -or $m -like "*2.5*") {
                $genConfig["thinkingConfig"] = @{ thinkingBudget = 0 }
            }
            $bodyObj = @{
                contents = @(
                    @{
                        role = "user"
                        parts = @(@{ text = $query })
                    }
                )
                systemInstruction = @{
                    parts = @(@{ text = "$prompt`nVui long tra loi truc dien, ngan gon bang Tieng Viet, giu dung phong cach va vai tro duoc chi dinh." })
                }
                generationConfig = $genConfig
            }
            $bodyJson = $bodyObj | ConvertTo-Json -Depth 10
            $res = Invoke-RestMethod -Uri $url -Method Post -Body $bodyJson -ContentType "application/json; charset=utf-8"
            if ($res.candidates -and $res.candidates[0].content.parts[0].text) {
                $global:WorkingGeminiModel = $m
                return $res.candidates[0].content.parts[0].text
            }
        } catch {
            $lastErr = $_.Exception.Message
        }
    }

    return "⚠️ May chu Google dang qua tai: $lastErr. Ban co the su dung che do Mo phong hoac thu lai sau giay lat."
}

while ($true) {
    Write-Host -NoNewline "Ban: " -ForegroundColor Yellow
    $userInput = Read-Host

    if ([string]::IsNullOrWhiteSpace($userInput)) { continue }

    if ($userInput -eq "/exit" -or $userInput -eq "/quit") {
        Write-Host "Tam biet ban! Hen gap lai." -ForegroundColor Cyan
        break
    }

    if ($userInput -eq "/clear") {
        Clear-Host
        Write-Host "Vai tro hien tai: [$currentAct]" -ForegroundColor Green
        continue
    }

    if ($userInput.StartsWith("/key ")) {
        $apiKey = $userInput.Substring(5).Trim()
        Write-Host "Da cap nhat Gemini API Key!" -ForegroundColor Green
        continue
    }

    if ($userInput -eq "/prompt") {
        Write-Host "`nSystem Prompt [$currentAct]:" -ForegroundColor DarkCyan
        Write-Host "$currentPrompt`n" -ForegroundColor DarkGray
        continue
    }

    if ($userInput.StartsWith("/toan6")) {
        $chNum = $userInput.Replace("/toan6", "").Trim()
        if (-not (Test-Path $toan6Path)) {
            Write-Host "Chua tim thay du lieu Toan 6 tai: $toan6Path" -ForegroundColor Red
            continue
        }
        $chapters = Get-Content $toan6Path -Raw -Encoding utf8 | ConvertFrom-Json
        
        if ([string]::IsNullOrWhiteSpace($chNum)) {
            Write-Host "`nDANH SACH 9 CHUONG TOAN LOP 6 (SGK KET NOI TRI THUC):" -ForegroundColor Yellow
            foreach ($ch in $chapters) {
                Write-Host "  [$($ch.chapter)] $($ch.title) ($($ch.exercise_count) bai tap)" -ForegroundColor Cyan
            }
            Write-Host "`nGo: /toan6 [so chuong] de chon (Vi du: /toan6 1, /toan6 6)`n" -ForegroundColor Gray
            continue
        }

        $targetCh = $chapters | Where-Object { $_.chapter -eq [int]$chNum }
        if ($targetCh) {
            $currentAct = "Toan 6 - $($targetCh.title)"
            $currentPrompt = "Ban la Gia su chuyen sau mon Toan 6 SGK Ket noi tri thuc, chuyen ve '$($targetCh.title)'. Hay dung phuong phap goi mo tung buoc Socratic, phan tich ban chat bai toan, kiem tra su hieu bai cua hoc sinh va dua ra vi du tuong tu de hoc sinh tu lam."
            Write-Host "`nDA CHON VAI TRO: [$currentAct]" -ForegroundColor Green
            Write-Host "So luong bai tap co san trong kho: $($targetCh.exercise_count) bai" -ForegroundColor Yellow
            Write-Host "Mot so bai tap tieu bieu:" -ForegroundColor DarkGray
            foreach ($ex in $targetCh.sample_exercises) {
                Write-Host "   - $ex" -ForegroundColor Gray
            }
            Write-Host "`nHay dat cau hoi bai tap thuoc chuong nay de duoc huong dan!`n" -ForegroundColor White
        } else {
            Write-Host "Vui long nhap so chuong tu 1 den 9! (Vi du: /toan6 2)" -ForegroundColor Red
        }
        continue
    }

    if ($userInput -eq "/list") {
        Write-Host "`nMot so vai tro tieu bieu:" -ForegroundColor Cyan
        Write-Host "  1. toan6      - Gia su Toan 6 SGK Ket noi tri thuc (Chuong 1 - 9)"
        Write-Host "  2. math       - Gia su Toan hoc tong quat"
        Write-Host "  3. english    - Luyen giao tiep va sua loi Tieng Anh"
        Write-Host "  4. socratic   - Day hoc theo phuong phap goi mo tu duy"
        Write-Host "  5. python     - Chuyen gia lap trinh Python"
        Write-Host "  6. career     - Co van dinh huong nghe nghiep"
        Write-Host "  7. debater    - Chuyen gia tranh bien phan bien"
        Write-Host "`nGo /act [ten] de chuyen doi (Vi du: /act python)`n" -ForegroundColor Gray
        continue
    }

    if ($userInput.StartsWith("/act ")) {
        $target = $userInput.Substring(5).Trim().ToLower()
        
        if ($target -like "*teach*" -or $target -like "*dap ung*") {
            $currentAct = "Chuyen gia Su pham TEACH (Day hoc Dap ung)"
            $currentPrompt = "Ban la Chuyen gia Su pham theo mo hinh TEACH: Day hoc Dap ung hoc sinh (Cong dong Giao vien Sang tao Viet Nam). 3 tru cot: 1. Hieu nguoi hoc (nhan dien nhu cau, chan doan lo hong). 2. Thiet ke phu hop (phan hoa 3 muc do, goi mo Socratic). 3. Phan hoi kip thoi (dong vien, chi ra Diem mau chot)."
        } elseif ($target -like "*toan6*" -or $target -like "*toan 6*") {
            $currentAct = "Gia su Toan 6 (KNTT)"
            $currentPrompt = "Ban la mot Gia su Toan 6 xuat sac theo SGK Ket noi tri thuc. NGUYEN TAC GIANG DAY: 1. Bam sat cach giai trong SGK va tai lieu. 2. Huong dan ngan gon, de hieu tung buoc. 3. Luon luon chi ra [DIEM MAU CHOT] (ban chat toan hoc, tu khoa quan trong, quy tac cong 1 khi chia co du thuc te, loi hay gap) o cuoi moi bai giai."
        } elseif ($target -like "*math*") {
            $currentAct = "Math Teacher"
            $currentPrompt = "I want you to act as a math teacher. Explain equations and concepts step-by-step in easy-to-understand terms."
        } elseif ($target -like "*english*") {
            $currentAct = "Spoken English Teacher"
            $currentPrompt = "I want you to act as a spoken English teacher. Strictly correct grammar mistakes and typos, and ask questions to keep conversation."
        } elseif ($target -like "*python*") {
            $currentAct = "Python Senior Developer"
            $currentPrompt = "I want you to act as an expert Python engineer. Provide clean, idiomatic, PEP8-compliant code with explanations."
        } elseif ($target -like "*socratic*") {
            $currentAct = "Socratic Method Tutor"
            $currentPrompt = "I want you to act as a Socratic tutor. Do not give direct answers, ask guiding questions to lead the user to discover the answer."
        } elseif ($target -like "*career*") {
            $currentAct = "Career Counselor"
            $currentPrompt = "I want you to act as a career counselor. Help the user determine careers based on their skills and interests."
        } else {
            $currentAct = $userInput.Substring(5).Trim()
            $currentPrompt = "I want you to act as a professional and expert in $currentAct. Provide detailed, helpful and accurate assistance."
        }

        Write-Host "`nDa chuyen sang vai tro: [$currentAct]`n" -ForegroundColor Green
        continue
    }

    # Normal message processing
    Write-Host -NoNewline "Bot ($currentAct): " -ForegroundColor Cyan
    $reply = Call-GeminiApi -prompt $currentPrompt -query $userInput -key $apiKey
    Write-Host "$reply`n" -ForegroundColor White
}
