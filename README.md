# Phiếu bé ngoan

Hai trang web tĩnh cho lớp mầm non:

- **Trang phiếu** — điền tên bé, lớp, cô giáo, chọn 1–5 sao, lời khen, bạn thú
  (gấu / thỏ / mèo / cún) và tông màu; in ra đúng một trang **A5 ngang**.
  Nút *sao chép liên kết* tạo link mang theo thông tin của bé (`?ten=...&sao=...`)
  để gửi riêng cho phụ huynh.
- **Trang mã QR** — chiếu lên màn hình hoặc in dán ở lớp; quét bằng điện thoại
  là mở ra trang phiếu, không cần đăng nhập.

## Cấu trúc

| Đường dẫn | Vai trò |
| --- | --- |
| `phieu-be-ngoan.html` | nguồn trang phiếu |
| `quet-phieu-be-ngoan.html` | nguồn trang mã QR |
| `fonts.css` | bộ `@font-face` tự host, chỉ dùng khi host chặn Google Fonts |
| `build.py` | đóng gói nguồn thành HTML độc lập trong `docs/` |
| `set_target.py` | sinh lại mã QR khi địa chỉ trang phiếu thay đổi |
| `docs/` | thư mục GitHub Pages phục vụ (`index.html` = trang QR, `phieu.html` = phiếu) |

Hai file nguồn ở gốc được viết theo dạng Artifact của Claude — chỉ có phần nội
dung, không có `<!doctype>`/`<head>`/`<body>` — nên phải qua `build.py` mới mở
đúng khi host bên ngoài.

## Quy trình sửa

```bash
# 1. sửa nội dung/giao diện trong hai file .html ở gốc
# 2. nếu địa chỉ trang phiếu đổi, sinh lại mã QR
python3.9 set_target.py https://<owner>.github.io/<repo>/phieu.html
# 3. đóng gói ra docs/
python3 build.py
# 4. đẩy lên, GitHub Pages tự cập nhật sau ~1 phút
git add -A && git commit -m "cập nhật phiếu" && git push
```

`set_target.py` cần thư viện `segno`:

```bash
python3.9 -m pip install --user segno
```

## Ghi chú

- Mã QR luôn chừa vùng trắng 4 module quanh mã theo chuẩn QR; thiếu vùng này
  máy quét dễ trượt. Đã kiểm tra bằng cách render trang rồi giải mã lại ảnh.
- Khi in phiếu, chọn khổ **A5 ngang** và bật *In hình nền / Background graphics*
  để giữ màu pastel.
- Font: Baloo 2 + Quicksand (Google Fonts, giấy phép OFL).
