// ============================================================
//  CATÁLOGO AL HARAMAIN — LÓGICA
// ============================================================

var qtyMap = {};                  // { id: cantidad }
var selectedCat = null;           // categoría activa (Perfume / Estuches)
var stockMap = {};                // { code: stock } (en vivo desde Supabase)
var BY_ID = {};
PRODUCTS.forEach(function (p) {
  BY_ID[p.id] = p;
  if (p.stock !== null && p.stock !== undefined) stockMap[p.code] = p.stock;
});

function $(s) { return document.querySelector(s); }
function money(n) { return "₡" + Math.round(n).toLocaleString("es-CR"); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function stockOf(p) { var v = stockMap[p.code]; return (v === undefined || v === null) ? null : parseInt(v); }

// ---------------- TEMA ----------------
function applyThemeIcon() {
  var b = document.getElementById("themeToggle");
  if (b) b.textContent = document.body.classList.contains("dark") ? "☀" : "☾";
}
function toggleTheme() {
  document.body.classList.toggle("dark");
  try { localStorage.setItem("ha_theme", document.body.classList.contains("dark") ? "dark" : "light"); } catch (e) {}
  applyThemeIcon();
}

// ---------------- CATEGORÍAS ----------------
function categorias() {
  var set = {};
  PRODUCTS.forEach(function (p) { set[p.cat] = (set[p.cat] || 0) + 1; });
  return set;
}
function renderCats() {
  var wrap = $("#categoryTiles");
  var counts = categorias();
  wrap.innerHTML = Object.keys(counts).map(function (cat) {
    var activa = selectedCat === cat;
    return '<button type="button" class="category-tile' + (activa ? " active" : "") +
      '" onclick="toggleCat(\'' + cat + '\')" aria-pressed="' + activa + '">' +
      '<span class="category-tile-label">' + cat + '</span>' +
      '<span class="category-tile-count">' + (activa ? "✕" : counts[cat]) + '</span></button>';
  }).join("");
}
function toggleCat(cat) {
  selectedCat = (selectedCat === cat) ? null : cat;
  renderCats();
  render();
}

// ---------------- GRID / TARJETAS ----------------
function visibles() {
  var q = ($("#search").value || "").toLowerCase().trim();
  return PRODUCTS.filter(function (p) {
    if (selectedCat && p.cat !== selectedCat) return false;
    if (q && p.name.toLowerCase().indexOf(q) < 0 && p.code.indexOf(q) < 0) return false;
    return true;
  });
}

function cardHTML(p) {
  var st = stockOf(p);
  var agotado = (st !== null && st <= 0);
  var stockPill = (st === null)
    ? '<div class="ha-stock unknown">Consultar disponibilidad</div>'
    : (agotado
        ? '<div class="ha-stock out">● Agotado</div>'
        : '<div class="ha-stock ok">● En stock: ' + st + ' u</div>');
  var q = qtyMap[p.id] || 0;
  var cls = "card" + (q > 0 ? " has-qty" : "") + (agotado ? " agotado" : "");
  var foto = p.img
    ? '<img src="img/p' + p.code + '.webp?v=' + CONFIG.IMG_VERSION + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.parentNode.innerHTML=haMono()">'
    : haMono();
  var qtyCtrl = agotado
    ? '<span class="lbl">Sin stock disponible</span>'
    : '<span class="lbl">Pedir</span><div class="stepper">' +
        '<button type="button" onclick="changeQty(' + p.id + ',-1)" aria-label="Quitar uno">−</button>' +
        '<input type="number" min="0" inputmode="numeric" value="' + q + '" id="qty-' + p.id + '" onchange="setQty(' + p.id + ',this.value)" onfocus="this.select()" aria-label="Cantidad">' +
        '<button type="button" onclick="changeQty(' + p.id + ',1)" aria-label="Agregar uno">+</button></div>';
  var sub = [p.cat, p.genero].filter(Boolean).join(" · ");
  var notas = (p.notes && p.notes.length)
    ? '<div class="ha-notes"><b>Notas:</b> ' + esc(p.notes.slice(0, 5).join(" · ")) + '</div>' : '';
  return '<article class="' + cls + '" id="card-' + p.id + '">' +
      '<div class="ha-code-chip">' + esc(p.code) + '</div>' +
      '<div class="photo-wrap" onclick="openLightbox(' + p.id + ',0)" role="button" tabindex="0" aria-label="Ver ficha de ' + esc(p.name) + '">' +
        foto + '<span class="zoom-hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"/></svg></span>' +
      '</div>' +
      '<div class="info">' +
        '<div class="meta"><span class="brand-tag">' + esc(p.brand) + '</span></div>' +
        '<h3 class="name">' + esc(p.name) + '</h3>' +
        (sub ? '<div class="ha-sub">' + esc(sub) + '</div>' : '') +
        stockPill +
        notas +
        '<div class="price-tag">' + money(p.price) + ' <small>c/u</small></div>' +
        '<div class="barcode-strip" onclick="openLightbox(' + p.id + ',1)" title="Ver código de barras"><svg class="bc-svg" id="bc-' + p.id + '" role="img" aria-label="Código ' + esc(p.code) + '"></svg></div>' +
        '<div class="qty-row">' + qtyCtrl + '</div>' +
      '</div></article>';
}

function haMono() { return '<div class="ha-ph"><span>AH</span></div>'; }

function render() {
  var grid = $("#grid");
  var lista = visibles();
  $("#count").textContent = lista.length + (lista.length === 1 ? " producto" : " productos");
  if (!lista.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin resultados</div><div class="empty-state-text">Probá con otro nombre o código.</div></div>';
    return;
  }
  grid.innerHTML = lista.map(cardHTML).join("");
  lista.forEach(function (p) {
    var el = document.getElementById("bc-" + p.id);
    if (el && typeof JsBarcode !== "undefined") {
      try { JsBarcode(el, p.code, { format: "CODE128", displayValue: true, fontSize: 14, textMargin: 2, width: 1.5, height: 40, margin: 4, font: "monospace" }); }
      catch (e) {}
    }
  });
}

// ---------------- CANTIDADES ----------------
function setQty(id, val) {
  var n = Math.max(0, parseInt(val) || 0);
  if (n === 0) delete qtyMap[id]; else qtyMap[id] = n;
  var card = document.getElementById("card-" + id);
  if (card) card.classList.toggle("has-qty", n > 0);
  var inp = document.getElementById("qty-" + id);
  if (inp) inp.value = n;
  updateBar();
}
function changeQty(id, d) {
  var cur = qtyMap[id] || 0;
  setQty(id, cur + d);
}

// ---------------- BARRA DE PEDIDO ----------------
function totales() {
  var u = 0, m = 0, l = 0;
  for (var id in qtyMap) { var p = BY_ID[id]; if (!p) continue; u += qtyMap[id]; m += qtyMap[id] * p.price; l++; }
  return { unidades: u, monto: m, lineas: l };
}
function updateBar() {
  var t = totales();
  $("#selCount").textContent = t.lineas;
  $("#selUnits").textContent = t.unidades;
  $("#selTotal").textContent = money(t.monto);
  $("#genBtn").disabled = t.lineas === 0;
  var badge = $("#reviewBadge");
  if (badge) { badge.style.display = t.lineas ? "" : "none"; badge.textContent = t.lineas; }
}

// ---------------- VENTANA "MI PEDIDO" ----------------
function openOrderReview() {
  var list = $("#orderList");
  var t = totales();
  if (!t.lineas) { list.innerHTML = '<div class="empty-state" style="padding:30px"><div class="empty-state-text">Todavía no has agregado productos.</div></div>'; }
  else {
    list.innerHTML = Object.keys(qtyMap).map(function (id) {
      var p = BY_ID[id];
      return '<div class="order-line" style="display:flex;justify-content:space-between;gap:12px;padding:10px 2px;border-bottom:1px solid var(--line);">' +
        '<div><div style="font-size:14px">' + esc(p.name) + '</div><div class="order-line-sub">' + qtyMap[id] + ' × ' + money(p.price) + '</div></div>' +
        '<div class="of-price">' + money(qtyMap[id] * p.price) + '</div></div>';
    }).join("");
  }
  $("#orderModalCount").textContent = t.lineas;
  $("#orderModalUnits").textContent = t.unidades;
  $("#orderModalTotal").textContent = money(t.monto);
  $("#orderModal").classList.add("open");
}
function closeOrderReview() { $("#orderModal").classList.remove("open"); }

// ---------------- DATOS DEL CLIENTE ----------------
function openCustomerModal() {
  if (!totales().lineas) { toast("Agregá al menos un producto"); return; }
  try { var s = JSON.parse(localStorage.getItem("ha_customer") || "{}"); $("#custName").value = s.name || ""; $("#custPhone").value = s.phone || ""; } catch (e) {}
  $("#custError").textContent = "";
  $("#customerModal").classList.add("open");
}
function closeCustomerModal() { $("#customerModal").classList.remove("open"); }
function confirmCustomerInfo() {
  var name = ($("#custName").value || "").trim();
  var phone = ($("#custPhone").value || "").trim();
  if (!name || !phone) { $("#custError").textContent = "Por favor completá tu nombre y teléfono."; return; }
  try { localStorage.setItem("ha_customer", JSON.stringify({ name: name, phone: phone })); } catch (e) {}
  window._lastCustomer = { name: name, phone: phone };
  closeCustomerModal();
  generateExcel();
}

// ---------------- GENERAR EXCEL (mismo formato que los demás catálogos) ----------------
function generateExcel() {
  if (typeof ExcelJS === "undefined") { toast("Librería Excel no disponible"); return; }
  var c = window._lastCustomer || { name: "", phone: "" };
  var wb = new ExcelJS.Workbook();
  var sheet = wb.addWorksheet("Pedido");
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 20;
  var head = sheet.addRow(["Codigo de barras", "Descripcion", "Cantidad"]);
  head.font = { bold: true };
  Object.keys(qtyMap).forEach(function (id) {
    var p = BY_ID[id];
    sheet.addRow([p.code, p.name, qtyMap[id]]);
  });
  wb.xlsx.writeBuffer().then(function (buf) {
    var blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var today = new Date().toISOString().slice(0, 10);
    var tag = c.name ? "_" + c.name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20) : "";
    a.href = url; a.download = "Pedido_AlHaramain" + tag + "_" + today + ".xlsx";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showThankYou();
    qtyMap = {};
    render(); updateBar();
  });
}

