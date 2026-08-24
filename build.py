#!/usr/bin/env python3
"""Đóng gói các trang thành HTML độc lập trong docs/ để GitHub Pages phục vụ.

Các file .html ở gốc được viết theo dạng Artifact (chỉ có phần nội dung, không có
<!doctype>/<head>/<body>) nên phải bọc lại mới mở đúng khi host bên ngoài.

    python3 build.py                      # dùng font từ Google Fonts (mặc định)
    python3 build.py --font-css fonts.css # nhúng bộ font tự host

quet-phieu-be-ngoan.html -> docs/index.html   (trang chiếu mã QR)
phieu-be-ngoan.html      -> docs/phieu.html   (trang phiếu mà QR mở ra)

--font-css chỉ cần khi host áp CSP chặn fonts.googleapis.com (ví dụ catbox.moe).
GitHub Pages không chặn nên bản mặc định dùng Google Fonts cho gọn file.
"""
import argparse
import pathlib
import re

GOC = pathlib.Path(__file__).parent
DOCS = GOC / "docs"
# nguồn -> tên file khi xuất bản (GitHub Pages phục vụ thư mục docs/)
TRANG = {
    "quet-phieu-be-ngoan.html": "index.html",
    "phieu-be-ngoan.html": "phieu.html",
}

KHUNG = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FFEDE1">
<meta name="description" content="{mo_ta}">
<style>*{{margin:0;padding:0}}html,body{{min-height:100%}}svg,img{{max-width:100%}}</style>
{dau}
</head>
<body>
{than}
</body>
</html>
"""

MO_TA = {
    "phieu-be-ngoan.html": "Phiếu bé ngoan cho lớp mầm non — điền tên bé, chọn sao và in khổ A5 ngang.",
    "quet-phieu-be-ngoan.html": "Quét mã QR để mở phiếu bé ngoan.",
}

# title/style có thẻ đóng, link là thẻ rỗng
HEAD_RE = re.compile(
    r"<title\b[^>]*>.*?</title>\s*|<style\b[^>]*>.*?</style>\s*|<link\b[^>]*>\s*",
    re.S | re.I,
)
LA_FONT_GOOGLE = re.compile(r"fonts\.(googleapis|gstatic)\.com", re.I)


def dong_goi(ten: str, font_css: str | None = None) -> pathlib.Path:
    src = (GOC / ten).read_text(encoding="utf-8")
    dau_moi: list[str] = []

    def hut(m: re.Match) -> str:
        the = m.group(0).rstrip()
        # khi tự host font thì bỏ mọi thẻ trỏ ra Google Fonts
        if font_css and the.lower().startswith("<link") and LA_FONT_GOOGLE.search(the):
            return ""
        dau_moi.append(the)
        return ""

    # chỉ hút phần đầu file, dừng khi gặp thẻ nội dung đầu tiên
    cat = src.find("\n<div")
    dau_phan, than_phan = (src[:cat], src[cat:]) if cat != -1 else (src, "")
    dau_phan = HEAD_RE.sub(hut, dau_phan)

    if font_css:
        # chèn ngay sau <title> để font nạp sớm, trước phần CSS của trang
        vi_tri = 1 if dau_moi and dau_moi[0].lower().startswith("<title") else 0
        dau_moi.insert(vi_tri, "<style>\n" + font_css.strip() + "\n</style>")

    html = KHUNG.format(
        mo_ta=MO_TA.get(ten, ""),
        dau="\n".join(dau_moi),
        than=(dau_phan.strip() + "\n" + than_phan.strip()).strip(),
    )
    DOCS.mkdir(exist_ok=True)
    ra = DOCS / TRANG.get(ten, ten)
    ra.write_text(html, encoding="utf-8")
    return ra


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("trang", nargs="*", default=None, help="tên file cần đóng gói")
    ap.add_argument("--font-css", help="file CSS @font-face tự host, nhúng thay cho Google Fonts")
    a = ap.parse_args()

    css = pathlib.Path(a.font_css).read_text(encoding="utf-8") if a.font_css else None
    for t in (a.trang or TRANG.keys()):
        p = dong_goi(t, css)
        print(f"{p}  ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
