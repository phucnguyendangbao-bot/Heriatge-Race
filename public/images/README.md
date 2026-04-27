# Thư mục ảnh cho Heritage Race

Đặt các file ảnh sau vào thư mục này. Tên file phải khớp **chính xác** (chữ thường, không dấu).

## Danh sách ảnh cần upload (8 file)

| Tên file              | Địa danh              | Dùng ở đâu                                |
|-----------------------|-----------------------|-------------------------------------------|
| `halong.jpg`          | Vịnh Hạ Long          | Bàn cờ (góc dưới phải) + Trang Di Sản     |
| `myson.jpg`           | Thánh Địa Mỹ Sơn     | Bàn cờ (góc trên trái) + Trang Di Sản     |
| `sondoong.jpg`        | Hang Sơn Đoòng       | Bàn cờ (góc trên phải) + Trang Di Sản     |
| `trangan.jpg`         | Tràng An Ninh Bình    | Bàn cờ (góc dưới trái) + Trang Di Sản     |
| `hoian.jpg`           | Phố Cổ Hội An         | Trang Di Sản                              |
| `hue.jpg`             | Cố Đô Huế             | Trang Di Sản                              |
| `fansipan.jpg`        | Đỉnh Fansipan         | Trang Di Sản                              |
| `mucangchai.jpg`      | Mù Cang Chải          | Trang Di Sản                              |

## Khuyến nghị

- **Định dạng**: `.jpg` (hoặc đổi sang `.webp` để nhẹ hơn — nhớ sửa lại đường dẫn trong `game.html`).
- **Kích thước**: 800×600 px là đủ cho thẻ trang trí. Trang Di Sản hiển thị 100% chiều ngang (~600 px).
- **Dung lượng**: nén dưới 200KB/ảnh để tải nhanh trên Vercel.

## Triển khai trên Vercel

1. Đẩy thư mục dự án này (chứa `game.html` và `public/images/*.jpg`) lên GitHub.
2. Vào https://vercel.com → **New Project** → import repo.
3. Trong **Build Settings**, để mặc định (Vercel tự nhận diện static site).
4. Sau khi deploy, ảnh sẽ được phục vụ tại `https://your-project.vercel.app/images/halong.jpg`, code tự link đúng vì dùng đường dẫn tương đối `/images/...`.

## Đổi domain ảnh (nếu cần)

Mở `game.html`, tìm dòng:

```js
const IMG_BASE='/images';
```

Thay thành domain Vercel của bạn nếu host ảnh ở project khác:

```js
const IMG_BASE='https://your-cdn.vercel.app/images';
```
