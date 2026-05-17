# Deploy Cờ Tỉ Phú Di Sản Việt Nam lên Vercel

Sandbox của Claude không truy cập được `vercel.com` nên bạn deploy trực tiếp từ máy của mình. Có **3 cách**, chọn 1 cách phù hợp nhất với bạn.

> ⚠️ **Quan trọng**: Phiên bản này có AI chatbot dùng Claude API. Bạn **bắt buộc phải set environment variable `ANTHROPIC_API_KEY`** trên Vercel (xem mục dưới) — không thì tính năng AI sẽ không hoạt động.

---

## Cách 1 — Drag & Drop (đơn giản nhất, không cần cài đặt)

1. Truy cập **https://vercel.com/new** (đăng nhập bằng GitHub / Google / Email).
2. Bấm **"Browse"** hoặc kéo thả thư mục `vercel-deploy/` (hoặc file `co-ti-phu-vercel-deploy.zip`) vào trang.
3. Đặt tên project (ví dụ `co-ti-phu-di-san`).
4. **Trước khi bấm Deploy**: mở phần **"Environment Variables"** và thêm:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (key của bạn từ https://console.anthropic.com)
5. Bấm **"Deploy"** — Vercel sẽ tự build và cấp URL công khai trong khoảng 20-40 giây.

URL kết quả: `https://co-ti-phu-di-san.vercel.app`

---

## Cách 2 — Vercel CLI (nhanh nhất nếu deploy nhiều lần)

Trên Windows/macOS/Linux:

```bash
# 1. Cài Vercel CLI (chỉ làm 1 lần)
npm install -g vercel

# 2. Mở terminal trong thư mục vercel-deploy
cd đường-dẫn-tới/vercel-deploy

# 3. Đăng nhập (mở browser xác thực)
vercel login

# 4. Deploy preview lần đầu (tự hỏi setup project)
vercel

# 5. Thêm env var Claude API key
vercel env add ANTHROPIC_API_KEY
# (CLI sẽ hỏi paste value + chọn env: chọn cả Production, Preview, Development)

# 6. Deploy production (sau khi check preview OK)
vercel --prod
```

CLI sẽ in URL preview / production sau khi deploy xong.

---

## Cách 3 — Kết nối GitHub (auto-deploy mỗi lần push)

1. Tạo repository mới trên GitHub, push toàn bộ thư mục `vercel-deploy/` (gồm `index.html`, `vercel.json`, folder `api/`) lên.
2. Vào **https://vercel.com/new** → **"Import Git Repository"** → chọn repo.
3. Trong màn hình import, mở **"Environment Variables"** và thêm `ANTHROPIC_API_KEY` (xem mục dưới).
4. Bấm Deploy. Vercel sẽ tự deploy mỗi khi bạn `git push`.

Đây là cách **production-grade** nếu bạn dự định cập nhật thường xuyên.

---

## 🔑 Cấu hình Claude API Key (BẮT BUỘC cho tính năng AI chatbot)

AI chatbot trong game (gợi ý chiến thuật, trả lời câu hỏi) hoạt động bằng cách gọi Claude API qua serverless function `api/chat.js`. Key của bạn **chỉ lưu trên server Vercel**, không bao giờ lộ ra trình duyệt người chơi.

### Bước 1 — Lấy API key
1. Truy cập **https://console.anthropic.com**
2. Sign up / đăng nhập → mục **"API Keys"** → **"Create Key"**
3. Copy key (dạng `sk-ant-api03-...`) — bạn chỉ thấy 1 lần, lưu vào nơi an toàn

### Bước 2 — Set env var trên Vercel
**Cách qua dashboard:**
1. Vào project của bạn trên Vercel → tab **"Settings"** → **"Environment Variables"**
2. Bấm **"Add New"**
3. Điền:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-api03-...` (paste key vừa lấy)
   - **Environments**: tick cả 3 (Production, Preview, Development)
4. Bấm **"Save"**
5. **Redeploy** project (Vercel → Deployments → bấm ⋯ trên deploy gần nhất → **"Redeploy"**) — env var chỉ áp dụng cho deploy MỚI.

**Cách qua CLI:**
```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel env add ANTHROPIC_API_KEY development
vercel --prod   # redeploy
```

### Bước 3 — Kiểm tra
- Mở URL game → đăng nhập → bắt đầu chơi
- Bấm bong bóng chat dưới góc phải → tab **"Trợ lý"**
- Hỏi: "Tôi nên mua đất nào trước?"
- Nếu trả lời mượt = OK. Nếu báo lỗi `api_not_configured` = chưa set env var đúng, kiểm tra lại Bước 2.

### Chi phí ước tính
- Model: `claude-haiku-4-5` (~$1/triệu input token, ~$5/triệu output token)
- Mỗi câu hỏi ≈ 1.5K input + 0.3K output ≈ **$0.003/câu** (~70đ)
- Rate limit đã set sẵn: **15 câu/phút/IP** → không quá 21,600 câu/ngày/IP (worst case ~$60/ngày — thực tế thấp hơn nhiều)
- Theo dõi cost: https://console.anthropic.com/settings/usage

### Bảo mật & giới hạn
- ✅ Key chỉ ở env var server-side, **không bao giờ gửi xuống browser**
- ✅ Rate limit 15 req/phút/IP trong `api/chat.js`
- ✅ Validate input: max 500 ký tự/câu hỏi
- ⚠️ Rate limit lưu in-memory → Vercel cold start sẽ reset. Muốn chống abuse mạnh hơn: dùng **Vercel KV** hoặc **Upstash Redis** (sửa `api/chat.js`).
- ⚠️ Đặt **monthly budget alert** trên Anthropic console để tránh hết tiền bất ngờ.

---

## Custom domain (tùy chọn)

Sau khi deploy thành công:

1. Vào **Project → Settings → Domains** trên Vercel.
2. Thêm domain bạn sở hữu (ví dụ `cotiphudisan.vn`).
3. Vercel sẽ cho bạn record DNS cần trỏ tại nhà cung cấp domain (CNAME hoặc A record).

---

## Files trong thư mục

| File | Mô tả |
|------|-------|
| `index.html` | Game đầy đủ — board, sponsored mechanic, login gate, landmark images, chat AI, shop |
| `vercel.json` | Config Vercel: cache headers, clean URLs, function maxDuration |
| `api/chat.js` | Serverless function proxy Claude API (cần `ANTHROPIC_API_KEY` env var) |

---

## Sau khi deploy — checklist

- [ ] Thử mở URL trên mobile + desktop
- [ ] Test login → bắt đầu game
- [ ] Bấm vào ô landmark có sponsor (Phú Quốc, Hạ Long…) → xem popup sponsored hoạt động
- [ ] Bấm bong bóng chat → test cả 3 tab: Trợ lý / Cửa hàng / Voucher
- [ ] Hỏi AI 1 câu → kiểm tra trả lời (cần `ANTHROPIC_API_KEY` đã set)
- [ ] Thay `affiliateUrl` trong `SPONSORS` map (dòng ~2101 của `index.html`) bằng affiliate ID thật trước khi launch chính thức
- [ ] Cấu hình custom domain nếu có
- [ ] Set monthly budget alert trên Anthropic console
