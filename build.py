#!/usr/bin/env python3
"""Đóng gói hai trang nguồn thành HTML độc lập trong docs/ cho GitHub Pages.

    python3 build.py

tao-phieu.html       -> docs/index.html   (soạn phiếu, tạo mã QR và liên kết để gửi)
trang-qr.html        -> docs/qr.html     (trang người nhận mở: chỉ có mã QR để quét)
phieu-be-ngoan.html  -> docs/phieu.html   (tấm phiếu, đích của mã QR)

Hai file nguồn viết theo dạng "chỉ phần nội dung" (không có <!doctype>/<head>/
<body>) và dùng chỉ thị {{include: đường/dẫn}} để chèn các mảnh chung trong
partials/. build.py bọc khung tài liệu và chèn các mảnh đó vào.
"""
import argparse
import pathlib
import re
import sys

GOC = pathlib.Path(__file__).parent
DOCS = GOC / "docs"

TRANG = {
    "tao-phieu.html": "index.html",
    "trang-qr.html": "qr.html",
    "phieu-be-ngoan.html": "phieu.html",
}

MO_TA = {
    "tao-phieu.html": "Làm phiếu bé ngoan: soạn nội dung, tạo mã QR và gửi liên kết cho người nhận.",
    "trang-qr.html": "Có người gửi bạn một tấm phiếu bé ngoan — quét mã QR để mở.",
    "phieu-be-ngoan.html": "Một tấm phiếu bé ngoan.",
}

KHUNG = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#F1FAF6">
<meta name="description" content="{mo_ta}">
<meta name="color-scheme" content="light">
<style>*{{margin:0;padding:0}}html,body{{min-height:100%}}svg,img{{max-width:100%}}</style>
{dau}
</head>
<body>
{than}
</body>
</html>
"""

# title/style có thẻ đóng, link là thẻ rỗng
HEAD_RE = re.compile(
    r"<title\b[^>]*>.*?</title>\s*|<style\b[^>]*>.*?</style>\s*|<link\b[^>]*>\s*",
    re.S | re.I,
)
INCLUDE_RE = re.compile(r"\{\{include:\s*([^}\s]+)\s*\}\}")
LA_FONT_GOOGLE = re.compile(r"fonts\.(googleapis|gstatic)\.com", re.I)


def chen_manh(src: str, sau: int = 0) -> str:
    """Thay mọi {{include: ...}} bằng nội dung file, cho phép lồng nhau."""
    if sau > 8:
        sys.exit("Chỉ thị include lồng quá sâu — có vòng lặp?")

    def thay(m: re.Match) -> str:
        p = GOC / m.group(1)
        if not p.is_file():
            sys.exit(f"Không tìm thấy mảnh cần chèn: {m.group(1)}")
        return chen_manh(p.read_text(encoding="utf-8").rstrip("\n"), sau + 1)

    return INCLUDE_RE.sub(thay, src)


def dong_goi(ten: str, font_css: str | None = None) -> pathlib.Path:
    src = chen_manh((GOC / ten).read_text(encoding="utf-8"))
    dau_moi: list[str] = []

    def hut(m: re.Match) -> str:
        the = m.group(0).rstrip()
        if font_css and the.lower().startswith("<link") and LA_FONT_GOOGLE.search(the):
            return ""
        dau_moi.append(the)
        return ""

    # chỉ hút phần đầu file, dừng khi gặp thẻ nội dung đầu tiên
    cat = min((i for i in (src.find("\n<div"), src.find("\n<main"), src.find("\n<svg")) if i != -1),
              default=-1)
    dau_phan, than_phan = (src[:cat], src[cat:]) if cat != -1 else (src, "")
    dau_phan = HEAD_RE.sub(hut, dau_phan)

    if font_css:
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
    ap.add_argument("trang", nargs="*", default=None, help="tên file nguồn cần đóng gói")
    ap.add_argument("--font-css", help="file CSS @font-face tự host, nhúng thay cho Google Fonts")
    a = ap.parse_args()

    css = pathlib.Path(a.font_css).read_text(encoding="utf-8") if a.font_css else None
    for t in (a.trang or TRANG.keys()):
        p = dong_goi(t, css)
        print(f"{p}  ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
