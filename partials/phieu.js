/* Dữ liệu phiếu + bộ dựng thẻ, dùng chung cho trang tạo và trang phiếu.

   Nội dung phiếu nằm trong phần neo (#...) của địa chỉ dưới dạng base64url của
   JSON. Phần neo không được gửi lên máy chủ, nên lời nhắn không lọt vào log của
   GitHub Pages. */
var PHIEU = (function () {
  "use strict";

  var MEO = ["meo-vay", "meo-sao", "meo-map", "meo-ngu"];
  var MEO_TEN = { "meo-vay": "Mèo vẫy tay", "meo-sao": "Mèo ôm sao", "meo-map": "Mèo mập", "meo-ngu": "Mèo ngủ" };
  var TAG_B64 = "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";

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
      '<div class="dau-the"><span class="nhan-the">Phiếu bé ngoan</span>' +
      '<div class="tag-treo" aria-hidden="true"><div class="tag-day"></div>' +
      '<img class="tag-anh" src="data:image/jpeg;base64,' + PHIEU._TAG_B64 + '" alt=""></div></div>' +
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

    // khoá theo từng phiếu: mỗi liên kết khác nhau là một phiếu riêng
    var khoa = "pbn-dung-" + (location.hash || "#mac-dinh");
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
    _TAG_B64: TAG_B64,
    maHoa: maHoa, giaiMa: giaiMa, tuDiaChi: tuDiaChi, diaChiPhieu: diaChiPhieu,
    veThe: veThe, ganNutDung: ganNutDung
  };
})();
