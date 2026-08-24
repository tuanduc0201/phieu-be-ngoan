# Phiếu bé ngoan

Phiếu bé ngoan để tặng ai cũng được — bạn bè, đồng nghiệp, người nhà. Bạn soạn
phiếu trên máy, gửi cho họ một liên kết; họ bấm vào thì thấy mã QR, quét bằng
điện thoại là phiếu hiện ra.

## Luồng ba bước

```
bạn: docs/index.html          soạn phiếu → bấm "Tạo mã QR" → sao chép liên kết
                                                    │  gửi liên kết
họ:  docs/qr.html#<nội dung>  ─────────────────────►│  mở ra, chỉ có mã QR
                                                    │  quét bằng điện thoại
họ:  docs/phieu.html#<nội dung> ────────────────────►  tấm phiếu
```

| Trang | Ai mở | Có gì |
| --- | --- | --- |
| `docs/index.html` | bạn | ô nhập, xem trước, nút tạo mã QR và liên kết để gửi |
| `docs/qr.html` | người nhận, trên máy tính | **chỉ mã QR** để quét, không hé nội dung phiếu |
| `docs/phieu.html` | người nhận, trên điện thoại | **chỉ tấm phiếu**, không có ô nhập nào |

## Nội dung phiếu nằm ở đâu

Toàn bộ nội dung được nén vào phần neo của địa chỉ (`#<base64url của JSON>`), và
được truyền y nguyên từ `qr.html` sang `phieu.html`. Phần sau dấu `#`
**không được trình duyệt gửi lên máy chủ**, nên lời nhắn không lọt vào log của
GitHub Pages — nó chỉ nằm trong liên kết và trong máy người xem. Đổi lại, liên
kết dài hơn và mã QR dày hơn khi lời nhắn dài; trang tạo sẽ nhắc nếu quá dài.

## Cấu trúc

| Đường dẫn | Vai trò |
| --- | --- |
| `tao-phieu.html` | nguồn trang soạn phiếu |
| `trang-qr.html` | nguồn trang mã QR |
| `phieu-be-ngoan.html` | nguồn trang phiếu |
| `partials/tokens.css` | biến màu pastel, phông, hiệu ứng viền sticker |
| `partials/phieu.css` | dáng tấm phiếu và vị trí mèo dán |
| `partials/sprite.html` | hình SVG: bốn con mèo và ngôi sao |
| `partials/phieu.js` | mã hoá/giải mã nội dung + dựng tấm phiếu (dùng chung ba trang) |
| `partials/qr.js` | bộ mã hoá QR chạy trong trình duyệt |
| `build.py` | bọc khung tài liệu, chèn `partials/`, xuất ra `docs/` |
| `docs/` | thư mục GitHub Pages phục vụ |

Ba file nguồn ở gốc chỉ chứa phần nội dung (không có `<!doctype>`/`<head>`) và
dùng chỉ thị `{{include: partials/...}}`; `build.py` lo phần còn lại. Nhờ vậy
tấm phiếu chỉ được định nghĩa **một chỗ** dù nhiều trang cùng dựng nó.

## Quy trình sửa

```bash
# 1. sửa nội dung/giao diện trong ba file .html ở gốc hoặc trong partials/
python3 build.py
# 2. xem thử
xdg-open docs/index.html
# 3. đẩy lên, GitHub Pages tự cập nhật sau khoảng một phút
git add -A && git commit -m "..." && git push
```

## Giao diện

Nền mint sương và kem, thẻ phiếu trắng có dải mint–vàng ở mép trên, mực xanh
rừng `#163B36` (không dùng đen thuần), nhấn mint `#17B195` với đào, vàng bơ và
lavender làm sắc phụ. Phông: **Bricolage Grotesque** cho chữ lớn, **Be Vietnam
Pro** cho chữ nhỏ — cả hai đều có bộ dấu tiếng Việt. Bốn con mèo dán kiểu
sticker (viền trắng bằng nhiều lớp `drop-shadow`) và ngôi sao vàng dán ở ba góc
thẻ, tràn ra ngoài mép.

## Về bộ mã hoá QR

Mã QR phải sinh ngay trong trình duyệt vì nội dung đổi theo từng chữ bạn nhập,
nên `partials/qr.js` là một bộ mã hoá QR viết tay: chế độ byte, mức sửa lỗi M
(tự hạ xuống L nếu nội dung dài), phiên bản 1–20, tự chọn mặt nạ theo bốn luật
chấm điểm của chuẩn.

Hai bảng số liệu khó nhớ — cấu trúc khối sửa lỗi theo từng phiên bản và vị trí
ô căn chỉnh — được sinh từ thư viện `segno` để khỏi sai:

```bash
python3.9 -m pip install --user segno
python3.9 - <<'PY'
import json
from segno import consts
L, M = consts.ERROR_LEVEL_L, consts.ERROR_LEVEL_M
ecc = [[[[b.num_blocks, b.num_total, b.num_data] for b in consts.ECC[v][lvl]] for lvl in (L, M)]
       for v in range(1, 21)]
print("const ECC_TB=" + json.dumps(ecc, separators=(',', ':')) + ";")
print("const ALIGN_TB=" + json.dumps([list(p) for p in consts.ALIGNMENT_POS[:19]],
                                     separators=(',', ':')) + ";")
PY
```

Cách đã kiểm chứng bộ mã hoá: render mã ra ảnh rồi **giải mã ngược** bằng
OpenCV và so với chuỗi gốc — đúng 16/17 trường hợp thử (phiên bản 1–15, gồm
tiếng Việt có dấu và emoji). Trường hợp còn lại là chuỗi 658 ký tự ra phiên bản
18, và OpenCV cũng không giải được mã v18 do chính `segno` sinh với nội dung
đó, nên đó là hạn chế của bộ giải mã. Lưu ý: **không** so ma trận với `segno`
được, vì `segno` chèn thêm một ô `0x00` trước các ô đệm — hai mã khác nhau ở
phần đệm nhưng cùng hợp lệ.

## Ghi chú

- Trang soạn phiếu ghi nhớ nội dung bạn nhập lần trước bằng `localStorage`.
- Sau khi đã bấm tạo mã, mọi chỉnh sửa tiếp theo tự cập nhật cả mã QR lẫn liên
  kết, để không bao giờ sao chép được một liên kết cũ so với phiếu đang xem.
- `build.py --font-css <file>` nhúng bộ `@font-face` tự host, chỉ cần khi đưa
  trang lên host chặn `fonts.googleapis.com` bằng CSP.
