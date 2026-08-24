/* Pháo giấy chào phiếu: hai vòi phun từ hai góc dưới bắn chéo vào giữa, chạy 5
   giây rồi mờ dần và tự xoá canvas khỏi trang. Vẽ tay trên canvas, không dùng
   thư viện ngoài. */
(function () {
  "use strict";


  var MAU = ["#17B195", "#FF9E86", "#FFC95C", "#B9AEFF", "#B6EFE1", "#FFFFFF"];
  var TONG = 5000;    // tổng thời gian sống
  var TAT = 800;      // khoảng cuối dùng để mờ dần
  var TRONG_LUC = 0.17;

  var cv = document.createElement("canvas");
  cv.className = "phao";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);

  var ctx = cv.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  function coLai() {
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  coLai();
  window.addEventListener("resize", coLai);

  var hat = [];

  function phun(x, y, huong, so) {
    for (var i = 0; i < so; i++) {
      var goc = huong + (Math.random() - 0.5) * 0.9;
      var toc = 22 + Math.random() * 20;
      hat.push({
        x: x, y: y,
        vx: Math.cos(goc) * toc,
        vy: Math.sin(goc) * toc,
        ngang: 4 + Math.random() * 5,
        doc: 8 + Math.random() * 10,
        mau: MAU[(Math.random() * MAU.length) | 0],
        quay: Math.random() * Math.PI * 2,
        vquay: (Math.random() - 0.5) * 0.32,
        tron: Math.random() < 0.26,
        lac: Math.random() * Math.PI * 2,
        vlac: 0.05 + Math.random() * 0.06
      });
    }
  }

  // các loạt phun: [thời điểm, từ đâu, hướng, số hạt]
  var LOAT = [
    [0,    "trai",  -1.10,  60],
    [0,    "phai",  -2.04,  60],
    [250,  "trai",  -1.25,  35],
    [250,  "phai",  -1.89,  35],
    [600,  "giua",  -1.57,  40],
    [1000, "trai",  -1.05,  28],
    [1000, "phai",  -2.09,  28],
    [1600, "giua",  -1.57,  30],
    [2200, "trai",  -1.18,  20],
    [2200, "phai",  -1.96,  20]
  ];
  var daPhun = LOAT.map(function () { return false; });

  var batDau = null;

  function khung(nay) {
    if (batDau === null) batDau = nay;
    var troi = nay - batDau;

    LOAT.forEach(function (l, i) {
      if (daPhun[i] || troi < l[0]) return;
      daPhun[i] = true;
      var x = l[1] === "trai" ? -12 : l[1] === "phai" ? W + 12 : W / 2;
      var y = l[1] === "giua" ? H + 12 : H - 10;
      phun(x, y, l[2], l[3]);
    });

    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = troi > TONG - TAT ? Math.max(0, (TONG - troi) / TAT) : 1;

    for (var i = hat.length - 1; i >= 0; i--) {
      var h = hat[i];
      h.vy += TRONG_LUC;
      h.vx *= 0.985;
      h.vy *= 0.996;
      h.lac += h.vlac;
      h.x += h.vx + Math.sin(h.lac) * 0.7;
      h.y += h.vy;
      h.quay += h.vquay;

      if (h.y - 40 > H) { hat.splice(i, 1); continue; }

      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.quay);
      ctx.fillStyle = h.mau;
      if (h.tron) {
        ctx.beginPath();
        ctx.arc(0, 0, h.ngang * 0.62, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-h.ngang / 2, -h.doc / 2, h.ngang, h.doc);
      }
      ctx.restore();
    }

    if (troi >= TONG) {
      window.removeEventListener("resize", coLai);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
      return;
    }
    requestAnimationFrame(khung);
  }

  requestAnimationFrame(khung);
})();
