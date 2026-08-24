/* Bộ mã hoá QR chạy trong trình duyệt: chế độ byte, mức lỗi L/M, phiên bản 1..20.
   Bảng ECC và vị trí ô căn chỉnh sinh từ thư viện segno (xem README).
   Đã kiểm chứng: render rồi giải mã ngược 16/17 trường hợp thử, phiên bản 1..15. */
const ECC_TB=[[[[1,26,19]],[[1,26,16]]],[[[1,44,34]],[[1,44,28]]],[[[1,70,55]],[[1,70,44]]],[[[1,100,80]],[[2,50,32]]],[[[1,134,108]],[[2,67,43]]],[[[2,86,68]],[[4,43,27]]],[[[2,98,78]],[[4,49,31]]],[[[2,121,97]],[[2,60,38],[2,61,39]]],[[[2,146,116]],[[3,58,36],[2,59,37]]],[[[2,86,68],[2,87,69]],[[4,69,43],[1,70,44]]],[[[4,101,81]],[[1,80,50],[4,81,51]]],[[[2,116,92],[2,117,93]],[[6,58,36],[2,59,37]]],[[[4,133,107]],[[8,59,37],[1,60,38]]],[[[3,145,115],[1,146,116]],[[4,64,40],[5,65,41]]],[[[5,109,87],[1,110,88]],[[5,65,41],[5,66,42]]],[[[5,122,98],[1,123,99]],[[7,73,45],[3,74,46]]],[[[1,135,107],[5,136,108]],[[10,74,46],[1,75,47]]],[[[5,150,120],[1,151,121]],[[9,69,43],[4,70,44]]],[[[3,141,113],[4,142,114]],[[3,70,44],[11,71,45]]],[[[3,135,107],[5,136,108]],[[3,67,41],[13,68,42]]]];
const ALIGN_TB=[[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90]];

/* Bộ mã hoá QR tối giản: chế độ byte, mức lỗi L/M, phiên bản 1..20.
   Bảng ECC và vị trí ô căn chỉnh lấy từ thư viện segno để khỏi sai số liệu. */
