#!/usr/bin/env python3
"""Trỏ mã QR và nút dự phòng trong quet-phieu-be-ngoan.html sang một địa chỉ mới.

    python3.9 set_target.py https://tunv-nws.github.io/phieu-be-ngoan/phieu.html

Cần thư viện segno (python3.9 -m pip install --user segno). Sau khi chạy, nhớ
build lại: python3 build.py
"""
import pathlib
import re
import sys

TRANG_QR = pathlib.Path(__file__).parent / "quet-phieu-be-ngoan.html"


def sinh_path(url: str) -> tuple[str, int]:
    try:
        import segno
    except ImportError:
        sys.exit("Thiếu thư viện segno. Cài bằng: python3.9 -m pip install --user segno")
    import io

    qr = segno.make(url, error="m")
    buf = io.BytesIO()
    qr.save(buf, kind="svg", scale=1, border=0, dark="#000", light=None,
            xmldecl=False, svgns=False, omitsize=True, svgclass=None, lineclass=None)
    d = re.search(r'<path[^>]*d="([^"]+)"', buf.getvalue().decode()).group(1)
    return d, qr.symbol_size(scale=1, border=0)[0]


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    url = sys.argv[1]
    d, n = sinh_path(url)
    # vùng lặng 4 module quanh mã theo chuẩn QR, thiếu là máy quét dễ trượt
    vien = 4
    s = TRANG_QR.read_text(encoding="utf-8")
    s, n_vb = re.subn(r'viewBox="-\d+ -\d+ \d+ \d+"(?=[^>]*class="qr")|(?<=class="qr" )viewBox="-\d+ -\d+ \d+ \d+"',
                      f'viewBox="{-vien} {-vien} {n + 2 * vien} {n + 2 * vien}"', s)
    s, n_rect = re.subn(r'<rect x="-\d+" y="-\d+" width="\d+" height="\d+" fill="#FFFDF8"/>',
                        f'<rect x="{-vien}" y="{-vien}" width="{n + 2 * vien}" '
                        f'height="{n + 2 * vien}" fill="#FFFDF8"/>', s)
    s, n_path = re.subn(r'(<path d=")[^"]+(" fill="none" stroke="currentColor" stroke-width="1")',
                        lambda m: m.group(1) + d + m.group(2), s)
    s, n_href = re.subn(r'(<a class="btn" href=")[^"]+(")', lambda m: m.group(1) + url + m.group(2), s)
    TRANG_QR.write_text(s, encoding="utf-8")
    print(f"{TRANG_QR.name}: mã {n}x{n} module -> {url}")
    print(f"  thay: viewBox={n_vb}, nền={n_rect}, đường dẫn mã={n_path}, nút dự phòng={n_href}")
    if not all((n_vb, n_rect, n_path, n_href)):
        sys.exit("Có phần không thay được — kiểm tra lại markup trang QR.")


if __name__ == "__main__":
    main()