function showThankYou() { closeOrderReview(); $("#thanksModal").classList.add("open"); }
function hideThankYouModal() { $("#thanksModal").classList.remove("open"); openSellerModal(); }

// ---------------- VENDEDOR (WhatsApp) ----------------
function openSellerModal() {
  var list = $("#sellerList");
  list.innerHTML = (CONFIG.VENDEDORES || []).map(function (v, i) {
    var ini = (v.nombre || "").trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ""; }).join("").toUpperCase();
    return '<button type="button" class="seller-option" onclick="pickSeller(' + i + ')">' +
      '<span class="seller-avatar">' + esc(ini) + '</span>' +
      '<span class="seller-text"><b>' + esc(v.nombre) + '</b></span></button>';
  }).join("");
  $("#sellerModal").classList.add("open");
}
function closeSellerModal() { $("#sellerModal").classList.remove("open"); }
function pickSeller(i) {
  var v = (CONFIG.VENDEDORES || [])[i];
  if (!v) return;
  var tel = String(v.whatsapp || "").replace(/\D/g, "");
  var c = window._lastCustomer || { name: "" };
  if (tel.length >= 8) {
    var msg = "Buenas " + v.nombre + ", mi nombre es " + (c.name || "") + ", este es mi pedido de Al Haramain. (Adjunto el Excel que descargué.)";
    window.open("https://wa.me/" + tel + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  } else {
    toast("Enviale el Excel a " + v.nombre + " por WhatsApp");
  }
  closeSellerModal();
}

// ---------------- FICHA / LIGHTBOX ----------------
var _lbId = null;
function openLightbox(id, tab) {
  _lbId = id;
  var p = BY_ID[id];
  $("#lightboxInfo").innerHTML =
    '<div class="brand-tag" style="display:inline-block">' + esc(p.brand) + '</div>' +
    '<h3 style="font-family:var(--font-display);font-size:24px;margin:8px 0 2px">' + esc(p.name) + '</h3>' +
    '<div class="lb-price">' + money(p.price) + '</div>' +
    (function () {
      var st = stockOf(p);
      if (st === null) return '<div class="lb-stock unknown">Consultar disponibilidad</div>';
      if (st <= 0) return '<div class="lb-stock out">● Agotado</div>';
      return '<div class="lb-stock ok">● En stock: ' + st + ' unidades</div>';
    })() +
    ((p.notes && p.notes.length) ? '<div class="ha-notes" style="margin-top:10px"><b>Notas:</b> ' + esc(p.notes.join(" · ")) + '</div>' : '') +
    '<div style="color:var(--muted);font-size:13px;margin-top:8px">Código: ' + esc(p.code) + '</div>' +
    '<div style="color:var(--muted);font-size:13px">Categoría: ' + esc(p.cat) + (p.genero ? ' · ' + esc(p.genero) : '') + '</div>';
  $("#lightbox").classList.add("open");
  lightboxGoTo(tab || 0);
}
function lightboxGoTo(i, ev) {
  if (ev) ev.stopPropagation();
  var p = BY_ID[_lbId];
  var stage = $("#lightboxStage");
  document.querySelectorAll("#lightboxTabs button").forEach(function (b) { b.classList.toggle("active", parseInt(b.dataset.i) === i); });
  if (i === 1) {
    stage.innerHTML = '<svg id="lbBarcode" style="background:#fff;border-radius:8px;padding:10px;max-width:100%"></svg>';
    try { JsBarcode("#lbBarcode", p.code, { format: "CODE128", displayValue: true, fontSize: 18, width: 2, height: 90, margin: 10 }); } catch (e) {}
    $("#lightboxCaption").textContent = "Código de barras";
  } else {
    stage.innerHTML = p.img
      ? '<img id="lightboxImg" src="img/p' + p.code + '.webp?v=' + CONFIG.IMG_VERSION + '" alt="' + esc(p.name) + '" onerror="this.parentNode.innerHTML=haMono()">'
      : haMono();
    $("#lightboxCaption").textContent = p.name;
  }
}
function closeLightbox() { $("#lightbox").classList.remove("open"); }

// ---------------- STOCK EN VIVO ----------------
// Igual que el catálogo grande: trae la tabla 'productos' por páginas
// (Supabase corta en 1000 filas) y cruza el stock por código localmente.
async function cargarStock() {
  var url = (CONFIG.SUPABASE_URL || "").replace(/\/$/, "");
  var key = CONFIG.SUPABASE_ANON_KEY || "";
  if (!url || !key) return;
  var SIZE = 1000;
  try {
    var all = {};
    var from = 0;
    while (true) {
      var resp = await fetch(url + "/rest/v1/" + CONFIG.STOCK_TABLE + "?select=code,stock&order=id.asc", {
        headers: { apikey: key, Authorization: "Bearer " + key, Range: from + "-" + (from + SIZE - 1) }
      });
      if (!resp.ok && resp.status !== 206) throw new Error("HTTP " + resp.status);
      var batch = await resp.json();
      batch.forEach(function (r) { if (r.code != null) all[String(r.code).trim()] = r.stock; });
      if (batch.length < SIZE) break;
      from += SIZE;
    }
    var hits = 0;
    PRODUCTS.forEach(function (p) {
      if (all[p.code] !== undefined) { stockMap[p.code] = all[p.code]; hits++; }
    });
    console.log("stock: " + hits + "/" + PRODUCTS.length + " códigos encontrados en Supabase");
    render();
  } catch (e) { console.warn("stock:", e); }
}

// ---------------- TOAST ----------------
var _toastT;
function toast(m) {
  var el = $("#toast"); el.textContent = m; el.style.opacity = "1";
  clearTimeout(_toastT); _toastT = setTimeout(function () { el.style.opacity = "0"; }, 2200);
}

// ---------------- PANTALLA DE ANUNCIO ----------------
function enterCatalog() {
  var s = $("#splash");
  if (!s) return;
  s.classList.add("hide");
  setTimeout(function () { s.style.display = "none"; }, 450);
}

// ---------------- INIT ----------------
function init() {
  try { if (localStorage.getItem("ha_theme") === "light") document.body.classList.remove("dark"); } catch (e) {}
  applyThemeIcon();
  renderCats();
  render();
  updateBar();
  $("#search").addEventListener("input", render);
  cargarStock();
  setInterval(cargarStock, CONFIG.STOCK_REFRESH_MS || 300000);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
