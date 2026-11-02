"use strict";
/* Escudo — prototipo de demostración (AseguraTech26).
   Todo corre en el navegador; el estado se guarda en localStorage.
   Personas, bancos, aseguradoras, números y montos son ficticios o referenciales. */

// ---------------------------------------------------------------------------
// Parámetros de la demo
// ---------------------------------------------------------------------------
const PLANES = {
  individual: { n: "Individual", precio: 0.6, tope: 200, personas: 1 },
  familia: { n: "Familia", precio: 1.4, tope: 200, personas: 4 },
};
const BANCO = { nombre: "Banco Cumbre", clientes: 48320, usuariosPM: 790000 };
const ASEGURADORA = { nombre: "Seguros Caribe Unido", corredor: "Corretaje Andino" };
const COBERTURAS = [
  { ic: "🎭", t: "Suplantación e ingeniería social", s: "Te escriben o llaman haciéndose pasar por tu banco, un familiar o una empresa" },
  { ic: "🎣", t: "Páginas y perfiles falsos", s: "Phishing: entras tus datos en un sitio falso y vacían tu cuenta" },
  { ic: "📱", t: "Robo del teléfono", s: "Transferencias no autorizadas tras el robo del equipo o de la línea" },
  { ic: "🛍️", t: "Compras en redes que nunca llegan", s: "Hasta $80 por evento" },
];
const MODALIDADES = [
  { n: "Suplantación de banco por WhatsApp", p: 34 },
  { n: "Página o perfil falso (phishing)", p: 27 },
  { n: "Compra en redes no entregada", p: 19 },
  { n: "Falso familiar en apuros", p: 12 },
  { n: "Robo del teléfono", p: 8 },
];
const COLORES = ["#0d9488", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#ca8a04", "#475569"];

const SEMILLA = () => ({
  v: 2,
  pestana: "inicio",
  pago: null,              // { tel, banco, monto, reportes }
  reclamo: null,           // asistente "Me estafaron"
  evitados: 1,
  evitadoMonto: 85,
  familia: [
    { n: "María González", rel: "Tú", edad: 34 },
    { n: "Carmen González", rel: "Mamá", edad: 67 },
    { n: "Luis González", rel: "Papá", edad: 70 },
  ],
  avisos: [
    { quien: "Carmen", cuando: "Hoy 10:42", tel: "0414-555-0198", monto: 85, rep: 7 },
  ],
  reportes: {
    "04145550198": { n: 7, mod: "Suplantación de banco por WhatsApp", ultimo: "hace 2 horas" },
    "04245550731": { n: 3, mod: "Compra en redes no entregada", ultimo: "hace 4 días" },
    "04125550466": { n: 2, mod: "Falso familiar en apuros", ultimo: "ayer" },
  },
  reclamos: [
    { id: "ESC-2026-0907", fecha: "01/11 16:20", quien: "Pedro Salazar", banco: "Banco Cumbre", tipo: "Suplantación de banco por WhatsApp", monto: 150, estado: "En revisión" },
    { id: "ESC-2026-0899", fecha: "31/10 11:05", quien: "Ana Mora", banco: "Banco Cumbre", tipo: "Página o perfil falso (phishing)", monto: 200, estado: "Aprobado" },
    { id: "ESC-2026-0871", fecha: "18/08 19:40", quien: "María González", banco: "Banco Cumbre", tipo: "Compra en redes no entregada", monto: 45, estado: "Pagado" },
    { id: "ESC-2026-0864", fecha: "17/08 08:12", quien: "José Ramírez", banco: "Banco Llanura", tipo: "Robo del teléfono", monto: 180, estado: "Pagado" },
  ],
  frenados: [
    { h: "10:42", cli: "C. G.", tel: "0414-555-0198", monto: 85, rep: 7, res: "No pagó" },
    { h: "10:17", cli: "R. P.", tel: "0424-555-0731", monto: 40, rep: 3, res: "No pagó" },
    { h: "09:58", cli: "L. M.", tel: "0412-555-0466", monto: 300, rep: 2, res: "Pagó igual (sin cobertura)" },
    { h: "09:31", cli: "Y. A.", tel: "0414-555-0198", monto: 120, rep: 7, res: "No pagó" },
  ],
  filtro: "todos",
});

// ---------------------------------------------------------------------------
// Estado y utilidades
// ---------------------------------------------------------------------------
const CLAVE = "escudo_demo";
let S = cargar();
function cargar() {
  try { const s = JSON.parse(localStorage.getItem(CLAVE)); if (s && s.v === SEMILLA().v) return s; } catch { /* sin almacenamiento */ }
  return SEMILLA();
}
function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch { /* sin almacenamiento */ } }
function set(c) { Object.assign(S, c); guardar(); render(); }
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const usd = (n, d = 0) => "$" + Number(n).toLocaleString("es-VE", { minimumFractionDigits: d, maximumFractionDigits: d });
const ent = (n) => Number(n).toLocaleString("es-VE");
const hhmm = (ts) => new Date(ts).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: false });
const soloDig = (t) => String(t).replace(/\D/g, "");
const fmtTel = (t) => { const d = soloDig(t); return d.length === 11 ? `${d.slice(0, 4)}-${d.slice(4, 7)}-${d.slice(7)}` : t; };
const iniciales = (n) => n.split(" ").slice(0, 2).map((p) => p[0]).join("");
const avatar = (n, i = 0) => `<span class="av" style="background:${COLORES[i % COLORES.length]}">${esc(iniciales(n))}</span>`;
function aleatorio(n, a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789") { let s = ""; for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
function toast(m) { document.querySelectorAll(".toast").forEach((t) => t.remove()); const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); }
function badgeEstado(e) { const t = { "Nuevo": "b-naranja", "En revisión": "b-ambar", "Aprobado": "b-azul", "Pagado": "b-verde" }[e] || "b-gris"; return `<span class="badge ${t}">${e}</span>`; }

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------
function ruta() { const [p, q] = (location.hash.slice(1) || "/").split("?"); return { path: p || "/", q: new URLSearchParams(q || "") }; }
function render() {
  const { path, q } = ruta();
  const r = path.replace(/^\//, "").split("/")[0];
  document.querySelectorAll("#roles a").forEach((a) => a.classList.toggle("activo", a.dataset.r === r));
  const vistas = { "": landing, persona, banco, aseguradora, consultar };
  $("#app").innerHTML = (vistas[r] || landing)(q);
}
window.addEventListener("hashchange", () => { document.querySelectorAll(".toast").forEach((t) => t.remove()); render(); window.scrollTo(0, 0); });
$("#reiniciar").addEventListener("click", () => { S = SEMILLA(); guardar(); render(); toast("Demo reiniciada con los datos de ejemplo"); });

// ---------------------------------------------------------------------------
// Landing
// ---------------------------------------------------------------------------
function landing() {
  return `
  <section class="hero">
    <div class="hero-in">
      <div class="aparecer">
        <span class="chip">🛡️ AseguraTech26 · Desafío 2: seguros inclusivos, microseguros y masivos</span>
        <h1>Pagas tranquilo.<br><span>Si te estafan, te respondemos.</span></h1>
        <p class="lead">Escudo es un microseguro contra estafas digitales que vive dentro de la app de tu banco. Te avisa antes de pagarle a un número denunciado, protege a tus padres y, si igual te estafan, te devuelve el dinero.</p>
        <div class="ctas">
          <a class="btn btn-pri btn-lg" href="#/persona">Probar como usuario</a>
          <a class="btn btn-borde btn-lg" href="#/consultar">¿Le puedo pagar a este número?</a>
        </div>
        <div class="hero-datos">
          <div><b>63 %</b><span>de las operaciones comerciales van por Pago Móvil</span></div>
          <div><b>Desde $0,60</b><span>al mes, cobertura de hasta $200 por evento</span></div>
          <div><b>72 h</b><span>para responder un reclamo</span></div>
        </div>
      </div>
      <div class="hero-tarjeta aparecer" style="animation-delay:.1s">
        <div class="eyebrow" style="color:var(--r400)">Un martes cualquiera</div>
        <div class="linea-tiempo" style="margin-top:14px">
          <div class="lt-item"><span class="hora">10:40</span><b>A Carmen (67) le escriben "del banco"</b><span>Le piden un Pago Móvil para "desbloquear" su cuenta.</span></div>
          <div class="lt-item"><span class="hora">10:42</span><b>Escudo frena el pago</b><span>Ese número tiene 7 denuncias. Carmen ve el aviso y su hija también.</span></div>
          <div class="lt-item"><span class="hora">18:15</span><b>María cae en una tienda falsa en Instagram</b><span>Toca "Me estafaron": bloqueo guiado, denuncia pre-llenada y reclamo.</span></div>
          <div class="lt-item"><span class="hora">+48 h</span><b>Escudo le paga por Pago Móvil</b><span>Y el número estafador queda marcado para todos.</span></div>
        </div>
      </div>
    </div>
  </section>
  <section class="seccion">
    <span class="eyebrow">El problema</span>
    <h2>Todo el país paga por Pago Móvil. Cuando te estafan, nadie responde.</h2>
    <p class="lead">El dinero robado sale en minutos y es casi imposible recuperarlo. Los bancos advierten que no responden por estafas de ingeniería social, y la póliza cibernética que existe se vende aparte, como un producto individual.</p>
    <div class="grid-3">
      <div class="tarjeta"><div class="card-ic">📲</div><h3>Pago instantáneo, estafa instantánea</h3><p>Pago Móvil agrupa el 63 % de las operaciones comerciales y supera las 8.500 transacciones por minuto.</p><div class="dato-fuente">Fuente: Cavecom-e, 2026</div></div>
      <div class="tarjeta"><div class="card-ic">🚨</div><h3>Estafas en aumento</h3><p>El Cicpc alertó en octubre de 2026 sobre el aumento de las estafas virtuales y persigue a quienes prestan sus cuentas a estafadores.</p><div class="dato-fuente">Fuente: Cicpc vía NotiFalcón, oct. 2026</div></div>
      <div class="tarjeta"><div class="card-ic">🏦</div><h3>"El banco no es responsable"</h3><p>Ante estafas por correo o enlaces falsos, el Banco de Venezuela aclaró que no responde por esas pérdidas.</p><div class="dato-fuente">Fuente: El Diario, 2025</div></div>
    </div>
  </section>
  <section class="seccion">
    <span class="eyebrow">La solución</span>
    <h2>Prevenir primero. Pagar si igual pasa.</h2>
    <div class="grid-4">
      <div class="tarjeta"><div class="paso-n">1</div><h3>Se contrata en un toque</h3><p>Dentro de la app del banco, desde $0,60 al mes, cobrado con la misma cuenta.</p></div>
      <div class="tarjeta"><div class="paso-n">2</div><h3>Verifica antes de pagar</h3><p>Si el número destino tiene denuncias verificadas, te avisa y te pide confirmar.</p></div>
      <div class="tarjeta"><div class="paso-n">3</div><h3>Protege a la familia</h3><p>Hasta 4 personas. Si a tus padres les frenan un pago riesgoso, te llega el aviso.</p></div>
      <div class="tarjeta"><div class="paso-n">4</div><h3>"Me estafaron"</h3><p>Bloqueo guiado, denuncia pre-llenada para el Cicpc y reclamo con respuesta en 72 h.</p></div>
    </div>
  </section>
  <section class="seccion">
    <span class="eyebrow">Prueba el prototipo</span>
    <h2>Cuatro vistas, una misma red.</h2>
    <p class="lead">Lo que hagas como usuario aparece en los paneles del banco y de la aseguradora.</p>
    <div class="banda-roles" style="grid-template-columns:repeat(4,1fr)">
      <a class="tarjeta rol-card" href="#/persona"><div class="card-ic">🙋‍♀️</div><h3>Persona</h3><p>Verifica un pago, mira cómo se protege a tu mamá y reporta una estafa.</p><div class="ir">Abrir app →</div></a>
      <a class="tarjeta rol-card" href="#/banco"><div class="card-ic">🏦</div><h3>Banco</h3><p>Clientes protegidos, pagos frenados, dinero evitado e integración.</p><div class="ir">Abrir panel →</div></a>
      <a class="tarjeta rol-card" href="#/aseguradora"><div class="card-ic">🏢</div><h3>Aseguradora</h3><p>Reclamos, siniestralidad, modalidades de estafa y red de alertas.</p><div class="ir">Abrir panel →</div></a>
      <a class="tarjeta rol-card" href="#/consultar"><div class="card-ic">🔎</div><h3>Consultar número</h3><p>Cualquiera puede revisar si un número tiene denuncias antes de pagar.</p><div class="ir">Consultar →</div></a>
    </div>
  </section>
  <footer class="pie"><span><b>Escudo</b> · Prototipo para AseguraTech26 (SUDEASEG) · Noviembre de 2026</span><span>Escudo es la capa tecnológica: el riesgo lo asume una aseguradora autorizada y la colocación la hace un intermediario autorizado.</span></footer>`;
}

// ---------------------------------------------------------------------------
// App de la persona
// ---------------------------------------------------------------------------
function persona() {
  return `
  <div class="contenedor"><div class="escena">
    <div class="explica aparecer">
      <span class="eyebrow">Vista del usuario</span>
      <h2>Así se ve Escudo dentro de la app del banco.</h2>
      <p>María tiene el plan Familia: la protege a ella y a sus padres. Prueba las cuatro pestañas del teléfono.</p>
      <ol>
        <li><b>Pagar</b><span>Escribe un número y verifica antes de pagar. Usa el botón "Probar con un número denunciado" para ver la alerta.</span></li>
        <li><b>Familia</b><span>Mira cómo Escudo le frenó un pago riesgoso a Carmen, la mamá de María.</span></li>
        <li><b>Me estafaron</b><span>Desde Inicio, reporta una estafa en 3 pasos: qué pasó, cuál pago y qué hacer ya.</span></li>
        <li><b>Revisa los otros paneles</b><span>Tu reclamo llega al <a href="#/aseguradora">panel de la aseguradora</a>, que lo aprueba y paga. Tus alertas suman en el <a href="#/banco">panel del banco</a>.</span></li>
      </ol>
      <div class="nota"><b>Precios referenciales de la demo:</b> plan Individual ${usd(PLANES.individual.precio, 2)} al mes, plan Familia ${usd(PLANES.familia.precio, 2)} al mes para hasta 4 personas. Cobertura de hasta ${usd(200)} por evento, 2 eventos al año. Si pagas a un número con alerta después de ver el aviso, ese pago no queda cubierto.</div>
      <div class="demo-ctrl no-imprimir"><button class="btn btn-borde btn-sm" data-acc="simular-aviso">🔔 Simular otro aviso de la familia</button></div>
    </div>
    <div class="telefono"><div class="pantalla">
      <div class="notch"></div>
      <div class="status"><span>${hhmm(Date.now())}</span><span>▮▮▮ 4G ▭</span></div>
      ${pantalla()}
    </div></div>
  </div></div>`;
}

function pantalla() {
  if (S.reclamo) return pantallaReclamo();
  const p = S.pestana;
  const tabs = [["inicio", "🏠", "Inicio"], ["pagar", "💸", "Pagar"], ["familia", "👨‍👩‍👧", "Familia"], ["reclamos", "📄", "Reclamos"]];
  const nav = `<nav class="app-nav">${tabs.map(([k, i, t]) => `<button class="${p === k ? "on" : ""}" data-tab="${k}"><span>${i}</span>${t}</button>`).join("")}</nav>`;
  const cab = `<div class="app-cab"><div><div class="hola">${BANCO.nombre} · con Escudo</div><div class="nom">Hola, María</div></div>${avatar("María González")}</div>`;
  const cuerpo = { inicio: tabInicio, pagar: tabPagar, familia: tabFamilia, reclamos: tabReclamos }[p]();
  return `${cab}<div class="app-cuerpo">${cuerpo}</div>${nav}`;
}

function tabInicio() {
  const av = S.avisos[0];
  return `
    <div class="estado-turno on aparecer">
      <div class="lbl"><span class="punto"></span> Protegida · Plan Familia</div>
      <div class="big">Hasta ${usd(200)} por evento</div>
      <div class="met"><div><b>3</b>personas</div><div><b>${usd(PLANES.familia.precio, 2)}</b>al mes</div><div><b>${S.evitados}</b>pagos frenados</div></div>
    </div>
    ${av ? `<button class="banda-alerta roja" style="width:100%;text-align:left;border:1px solid #fecaca" data-tab="familia"><span class="i">🛑</span><span><b>${esc(av.cuando)}: frenamos un pago de ${esc(av.quien)}</b><br>Iba a pagar ${usd(av.monto)} a un número con ${av.rep} denuncias. Toca para ver.</span></button>` : ""}
    <div class="acciones-app">
      <button class="acc" data-tab="pagar"><span class="i">🔎</span>Verificar y pagar</button>
      <button class="acc alerta" data-acc="me-estafaron"><span class="i">🆘</span>Me estafaron</button>
    </div>
    <div class="mini"><h4>Qué te cubre</h4>${COBERTURAS.map((c) => `<div class="cob"><span class="ic">${c.ic}</span><div><div class="t">${c.t}</div><div class="s">${c.s}</div></div></div>`).join("")}</div>`;
}

function tabPagar() {
  const pg = S.pago || {};
  let res = "";
  if (pg.verificado) {
    if (pg.rep) {
      res = `<div class="banda-alerta roja aparecer"><span class="i">⚠️</span><span><b>Este número tiene ${pg.rep.n} denuncias de estafa</b><br>Modalidad: ${esc(pg.rep.mod)} · última ${esc(pg.rep.ultimo)}. Si te escribieron "del banco" o un "familiar" pidiendo dinero, es una estafa.</span></div>
        <div class="acciones-app"><button class="acc" style="background:var(--verde50);border-color:#bbf7d0;color:#14532d" data-acc="no-pagar"><span class="i">✋</span>No pagar</button><button class="acc" data-acc="pagar-igual"><span class="i">➡️</span>Pagar igual</button></div>
        <p class="sub" style="margin-top:8px">Si pagas igual, este pago no queda cubierto por Escudo.</p>`;
    } else {
      res = `<div class="banda-alerta verde aparecer"><span class="i">✅</span><span><b>Sin denuncias para este número</b><br>Puedes pagar. Si algo sale mal, estás protegida hasta ${usd(200)}.</span></div>
        <button class="btn-turno btn-pri" data-acc="pagar-ok">Confirmar Pago Móvil de ${usd(pg.monto || 0)}</button>`;
    }
  }
  return `<div class="app-titulo" style="margin-top:6px">Pago Móvil verificado</div>
    <p class="app-sub">Antes de pagar, Escudo revisa si el número tiene denuncias.</p>
    <label class="etq">Teléfono del destinatario</label><input class="campo-app mono" id="p-tel" value="${esc(pg.tel || "")}" placeholder="0414-000-0000" inputmode="tel">
    <label class="etq">Banco</label><select class="campo-app" id="p-banco">${["Banco Cumbre", "Banco Llanura", "Banco Orinoco", "Banco Ávila"].map((b) => `<option ${pg.banco === b ? "selected" : ""}>${b}</option>`).join("")}</select>
    <label class="etq">Monto (USD equivalente)</label><input class="campo-app" id="p-monto" value="${esc(pg.monto || "")}" placeholder="50" inputmode="decimal">
    <button class="btn-turno btn-osc" data-acc="verificar">🔎 Verificar destinatario</button>
    <button class="btn btn-sec bloque" style="margin-top:8px" data-acc="probar-reportado">Probar con un número denunciado</button>
    ${res}`;
}

function tabFamilia() {
  return `<div class="app-titulo" style="margin-top:6px">Mi familia protegida</div>
    <p class="app-sub">Plan Familia: hasta 4 personas, cada una cubierta hasta ${usd(200)} por evento.</p>
    <div class="mini">${S.familia.map((f, i) => `<div class="cob">${avatar(f.n, i)}<div><div class="t">${esc(f.n)}</div><div class="s">${esc(f.rel)} · ${f.edad} años</div></div><span class="m"><span class="badge b-verde">Protegido</span></span></div>`).join("")}
      <div class="cob" style="color:var(--t500);font-size:13.5px">＋ Agregar a alguien (1 cupo libre)</div></div>
    <div class="mini"><h4>Avisos de la familia</h4>${S.avisos.length ? S.avisos.map((a) => `<div class="banda-alerta roja" style="margin-top:8px"><span class="i">🛑</span><span><b>${esc(a.cuando)} · pago frenado a ${esc(a.quien)}</b><br>${usd(a.monto)} a ${esc(a.tel)} (${a.rep} denuncias). ${esc(a.quien)} vio la alerta y no pagó.</span></div>`).join("") : `<div class="sub">Sin avisos.</div>`}
      <a class="btn btn-sec bloque" style="margin-top:10px" href="tel:00000000">📞 Llamar a Carmen</a></div>`;
}

function tabReclamos() {
  const mios = S.reclamos.filter((r) => r.quien === "María González");
  return `<div class="app-titulo" style="margin-top:6px">Mis reclamos</div>
    <p class="app-sub">Respuesta en 72 horas. Si se aprueba, te pagamos por Pago Móvil.</p>
    <div class="mini">${mios.map((r) => `<div class="hist"><span><b class="mono" style="font-size:12.5px">${r.id}</b><br><span class="sub">${esc(r.tipo)} · ${usd(r.monto)}</span></span>${badgeEstado(r.estado)}</div>`).join("") || `<div class="sub">No tienes reclamos.</div>`}</div>
    <div class="mini" style="display:flex;gap:16px"><div style="flex:1"><div style="font-size:22px;font-weight:800">${S.evitados}</div><div class="sub">pagos riesgosos frenados</div></div><div style="flex:1"><div style="font-size:22px;font-weight:800">${usd(S.evitadoMonto)}</div><div class="sub">que no se perdieron</div></div></div>
    <button class="btn-turno btn-peligro" data-acc="me-estafaron">🆘 Me estafaron</button>`;
}

// --- "Me estafaron" en 3 pasos ---
const TIPOS = [
  { v: "Suplantación de banco por WhatsApp", t: "Me escribieron haciéndose pasar por mi banco", i: "🎭" },
  { v: "Página o perfil falso (phishing)", t: "Entré a una página falsa y vaciaron mi cuenta", i: "🎣" },
  { v: "Robo del teléfono", t: "Me robaron el teléfono y transfirieron", i: "📱" },
  { v: "Compra en redes no entregada", t: "Pagué una compra en redes y nunca llegó", i: "🛍️" },
];
const MOVS = [
  { id: "m1", tel: "0412-555-0466", monto: 120, cuando: "Hoy 09:14" },
  { id: "m2", tel: "0424-555-0731", monto: 35, cuando: "30/10 18:02" },
  { id: "m3", tel: "0416-555-0102", monto: 60, cuando: "29/10 12:40" },
];
function pantallaReclamo() {
  const r = S.reclamo;
  const prog = (n) => `<div class="progreso">${[1, 2, 3].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>`;
  const cab = r.paso === 4 ? `<div class="app-cab"><span class="sub">Reclamo de estafa</span></div>` : `<div class="app-cab"><button class="btn btn-borde btn-sm" data-acc="cancelar">✕ Cancelar</button><span class="sub">Me estafaron</span></div>`;
  let c = "";
  if (r.paso === 1) {
    c = `${prog(1)}<div class="app-titulo">¿Qué pasó?</div><p class="app-sub">Respira. Vamos a hacer esto juntos y rápido.</p>
      ${TIPOS.map((t) => `<button class="opcion ${r.tipo === t.v ? "sel" : ""}" data-tipo="${esc(t.v)}"><span class="i">${t.i}</span>${t.t}</button>`).join("")}`;
  } else if (r.paso === 2) {
    c = `${prog(2)}<div class="app-titulo">¿Cuál pago fue?</div><p class="app-sub">Elige el movimiento de tu cuenta. No tienes que buscar la referencia.</p>
      ${MOVS.map((m) => `<button class="mov ${r.mov === m.id ? "sel" : ""}" data-mov="${m.id}"><span><b>Pago Móvil a ${m.tel}</b><br><span class="sub">${m.cuando}</span></span><b>${usd(m.monto)}</b></button>`).join("")}`;
  } else if (r.paso === 3) {
    const ok = r.bloqueo && r.denuncia;
    const item = (k, ic, t, s, btn) => `<button class="mov ${r[k] ? "sel" : ""}" data-check="${k}"><span style="display:flex;gap:10px;align-items:center"><span style="font-size:20px">${r[k] ? "✅" : ic}</span><span><b>${t}</b><br><span class="sub">${s}</span></span></span><span class="badge ${r[k] ? "b-verde" : "b-gris"}">${r[k] ? "Listo" : btn}</span></button>`;
    c = `${prog(3)}<div class="app-titulo">Haz esto ya</div><p class="app-sub">Cada minuto cuenta. Te guiamos en cada paso.</p>
      ${item("bloqueo", "🔒", "Bloquea con tu banco", "Llamamos al centro de fraude por ti", "Llamar")}
      ${item("denuncia", "🚔", "Denuncia ante el Cicpc", "La dejamos llena: solo revisas y firmas", "Revisar")}
      ${item("reporte", "📣", "Reporta el número", "Avisamos a otros usuarios antes de que paguen", "Reportar")}
      <button class="btn-turno btn-pri" data-acc="enviar" ${ok ? "" : "disabled style='opacity:.5;cursor:not-allowed'"}>Enviar reclamo</button>
      ${ok ? "" : `<p class="sub" style="margin-top:8px;text-align:center">Completa el bloqueo y la denuncia para enviar.</p>`}`;
  } else {
    const m = MOVS.find((x) => x.id === r.mov);
    const tope = r.tipo === "Compra en redes no entregada" ? 80 : 200;
    const cubre = Math.min(m.monto, tope);
    c = `<div style="text-align:center;margin-top:10px"><div style="font-size:44px">🛡️</div><div class="app-titulo">Reclamo recibido</div>
      <p class="app-sub">Reclamo <b class="mono">${r.id}</b> · ${esc(r.tipo)}.</p></div>
      <div class="clave"><div class="sub">Monto cubierto si se aprueba</div><div class="cod">${usd(cubre)}</div><div class="sub">de ${usd(m.monto)} reclamados · sin deducible</div></div>
      <div class="mini"><div class="cob"><span class="ic">⏱️</span><div><div class="t">Respuesta en 72 horas</div><div class="s">Si se aprueba, te pagamos por Pago Móvil a tu cuenta.</div></div></div>
      <div class="cob"><span class="ic">📣</span><div><div class="t">${m.tel} quedó reportado</div><div class="s">Otros usuarios verán la alerta antes de pagarle.</div></div></div></div>
      <button class="btn-turno btn-osc" data-acc="cerrar">Volver al inicio</button>`;
  }
  return `${cab}<div class="app-cuerpo">${c}</div>`;
}

// ---------------------------------------------------------------------------
// Panel del banco
// ---------------------------------------------------------------------------
const ALTAS = [1210, 1480, 1630, 1910, 2240, 2580, 2960, 3310];
function banco() {
  const frenadosMes = 1280 + S.frenados.length;
  const evitado = 96000 + S.evitadoMonto;
  const max = Math.max(...ALTAS);
  return `
  <div class="contenedor">
    <div class="titulo-pag"><div><span class="eyebrow">Panel del banco (canal)</span><h1>${BANCO.nombre}</h1><p>Distribuye Escudo dentro de su app · Aseguradora: ${ASEGURADORA.nombre} · Intermediario: ${ASEGURADORA.corredor}</p></div>
      <span class="badge b-verde" style="font-size:13px;padding:6px 12px"><span class="punto vivo"></span> Red de alertas activa</span></div>
    <div class="kpis">
      <div class="kpi"><div class="v">${ent(BANCO.clientes)}</div><div class="e">clientes protegidos</div><div class="d">${(BANCO.clientes / BANCO.usuariosPM * 100).toFixed(1)} % de sus usuarios de Pago Móvil</div></div>
      <div class="kpi"><div class="v" style="color:var(--verde)">${ent(frenadosMes)}</div><div class="e">pagos riesgosos frenados este mes</div></div>
      <div class="kpi"><div class="v">${usd(evitado)}</div><div class="e">dinero que no salió hacia estafadores</div></div>
      <div class="kpi"><div class="v">${usd(BANCO.clientes * 1.0 * 0.12)}</div><div class="e">comisión del canal este mes</div><div class="d">12 % de la prima (referencial)</div></div>
    </div>
    <div class="rejilla-2">
      <div class="pila">
        <div class="tarjeta"><h2 class="sec">🛑 Últimos pagos frenados</h2>
          <div class="tabla-env"><table><thead><tr><th>Hora</th><th>Cliente</th><th>Destino</th><th>Denuncias</th><th style="text-align:right">Monto</th><th>Qué hizo</th></tr></thead>
          <tbody>${S.frenados.map((f) => `<tr><td class="mono">${f.h}</td><td>${esc(f.cli)}</td><td class="mono">${esc(f.tel)}</td><td><span class="badge b-rojo">${f.rep}</span></td><td style="text-align:right">${usd(f.monto)}</td><td>${f.res.startsWith("No") ? `<span class="badge b-verde">✓ ${esc(f.res)}</span>` : `<span class="badge b-ambar">${esc(f.res)}</span>`}</td></tr>`).join("")}</tbody></table></div>
          <p class="sub" style="margin-top:10px">Solo se muestran iniciales. El banco no ve el contenido de los reportes ni datos de terceros.</p></div>
        <div class="tarjeta"><h2 class="sec">🔌 Integración</h2>
<pre class="codigo"><span class="c">// Antes de confirmar un Pago Móvil</span>
<span class="k">POST</span> /v1/verificar-destino
{ <span class="s">"telefono"</span>: <span class="s">"04145550198"</span>, <span class="s">"banco"</span>: <span class="s">"0172"</span>, <span class="s">"monto_usd"</span>: 85 }
<span class="c">→ 200 { "riesgo": "alto", "denuncias": 7, "modalidad": "suplantacion_banco" }</span>

<span class="c">// Contratar dentro de la app</span>
<span class="k">POST</span> /v1/polizas   { <span class="s">"cliente"</span>: <span class="s">"V-1*.***.***"</span>, <span class="s">"plan"</span>: <span class="s">"familia"</span> }
<span class="c">→ 201 { "certificado": "ESC-CF-118204", "prima_usd": 1.40 }</span></pre></div>
      </div>
      <div class="pila">
        <div class="tarjeta"><h2 class="sec">📈 Altas por semana</h2>
          <div class="barras">${ALTAS.map((v, i) => `<div class="col"><div class="b ${i >= 6 ? "alta" : ""}" style="height:${(v / max) * 100}%"></div><span class="l">S${i + 1}</span></div>`).join("")}</div></div>
        <div class="tarjeta"><h2 class="sec">💡 Por qué le conviene al banco</h2>
          <ul class="lista-check">
            <li><span class="ic-check ic-ok">✓</span><div><b>Menos reclamos por fraude</b><div class="sub">La alerta frena el pago antes de que salga el dinero.</div></div></li>
            <li><span class="ic-check ic-ok">✓</span><div><b>Un ingreso nuevo</b><div class="sub">Comisión por cada cliente protegido, sin asumir el riesgo.</div></div></li>
            <li><span class="ic-check ic-ok">✓</span><div><b>Confianza en el canal digital</b><div class="sub">El cliente paga más tranquilo con el banco que lo protege.</div></div></li>
          </ul></div>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Panel de la aseguradora
// ---------------------------------------------------------------------------
function aseguradora() {
  const polizas = 61900, prima = 43900;
  const abiertos = S.reclamos.filter((r) => r.estado !== "Pagado").length;
  const maxp = Math.max(...MODALIDADES.map((m) => m.p));
  return `
  <div class="contenedor">
    <div class="titulo-pag"><div><span class="eyebrow">Panel de la aseguradora</span><h1>${ASEGURADORA.nombre}</h1><p>Microseguro Escudo · 2 bancos aliados · colocado por ${ASEGURADORA.corredor}</p></div></div>
    <div class="kpis">
      <div class="kpi"><div class="v">${ent(polizas)}</div><div class="e">personas protegidas</div></div>
      <div class="kpi"><div class="v">${usd(prima)}</div><div class="e">prima del mes</div></div>
      <div class="kpi"><div class="v">38 %</div><div class="e">siniestralidad del mes</div><div class="d">la prevención reduce los reclamos</div></div>
      <div class="kpi"><div class="v">${abiertos}</div><div class="e">reclamos por resolver</div><div class="d">pago promedio en 2,4 días</div></div>
    </div>
    <div class="rejilla-2i">
      <div class="tarjeta"><h2 class="sec">🎭 Reclamos por modalidad (90 días)</h2>
        ${MODALIDADES.map((m) => `<div class="barra-h"><span class="n">${m.n}</span><span class="b" style="width:${(m.p / maxp) * 55}%"></span><span class="v">${m.p} %</span></div>`).join("")}
        <p class="sub" style="margin-top:8px">Datos de demostración. Sirven para ajustar alertas y educar a los usuarios.</p></div>
      <div class="tarjeta"><h2 class="sec">📣 Red de alertas</h2>
        <ul class="lista-check">
          <li><span class="ic-check ic-ok">✓</span><div><b>${ent(2140 + Object.keys(S.reportes).length - 3)} números con denuncias verificadas</b><div class="sub">Solo cuentan los reclamos aprobados y las denuncias formales.</div></div></li>
          <li><span class="ic-check ic-ok">✓</span><div><b>312 números nuevos esta semana</b><div class="sub">Se marcan en minutos para todos los bancos aliados.</div></div></li>
          <li><span class="ic-check ic-warn">!</span><div><b>14 apelaciones en curso</b><div class="sub">Quien crea estar marcado por error puede pedir revisión.</div></div></li>
        </ul></div>
    </div>
    <div class="tarjeta" style="margin-top:18px"><h2 class="sec">📄 Reclamos</h2>
      <div class="tabla-env"><table><thead><tr><th>Reclamo</th><th>Asegurado</th><th>Modalidad</th><th style="text-align:right">Monto</th><th>Estado</th><th></th></tr></thead>
      <tbody>${S.reclamos.map((r) => `<tr><td><b class="mono" style="font-size:12.5px">${r.id}</b><div class="sub">${r.fecha}</div></td><td>${esc(r.quien)}<div class="sub">${esc(r.banco)}</div></td><td>${esc(r.tipo)}</td><td style="text-align:right">${usd(r.monto)}</td><td>${badgeEstado(r.estado)}</td>
        <td style="text-align:right;white-space:nowrap">${r.estado === "Nuevo" || r.estado === "En revisión" ? `<button class="btn btn-sec btn-sm" data-aprobar="${r.id}">Aprobar</button>` : r.estado === "Aprobado" ? `<button class="btn btn-borde btn-sm" data-pagar="${r.id}">Pagar por Pago Móvil</button>` : `<span class="sub">—</span>`}</td></tr>`).join("")}</tbody></table></div></div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Consulta pública
// ---------------------------------------------------------------------------
function consultar(q) {
  const t = soloDig(q.get("t") || "");
  let res = "";
  if (t) {
    const r = S.reportes[t];
    res = r
      ? `<div class="verif-res no aparecer"><div style="font-size:40px">⚠️</div><div class="big">${r.n} denuncias de estafa</div><div style="opacity:.9;margin-top:4px">${esc(fmtTel(t))} · ${esc(r.mod)} · última ${esc(r.ultimo)}</div></div>
         <div class="tarjeta" style="margin-top:14px"><b>No le pagues</b> si te escribieron "del banco", un "familiar" con número nuevo o una tienda con precios demasiado buenos. <p class="sub" style="margin-top:6px">¿Es tu número y crees que es un error? Puedes pedir una revisión.</p></div>`
      : `<div class="verif-res ok aparecer"><div style="font-size:40px">✅</div><div class="big">Sin denuncias</div><div style="opacity:.9;margin-top:4px">${esc(fmtTel(t))} no tiene reportes verificados. Igual, desconfía de los pedidos urgentes de dinero.</div></div>`;
  }
  return `
  <div class="contenedor"><div class="verif">
    <span class="eyebrow">Consulta pública</span>
    <h1 style="font-size:28px;letter-spacing:-0.03em;margin:6px 0 6px">¿Le puedo pagar a este número?</h1>
    <p class="sub" style="font-size:14.5px">Gratis, para cualquiera. Revisa si un teléfono de Pago Móvil tiene denuncias verificadas. No mostramos nombres ni datos personales.</p>
    <form class="campo" style="margin-top:18px" id="form-cons"><input name="t" placeholder="0414-000-0000" value="${esc(t ? fmtTel(t) : "")}" aria-label="Teléfono" autocomplete="off" inputmode="tel"><button class="btn btn-osc">Consultar</button></form>
    <p class="sub" style="margin-top:8px">Prueba con <a href="#/consultar?t=04145550198" class="mono">0414-555-0198</a> o <a href="#/consultar?t=04165550102" class="mono">0416-555-0102</a>.</p>
    ${res}
  </div></div>`;
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-acc],[data-tab],[data-tipo],[data-mov],[data-check],[data-aprobar],[data-pagar]");
  if (!el || el.disabled) return;
  const d = el.dataset;
  if (d.tab) return set({ pestana: d.tab });
  if (d.tipo) return set({ reclamo: { ...S.reclamo, tipo: d.tipo, paso: 2 } });
  if (d.mov) return set({ reclamo: { ...S.reclamo, mov: d.mov, paso: 3 } });
  if (d.check) {
    const r = { ...S.reclamo, [d.check]: !S.reclamo[d.check] };
    if (r[d.check]) toast({ bloqueo: "Llamada al centro de fraude: cuenta bloqueada", denuncia: "Denuncia lista para firmar", reporte: "Número reportado a la red" }[d.check]);
    return set({ reclamo: r });
  }
  if (d.aprobar || d.pagar) {
    const id = d.aprobar || d.pagar;
    S.reclamos = S.reclamos.map((r) => r.id === id ? { ...r, estado: d.aprobar ? "Aprobado" : "Pagado" } : r);
    toast(d.aprobar ? `Reclamo ${id} aprobado` : `Reclamo ${id} pagado por Pago Móvil`);
    return set({});
  }
  switch (d.acc) {
    case "probar-reportado": return set({ pago: { tel: "0414-555-0198", banco: "Banco Llanura", monto: 85 } });
    case "verificar": {
      const tel = $("#p-tel").value.trim(), banco = $("#p-banco").value, monto = Number($("#p-monto").value) || 0;
      if (soloDig(tel).length < 11) return toast("Escribe un teléfono de 11 dígitos, por ejemplo 0414-555-0198");
      return set({ pago: { tel: fmtTel(tel), banco, monto, verificado: true, rep: S.reportes[soloDig(tel)] || null } });
    }
    case "no-pagar": {
      const m = S.pago.monto || 0;
      S.frenados = [{ h: hhmm(Date.now()), cli: "M. G.", tel: S.pago.tel, monto: m, rep: S.pago.rep.n, res: "No pagó" }, ...S.frenados].slice(0, 6);
      toast("Bien hecho: no pagaste a un número denunciado");
      return set({ evitados: S.evitados + 1, evitadoMonto: S.evitadoMonto + m, pago: null });
    }
    case "pagar-igual":
      S.frenados = [{ h: hhmm(Date.now()), cli: "M. G.", tel: S.pago.tel, monto: S.pago.monto || 0, rep: S.pago.rep.n, res: "Pagó igual (sin cobertura)" }, ...S.frenados].slice(0, 6);
      toast("Pago enviado. Este pago no queda cubierto por Escudo");
      return set({ pago: null });
    case "pagar-ok": toast("Pago Móvil enviado (simulado)"); return set({ pago: null });
    case "me-estafaron": return set({ reclamo: { paso: 1 } });
    case "cancelar": return set({ reclamo: null });
    case "enviar": {
      const r = S.reclamo, m = MOVS.find((x) => x.id === r.mov);
      const n = 913 + S.reclamos.filter((x) => x.estado === "Nuevo").length;
      const id = `ESC-2026-${String(n).padStart(4, "0")}`;
      const ahora = new Date();
      const fecha = `${String(ahora.getDate()).padStart(2, "0")}/${String(ahora.getMonth() + 1).padStart(2, "0")} ${hhmm(ahora)}`;
      const tope = r.tipo === "Compra en redes no entregada" ? 80 : 200;
      S.reclamos = [{ id, fecha, quien: "María González", banco: BANCO.nombre, tipo: r.tipo, monto: Math.min(m.monto, tope), estado: "Nuevo" }, ...S.reclamos];
      const k = soloDig(m.tel);
      S.reportes[k] = S.reportes[k] ? { ...S.reportes[k], n: S.reportes[k].n + 1, ultimo: "hace un momento" } : { n: 1, mod: r.tipo, ultimo: "hace un momento" };
      return set({ reclamo: { ...r, paso: 4, id } });
    }
    case "cerrar": return set({ reclamo: null, pestana: "reclamos" });
    case "simular-aviso":
      S.avisos = [{ quien: "Luis", cuando: `Hoy ${hhmm(Date.now())}`, tel: "0424-555-0731", monto: 40, rep: 3 }, ...S.avisos].slice(0, 3);
      S.frenados = [{ h: hhmm(Date.now()), cli: "L. G.", tel: "0424-555-0731", monto: 40, rep: 3, res: "No pagó" }, ...S.frenados].slice(0, 6);
      toast("Aviso: frenamos un pago de Luis");
      return set({ evitados: S.evitados + 1, evitadoMonto: S.evitadoMonto + 40, pestana: "familia" });
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "form-cons") return;
  e.preventDefault();
  location.hash = `#/consultar?t=${soloDig(new FormData(e.target).get("t"))}`;
});

render();
