/* Dữ liệu phiếu + bộ dựng thẻ, dùng chung cho trang tạo và trang phiếu.

   Nội dung phiếu nằm trong phần neo (#...) của địa chỉ dưới dạng base64url của
   JSON. Phần neo không được gửi lên máy chủ, nên lời nhắn không lọt vào log của
   GitHub Pages. */
var PHIEU = (function () {
  "use strict";

  var MEO = ["meo-vay", "meo-sao", "meo-map", "meo-ngu"];
  var MEO_TEN = { "meo-vay": "Mèo vẫy tay", "meo-sao": "Mèo ôm sao", "meo-map": "Mèo mập", "meo-ngu": "Mèo ngủ" };

  /* Nơi nhận thư khi người ta bấm "Sử dụng". FormSubmit không cần tài khoản,
     nhưng lần gửi đầu tiên nó chỉ gửi thư kích hoạt tới địa chỉ này — phải bấm
     liên kết trong thư đó thì các lần sau mới nhận được nội dung.
     Sau khi kích hoạt, FormSubmit cho một mã ẩn dùng thay địa chỉ email, thay
     vào đây để email không lộ trong mã nguồn trang. */
  var NOI_NHAN = "luutuanduc020201@gmail.com";
  var URL_GUI = "https://formsubmit.co/ajax/" + NOI_NHAN;

  var GOI_Y_LOI = [
    "làm xong việc khó mà không càu nhàu",
    "đi ngủ trước mười hai giờ, ba đêm liền",
    "uống hết bình nước trước bốn giờ chiều",
    "dọn xong cái bàn làm việc bừa cả tuần",
    "trả lời tin nhắn ngay, không để cách hôm",
    "nhớ ăn sáng ba ngày liền"
  ];
  var GOI_Y_THUONG = [
    "một lần được chọn quán ăn",
    "một buổi không bị nhắc việc",
    "một ly trà sữa, cỡ lớn",
    "một lần được đổi ý, không bị hỏi tại sao",
    "một buổi tối không ai làm phiền"
  ];

  function homNay() {
    var d = new Date(), hai = function (x) { return (x < 10 ? "0" : "") + x; };
    return hai(d.getDate()) + "." + hai(d.getMonth() + 1) + "." + d.getFullYear();
  }

  function macDinh() {
    return {
      t: "Bạn Ngoan",
      l: GOI_Y_LOI[0],
      r: GOI_Y_THUONG[0],
      g: "Ban Phát Phiếu",
      so: "1",
      s: "5",
      c: "meo-vay",
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

  function saoHtml(n) {
    n = Math.max(0, Math.min(5, parseInt(n, 10) || 0));
    var s = "", i;
    for (i = 1; i <= 5; i++) {
      s += '<svg viewBox="0 0 32 30" class="' + (i <= n ? "bat" : "tat") +
           '" fill="' + (i <= n ? "#FFC95C" : "#163B36") + '" aria-hidden="true"><use href="#sao"/></svg>';
    }
    return s;
  }

  function meoHtml(c) {
    if (MEO.indexOf(c) < 0) c = "meo-vay";
    var phu = c === "meo-ngu" ? "meo-map" : "meo-ngu";
    return '<div class="meo meo-1"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#' + c + '"/></svg></div>' +
           '<div class="meo meo-2"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#' + phu + '"/></svg></div>' +
           '<div class="meo meo-3"><svg viewBox="0 0 32 30" fill="#FFC95C" aria-hidden="true"><use href="#sao"/></svg></div>';
  }

  function veThe(el, d, xemTruoc) {
    var n = Math.max(0, Math.min(5, parseInt(d.s, 10) || 0));
    el.innerHTML =
      '<div class="dau-the"><span class="nhan-the">Phiếu bé ngoan</span></div>' +
      '<p class="trao">Trao cho</p>' +
      '<h1 class="ten">' + esc(d.t || macDinh().t) + '</h1>' +
      '<div class="sao" role="img" aria-label="' + n + ' trên 5 sao">' + saoHtml(n) + '</div>' +
      '<p class="vi"><span>Vì đã</span>' + esc(d.l) + '</p>' +
      (d.r ? '<div class="doi"><span class="doi-nhan">Đổi được</span>' +
             '<strong class="doi-noi">' + esc(d.r) + '</strong>' +
             '<button type="button" class="nut-dung" id="nut-dung"' +
             (xemTruoc ? ' disabled title="Người nhận phiếu mới bấm được nút này"' : '') +
             '>Sử dụng</button>' +
             '<span class="trang-thai" id="trang-thai" role="status"></span></div>' : '') +
      '<div class="chan-the">' +
        '<div><span class="nhan-nho">Người trao</span><b>' + esc(d.g) + '</b></div>' +
        '<div class="ngay"><span class="nhan-nho">Ngày</span><b>' + esc(d.n) + '</b></div>' +
      '</div>' +
      '<div class="hieu-luc"><span class="so-the">Số ' + esc(d.so || "1") + '</span>' +
      ' · vô thời hạn · không hoàn lại</div>' +
      meoHtml(d.c);
  }

  /* ---------- nút "Sử dụng" ---------- */

  function gioPhut(dt) {
    var hai = function (x) { return (x < 10 ? "0" : "") + x; };
    return hai(dt.getHours()) + ":" + hai(dt.getMinutes()) + " · " +
           hai(dt.getDate()) + "." + hai(dt.getMonth() + 1) + "." + dt.getFullYear();
  }

  /* FormSubmit trả lỗi bằng tiếng Anh, đổi sang tiếng Việt cho người nhận đọc */
  function loiTiengViet(msg) {
    msg = String(msg || "");
    if (/activat/i.test(msg)) {
      return "Hộp thư nhận chưa được kích hoạt, nên chưa báo được. Nhắn người trao phiếu kiểm tra email giúp nhé.";
    }
    if (/web server/i.test(msg)) {
      return "Trang đang mở từ file trên máy nên không gửi được — mở bằng đường dẫn trên mạng nhé.";
    }
    return "Chưa gửi được, thử lại nhé.";
  }

  function khoaNut(nut, luc) {
    nut.disabled = true;
    nut.classList.add("da-dung");
    nut.textContent = "Đã dùng lúc " + luc;
  }

  function ganNutDung(d) {
    var nut = document.getElementById("nut-dung");
    var tt = document.getElementById("trang-thai");
    if (!nut) return;

    var khoa = "pbn-dung-so-" + (d.so || "1");
    try {
      var cu = localStorage.getItem(khoa);
      if (cu) { khoaNut(nut, cu); return; }
    } catch (e) { /* không có bộ nhớ thì thôi */ }

    nut.addEventListener("click", function () {
      var luc = gioPhut(new Date());
      nut.disabled = true;
      nut.textContent = "Đang gửi…";
      tt.textContent = "";

      fetch(URL_GUI, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Phiếu bé ngoan: " + (d.t || "") + " đã dùng phần thưởng",
          _template: "table",
          _captcha: "false",
          "Phần thưởng": d.r,
          "Bấm sử dụng lúc": luc,
          "Trao cho": d.t,
          "Người trao": d.g,
          "Ngày trên phiếu": d.n,
          "Số phiếu": d.so
        })
      }).then(function (r) {
        return r.json().catch(function () { return {}; });
      }).then(function (kq) {
        if (kq && String(kq.success) === "true") {
          try { localStorage.setItem(khoa, luc); } catch (e) { /* bỏ qua */ }
          khoaNut(nut, luc);
          tt.textContent = "Đã báo cho người trao phiếu.";
        } else {
          nut.disabled = false;
          nut.textContent = "Sử dụng";
          tt.textContent = loiTiengViet(kq && kq.message);
        }
      }).catch(function () {
        nut.disabled = false;
        nut.textContent = "Sử dụng";
        tt.textContent = "Chưa gửi được — kiểm tra mạng rồi thử lại nhé.";
      });
    });
  }

  return {
    MEO: MEO, MEO_TEN: MEO_TEN,
    GOI_Y_LOI: GOI_Y_LOI, GOI_Y_THUONG: GOI_Y_THUONG,
    macDinh: macDinh, homNay: homNay,
    maHoa: maHoa, giaiMa: giaiMa, tuDiaChi: tuDiaChi, diaChiPhieu: diaChiPhieu,
    veThe: veThe, ganNutDung: ganNutDung
  };
})();