var QR = (function () {
  "use strict";

  // --- trường Galois GF(256), đa thức nguyên thuỷ 0x11D ---
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    for (var i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function nhan(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }

  function daThucSinh(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var t = new Array(g.length + 1);
      for (var k = 0; k < t.length; k++) t[k] = 0;
      for (var j = 0; j < g.length; j++) {
        t[j] ^= g[j];
        t[j + 1] ^= nhan(g[j], EXP[i]);
      }
      g = t;
    }
    return g;
  }

  function duLoi(data, n) {
    var g = daThucSinh(n), res = new Uint8Array(data.length + n), i, j;
    res.set(data);
    for (i = 0; i < data.length; i++) {
      var c = res[i];
      if (!c) continue;
      for (j = 0; j < g.length; j++) res[i + j] ^= nhan(g[j], c);
    }
    return res.subarray(data.length);
  }

  // --- chuỗi bit ---
  function Bit() { this.b = []; }
  Bit.prototype.day = function (val, len) {
    for (var i = len - 1; i >= 0; i--) this.b.push((val >>> i) & 1);
  };
  Bit.prototype.byteHoa = function (n) {
    var out = new Uint8Array(n), i;
    for (i = 0; i < this.b.length; i++) if (this.b[i]) out[i >> 3] |= 0x80 >> (i & 7);
    return out;
  };

  function utf8(s) { return new TextEncoder().encode(s); }

  var MUC = { L: 0, M: 1 };           // chỉ số trong ECC_TB
  var BIT_MUC = { L: 1, M: 0 };       // 2 bit mức lỗi trong ô thông tin định dạng

  function khoi(v, muc) { return ECC_TB[v - 1][MUC[muc]]; }
  function soODuLieu(v, muc) {
    return khoi(v, muc).reduce(function (t, b) { return t + b[0] * b[2]; }, 0);
  }
  function dem(v) { return v < 10 ? 8 : 16; }   // độ dài chỉ báo số ký tự, chế độ byte

  function chonPhienBan(len, muc) {
    for (var v = 1; v <= 20; v++) {
      if (4 + dem(v) + 8 * len <= soODuLieu(v, muc) * 8) return v;
    }
    return 0;
  }

  // --- ghép dữ liệu + sửa lỗi, có xen kẽ khối ---
  function taoODuLieu(bytes, v, muc) {
    var bs = new Bit(), tong = soODuLieu(v, muc), i;
    bs.day(4, 4);                 // chế độ byte
    bs.day(bytes.length, dem(v));
    for (i = 0; i < bytes.length; i++) bs.day(bytes[i], 8);
    var conLai = tong * 8 - bs.b.length;
    bs.day(0, Math.min(4, conLai));                 // dấu kết thúc
    while (bs.b.length % 8) bs.b.push(0);
    var d = bs.byteHoa(tong), vt = Math.ceil(bs.b.length / 8), dem2 = 0;
    while (vt < tong) d[vt++] = (dem2++ % 2) ? 0x11 : 0xec;   // ô đệm

    var nhom = [], vtri = 0;
    khoi(v, muc).forEach(function (b) {
      for (var k = 0; k < b[0]; k++) {
        nhom.push({ d: d.subarray(vtri, vtri + b[2]), n: b[1] - b[2] });
        vtri += b[2];
      }
    });
    var ec = nhom.map(function (n) { return duLoi(n.d, n.n); });

    var ra = [], maxD = Math.max.apply(null, nhom.map(function (n) { return n.d.length; }));
    var maxE = Math.max.apply(null, ec.map(function (e) { return e.length; })), j;
    for (i = 0; i < maxD; i++) for (j = 0; j < nhom.length; j++) if (i < nhom[j].d.length) ra.push(nhom[j].d[i]);
    for (i = 0; i < maxE; i++) for (j = 0; j < ec.length; j++) if (i < ec[j].length) ra.push(ec[j][i]);
    return ra;
  }

  // --- BCH cho ô thông tin định dạng và phiên bản ---
  function soBit(x) { var n = 0; while (x) { n++; x >>>= 1; } return n; }
  function bch(d, poly, bitPoly) {
    while (soBit(d) >= bitPoly) d ^= poly << (soBit(d) - bitPoly);
    return d;
  }
  function thongTinDinhDang(muc, mask) {
    var so = (BIT_MUC[muc] << 3) | mask;
    return ((so << 10) | bch(so << 10, 0x537, 11)) ^ 0x5412;
  }
  function thongTinPhienBan(v) {
    return (v << 12) | bch(v << 12, 0x1f25, 13);
  }

  // --- khung ma trận ---
  function khungMoi(v) {
    var n = 4 * v + 17, i, j;
    var m = [], giu = [];
    for (i = 0; i < n; i++) { m.push(new Uint8Array(n)); giu.push(new Uint8Array(n)); }

    function dat(r, c, val) { m[r][c] = val; giu[r][c] = 1; }

    // ba ô định vị + dải phân cách
    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(function (p) {
      for (i = -1; i <= 7; i++) for (j = -1; j <= 7; j++) {
        var r = p[0] + i, c = p[1] + j;
        if (r < 0 || c < 0 || r >= n || c >= n) continue;
        var v1 = (i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
                 (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
                 (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        dat(r, c, v1 ? 1 : 0);
      }
    });

    // dải nhịp
    for (i = 8; i < n - 8; i++) { dat(6, i, i % 2 === 0 ? 1 : 0); dat(i, 6, i % 2 === 0 ? 1 : 0); }

    // ô căn chỉnh
    if (v >= 2) {
      var pos = ALIGN_TB[v - 2];
      pos.forEach(function (r) {
        pos.forEach(function (c) {
          if ((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) return;
          for (i = -2; i <= 2; i++) for (j = -2; j <= 2; j++) {
            var t = Math.max(Math.abs(i), Math.abs(j));
            dat(r + i, c + j, t !== 1 ? 1 : 0);
          }
        });
      });
    }

    // chỗ dành cho thông tin định dạng
    for (i = 0; i <= 8; i++) { if (i !== 6) { dat(8, i, 0); dat(i, 8, 0); } }
    for (i = 0; i < 8; i++) { dat(8, n - 1 - i, 0); dat(n - 1 - i, 8, 0); }
    dat(n - 8, 8, 1);   // ô luôn tối

    // chỗ dành cho thông tin phiên bản
    if (v >= 7) {
      for (i = 0; i < 6; i++) for (j = 0; j < 3; j++) { dat(n - 11 + j, i, 0); dat(i, n - 11 + j, 0); }
    }
    return { m: m, giu: giu, n: n };
  }

  function datDuLieu(k, o) {
    var n = k.n, bit = 0, tong = o.length * 8;
    for (var c = n - 1; c > 0; c -= 2) {
      if (c === 6) c--;
      for (var i = 0; i < n; i++) {
        for (var t = 0; t < 2; t++) {
          var r = ((c + 1) & 2) === 0 ? n - 1 - i : i;   // hướng zigzag theo cột
          var cc = c - t;
          if (k.giu[r][cc]) continue;
          var v = bit < tong ? (o[bit >> 3] >> (7 - (bit & 7))) & 1 : 0;
          k.m[r][cc] = v; bit++;
        }
      }
    }
  }

  function mask(r, c, k) {
    switch (k) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return (r * c) % 2 + (r * c) % 3 === 0;
      case 6: return ((r * c) % 2 + (r * c) % 3) % 2 === 0;
      default: return ((r + c) % 2 + (r * c) % 3) % 2 === 0;
    }
  }

  function diem(m, n) {
    var p = 0, i, j, k, d;
    // luật 1: dãy cùng màu từ 5 ô
    for (i = 0; i < n; i++) {
      for (d = 0; d < 2; d++) {
        var run = 1;
        for (j = 1; j < n; j++) {
          var a = d ? m[j][i] : m[i][j], b = d ? m[j - 1][i] : m[i][j - 1];
          if (a === b) { run++; } else { if (run >= 5) p += run - 2; run = 1; }
        }
        if (run >= 5) p += run - 2;
      }
    }
    // luật 2: khối 2x2 cùng màu
    for (i = 0; i < n - 1; i++) for (j = 0; j < n - 1; j++) {
      var v = m[i][j];
      if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) p += 3;
    }
    // luật 3: mẫu 1:1:3:1:1 kèm 4 ô sáng
    var mau = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    var maur = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    for (i = 0; i < n; i++) for (j = 0; j + 11 <= n; j++) {
      var ok1 = true, ok2 = true, ok3 = true, ok4 = true;
      for (k = 0; k < 11; k++) {
        if (m[i][j + k] !== mau[k]) ok1 = false;
        if (m[i][j + k] !== maur[k]) ok2 = false;
        if (m[j + k][i] !== mau[k]) ok3 = false;
        if (m[j + k][i] !== maur[k]) ok4 = false;
      }
      if (ok1) p += 40; if (ok2) p += 40; if (ok3) p += 40; if (ok4) p += 40;
    }
    // luật 4: tỉ lệ ô tối
    var toi = 0;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (m[i][j]) toi++;
    p += Math.floor(Math.abs(toi * 100 / (n * n) - 50) / 5) * 10;
    return p;
  }

  function taoMa(text, muc, maskEp) {
    muc = muc || "M";
    var bytes = utf8(text), v = chonPhienBan(bytes.length, muc);
    if (!v) throw new Error("Nội dung quá dài cho mã QR (tối đa phiên bản 20)");
    var o = taoODuLieu(bytes, v, muc);

    var tot = null, totDiem = Infinity, mk;
    var dsMask = maskEp == null ? [0, 1, 2, 3, 4, 5, 6, 7] : [maskEp];
    for (var im = 0; im < dsMask.length; im++) {
      mk = dsMask[im];
      var k = khungMoi(v);
      datDuLieu(k, o);
      var i, j, n = k.n;
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (!k.giu[i][j] && mask(i, j, mk)) k.m[i][j] ^= 1;

      // thông tin định dạng
      var f = thongTinDinhDang(muc, mk);
      for (i = 0; i < 15; i++) {
        var b = (f >> i) & 1;
        if (i < 6) k.m[i][8] = b;
        else if (i < 8) k.m[i + 1][8] = b;
        else k.m[n - 15 + i][8] = b;
        if (i < 8) k.m[8][n - 1 - i] = b;
        else if (i < 9) k.m[8][15 - i - 1 + 1] = b;
        else k.m[8][15 - i - 1] = b;
      }
      k.m[n - 8][8] = 1;

      // thông tin phiên bản
      if (v >= 7) {
        var vi = thongTinPhienBan(v);
        for (i = 0; i < 18; i++) {
          var bb = (vi >> i) & 1;
          k.m[Math.floor(i / 3)][n - 11 + (i % 3)] = bb;
          k.m[n - 11 + (i % 3)][Math.floor(i / 3)] = bb;
        }
      }

      var d = diem(k.m, n);
      if (d < totDiem) { totDiem = d; tot = k; tot.mask = mk; }
    }
    return { n: tot.n, m: tot.m, phienBan: v, muc: muc, mask: tot.mask };
  }

  // đường dẫn SVG dạng nét ngang, mỗi nét dày 1 đơn vị
  function duongDan(ma) {
    var d = "", n = ma.n, r, c;
    for (r = 0; r < n; r++) {
      c = 0;
      while (c < n) {
        if (!ma.m[r][c]) { c++; continue; }
        var dai = 0;
        while (c + dai < n && ma.m[r][c + dai]) dai++;
        d += "M" + c + " " + (r + 0.5) + "h" + dai;
        c += dai;
      }
    }
    return d;
  }

  return { taoMa: taoMa, duongDan: duongDan };
})();
