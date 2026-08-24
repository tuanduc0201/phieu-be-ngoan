/* Dữ liệu phiếu + bộ dựng thẻ, dùng chung cho trang tạo và trang phiếu.

   Nội dung phiếu nằm trong phần neo (#...) của địa chỉ dưới dạng base64url của
   JSON. Phần neo không được gửi lên máy chủ, nên lời nhắn không lọt vào log của
   GitHub Pages. */
var PHIEU = (function () {
  "use strict";

  var MEO = ["meo-tim", "meo-map", "meo-vay", "meo-ngu"];
  var MEO_TEN = { "meo-tim": "Mèo ôm tim", "meo-map": "Mèo mập", "meo-vay": "Mèo vẫy tay", "meo-ngu": "Mèo ngủ" };

  var GOI_Y_LOI = [
    "ăn hết suất dù không thích rau",
    "đi ngủ trước mười hai giờ, ba đêm liền",
    "kiên nhẫn nghe anh kể chuyện công việc suốt bốn mươi phút",
    "không dỗi khi anh về muộn",
    "tự giác uống đủ nước cả tuần",
    "cười thật khi anh kể chuyện cười nhạt"
  ];
  var GOI_Y_THUONG = [
    "một lần được chọn phim, không được cãi",
    "một bữa ăn tuỳ chọn, anh trả",
    "một cái ôm mười phút, không nói gì",
    "một buổi ngủ nướng, anh dọn nhà",
    "một lời xin lỗi vô điều kiện"
  ];

  function homNay() {
    var d = new Date(), hai = function (x) { return (x < 10 ? "0" : "") + x; };
    return hai(d.getDate()) + "." + hai(d.getMonth() + 1) + "." + d.getFullYear();
  }

  function macDinh() {
    return {
      t: "Người Thương",
      l: GOI_Y_LOI[2],
      r: GOI_Y_THUONG[0],
      g: "Anh",
      s: "5",
      c: "meo-tim",
      n: homNay()
    };
  }

  // --- mã hoá / giải mã phần neo ---
  function b64url(s) {
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function unB64url(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return atob(s);
  }
  function nhiPhanSangChuoi(u8) {
    var s = "", i;
    for (i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return s;
  }

  function maHoa(d) {
    var gon = {}, k;
    var md = macDinh();
    for (k in d) if (d[k] && d[k] !== md[k]) gon[k] = d[k];   // chỉ ghi phần khác mặc định cho mã QR gọn
    if (!Object.keys(gon).length) return "";
    return b64url(nhiPhanSangChuoi(new TextEncoder().encode(JSON.stringify(gon))));
  }

  function giaiMa(neo) {
    var d = macDinh();
    if (!neo) return d;
    try {
      var raw = unB64url(neo.replace(/^#/, ""));
      var u8 = new Uint8Array(raw.length), i;
      for (i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
      var o = JSON.parse(new TextDecoder().decode(u8));
      for (i in o) if (typeof o[i] === "string" || typeof o[i] === "number") d[i] = String(o[i]);
    } catch (e) { /* neo hỏng thì dùng mặc định */ }
    return d;
  }

  function tuDiaChi() { return giaiMa(location.hash); }

  function diaChiPhieu(goc, d) {
    var m = maHoa(d);
    return goc + (m ? "#" + m : "");
  }

  // --- dựng thẻ ---
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function soPhieu(d) {
    var s = (d.t || "") + "|" + (d.l || ""), h = 7, i;
    for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
    return "Số " + ("00" + (h % 999 + 1)).slice(-3);
  }

  function timHtml(n) {
    n = Math.max(0, Math.min(5, parseInt(n, 10) || 0));
    var s = "", i;
    for (i = 1; i <= 5; i++) {
      s += '<svg viewBox="0 0 32 30" class="' + (i <= n ? "bat" : "tat") +
           '" fill="' + (i <= n ? "#FF5E7A" : "#F7EFE8") + '" aria-hidden="true"><use href="#tim"/></svg>';
    }
    return s;
  }

  function meoHtml(c) {
    if (MEO.indexOf(c) < 0) c = "meo-tim";
    var phu = c === "meo-ngu" ? "meo-map" : "meo-ngu";
    return '<div class="meo meo-1"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#' + c + '"/></svg></div>' +
           '<div class="meo meo-2"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#' + phu + '"/></svg></div>' +
           '<div class="meo meo-3"><svg viewBox="0 0 32 30" fill="#FF5E7A" aria-hidden="true"><use href="#tim"/></svg></div>';
  }

  function veThe(el, d) {
    var n = Math.max(0, Math.min(5, parseInt(d.s, 10) || 0));
    el.innerHTML =
      '<div class="dau-the"><span class="nhan-the">Phiếu bé ngoan</span></div>' +
      '<p class="trao">Trao cho</p>' +
      '<h1 class="ten">' + esc(d.t || macDinh().t) + '</h1>' +
      '<div class="tim" role="img" aria-label="' + n + ' trên 5 tim">' + timHtml(n) + '</div>' +
      '<p class="vi"><span>Vì đã</span>' + esc(d.l) + '</p>' +
      (d.r ? '<div class="doi"><span class="doi-nhan">Đổi được</span>' +
             '<strong class="doi-noi">' + esc(d.r) + '</strong></div>' : '') +
      '<div class="chan-the">' +
        '<div><span class="nhan-nho">Người trao</span><b>' + esc(d.g) + '</b></div>' +
        '<div class="ngay"><span class="nhan-nho">Ngày</span><b>' + esc(d.n) + '</b></div>' +
      '</div>' +
      '<div class="hieu-luc"><span class="so-the">' + esc(soPhieu(d)) + '</span>' +
      ' · vô thời hạn · không hoàn lại</div>' +
      meoHtml(d.c);
  }

  return {
    MEO: MEO, MEO_TEN: MEO_TEN,
    GOI_Y_LOI: GOI_Y_LOI, GOI_Y_THUONG: GOI_Y_THUONG,
    macDinh: macDinh, homNay: homNay,
    maHoa: maHoa, giaiMa: giaiMa, tuDiaChi: tuDiaChi, diaChiPhieu: diaChiPhieu,
    veThe: veThe
  };
})();
