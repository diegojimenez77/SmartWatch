/* =========================================================
   SMARTWATCH – Lógica principal
   ========================================================= */

/* ----- Referencias al DOM -------------------------------- */
const hoursEl       = document.getElementById('js-hours');
const minutesEl     = document.getElementById('js-minutes');
const secondsEl     = document.getElementById('js-seconds');
const monthEl       = document.getElementById('js-month');
const dayEl         = document.getElementById('js-day');
const weekdayEl     = document.getElementById('js-weekday');
const temperatureEl = document.getElementById('js-temperature');
const rainEl        = document.getElementById('js-rain');
const syncTextEl    = document.getElementById('js-sync-text');
const notifEl       = document.getElementById('js-notification');
const notifMsgEl    = document.getElementById('js-notification-msg');

/* ----- Constantes de fecha en español -------------------- */
const MESES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPT', 'OCTUBRE', 'NOV', 'DIC',
];
const DIAS_SEMANA = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

/* =========================================================
   RELOJ Y FECHA
   ========================================================= */
function padDos(n) {
  return String(n).padStart(2, '0');
}

function actualizarReloj() {
  const ahora = new Date();
  hoursEl.textContent   = padDos(ahora.getHours());
  minutesEl.textContent = padDos(ahora.getMinutes());
  secondsEl.textContent = padDos(ahora.getSeconds());
  monthEl.textContent   = MESES[ahora.getMonth()];
  dayEl.textContent     = padDos(ahora.getDate());
  weekdayEl.textContent = DIAS_SEMANA[ahora.getDay()];
}

actualizarReloj();
setInterval(actualizarReloj, 1000);

/* =========================================================
   NOTIFICACIÓN VISUAL
   ========================================================= */
let notifTimeout = null;

function mostrarNotificacion(mensaje) {
  notifMsgEl.textContent = '';
  notifMsgEl.appendChild(document.createTextNode(mensaje));
  notifEl.classList.remove('notification--hidden');
  if (notifTimeout) clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => notifEl.classList.add('notification--hidden'), 5000);
}

/* =========================================================
   CLIMA – Open-Meteo
   ========================================================= */
async function obtenerClima(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m` +
    `&hourly=precipitation_probability` +
    `&timezone=auto&forecast_days=1`;

  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error('Red no disponible');

  const datos = await respuesta.json();
  const temp  = Math.round(datos.current.temperature_2m);
  const lluvia = datos.hourly.precipitation_probability[new Date().getHours()] ?? '--';

  temperatureEl.textContent = '';
  temperatureEl.appendChild(document.createTextNode(`${temp}°C`));
  rainEl.textContent = '';
  rainEl.appendChild(document.createTextNode(`${lluvia}%`));

  syncTextEl.textContent = '';
  syncTextEl.appendChild(document.createTextNode('Sincronizado'));
}

function manejarErrorUbicacion(err) {
  const msgs = {
    1: 'Ubicación denegada. Clima no disponible.',
    2: 'Ubicación no disponible.',
    3: 'Tiempo de espera agotado.',
  };
  mostrarNotificacion(msgs[err.code] ?? 'Error de ubicación.');
  syncTextEl.textContent = '';
  syncTextEl.appendChild(document.createTextNode('Sin conexión'));
}

async function manejarExitoUbicacion(pos) {
  try {
    await obtenerClima(pos.coords.latitude, pos.coords.longitude);
  } catch {
    mostrarNotificacion('No se pudo obtener el clima.');
    syncTextEl.textContent = '';
    syncTextEl.appendChild(document.createTextNode('Error de red'));
  }
}

function iniciarClima() {
  if (!('geolocation' in navigator)) {
    mostrarNotificacion('Geolocalización no soportada.');
    return;
  }
  syncTextEl.textContent = '';
  syncTextEl.appendChild(document.createTextNode('Sincronizando…'));
  navigator.geolocation.getCurrentPosition(
    manejarExitoUbicacion,
    manejarErrorUbicacion,
    { timeout: 10000 }
  );
}

iniciarClima();
setInterval(iniciarClima, 30 * 60 * 1000);

/* =========================================================
   SISTEMA DE ANIMACIONES – 8 animaciones ciclables
   ========================================================= */
const canvasEl     = document.getElementById('js-anim-canvas');
const animSeccionEl = document.getElementById('js-anim-section');
const animNombreEl = document.getElementById('js-anim-nombre');
const animDotsEl   = document.getElementById('js-anim-dots');
const ctx          = canvasEl.getContext('2d');

const COLOR = '#00ffc2';

/* ----- Ajuste del canvas al tamaño real del DOM --------- */
function ajustarCanvas() {
  canvasEl.width  = canvasEl.offsetWidth  || 270;
  canvasEl.height = canvasEl.offsetHeight || 65;
}
ajustarCanvas();
window.addEventListener('resize', () => {
  ajustarCanvas();
  /* Reiniciar estado de animaciones que dependen del tamaño */
  animaciones.forEach(a => { a.estado.inicializado = false; });
});

/* =========================================================
   DEFINICIÓN DE LAS 8 ANIMACIONES
   Cada una expone: { nombre, estado, dibujar(ctx, w, h, dt) }
   ========================================================= */

/* --- 0. EKG -------------------------------------------- */
function crearEkg() {
  /* Puntos del patrón normalizado en y (0=arriba, 1=abajo) */
  const pts = [
    [0, .5], [40, .5], [45, .25], [50, .75], [55, .5],
    [80, .5], [85, .125], [90, .875], [95, .5],
    [130, .5], [135, .375], [140, .625], [145, .5], [200, .5],
  ];
  const CICLO = 200;
  const estado = { offset: 0, inicializado: true };

  function dibujar(c, w, h, dt) {
    estado.offset = (estado.offset + dt * 32) % CICLO;

    c.beginPath();
    c.strokeStyle = COLOR;
    c.lineWidth   = 1.5;
    c.globalAlpha = 0.5;
    c.lineJoin    = 'round';
    c.lineCap     = 'round';

    const reps = Math.ceil(w / CICLO) + 2;
    for (let r = -1; r < reps; r++) {
      pts.forEach(([x, yn], i) => {
        const cx = x + r * CICLO - estado.offset;
        const cy = yn * h;
        if (r === -1 && i === 0) c.moveTo(cx, cy);
        else c.lineTo(cx, cy);
      });
    }
    c.stroke();
    c.globalAlpha = 1;
  }

  return { nombre: 'EKG', estado, dibujar };
}

/* --- 1. Radar ------------------------------------------ */
function crearRadar() {
  const estado = { t: 0, inicializado: true };

  function dibujar(c, w, h, dt) {
    estado.t += dt;
    const cx = w / 2, cy = h / 2;
    const rMax  = Math.min(w / 2, h / 2) * 0.86;
    const DUR   = 2.5;
    const ANILLOS = 3;

    /* Cruz de referencia */
    c.globalAlpha = 0.18;
    c.strokeStyle = COLOR;
    c.lineWidth   = 0.5;
    c.beginPath();
    c.moveTo(cx - rMax, cy); c.lineTo(cx + rMax, cy);
    c.moveTo(cx, cy - rMax); c.lineTo(cx, cy + rMax);
    c.stroke();

    /* Anillos expansivos */
    for (let i = 0; i < ANILLOS; i++) {
      const fase  = ((estado.t + i * (DUR / ANILLOS)) % DUR) / DUR;
      const radio = fase * rMax;
      const alpha = (1 - fase) * 0.65;
      c.beginPath();
      c.arc(cx, cy, radio, 0, Math.PI * 2);
      c.strokeStyle = COLOR;
      c.lineWidth   = 1.5;
      c.globalAlpha = alpha;
      c.stroke();
    }

    /* Punto central */
    c.beginPath();
    c.arc(cx, cy, 2.5, 0, Math.PI * 2);
    c.fillStyle   = COLOR;
    c.globalAlpha = 0.9;
    c.fill();
    c.globalAlpha = 1;
  }

  return { nombre: 'Radar', estado, dibujar };
}

/* --- 2. Ecualizador ------------------------------------ */
function crearEcualizador() {
  const N = 14;
  const estado = {
    barras: Array.from({ length: N }, () => ({
      h: Math.random() * 0.6 + 0.1,
      obj: Math.random() * 0.8 + 0.1,
      vel: 1.5 + Math.random() * 2,
    })),
    t: 0,
    proxActual: 0,
    inicializado: true,
  };

  function dibujar(c, w, h, dt) {
    estado.t += dt;

    if (estado.t >= estado.proxActual) {
      estado.barras.forEach(b => {
        b.obj = 0.08 + Math.random() * 0.88;
        b.vel = 1.5 + Math.random() * 2.5;
      });
      estado.proxActual = estado.t + 0.18 + Math.random() * 0.22;
    }

    estado.barras.forEach(b => {
      b.h += (b.obj - b.h) * b.vel * dt;
    });

    const totalW  = w * 0.9;
    const startX  = w * 0.05;
    const barW    = totalW / (N * 2 - 1);
    const espacio = barW;

    estado.barras.forEach((b, i) => {
      const x    = startX + i * (barW + espacio);
      const altPx = b.h * h * 0.88;
      const y    = h - altPx;
      c.fillStyle   = COLOR;
      c.globalAlpha = 0.22 + b.h * 0.55;
      c.fillRect(x, y, barW, altPx);
      /* Cap superior */
      c.globalAlpha = 0.35 + b.h * 0.35;
      c.fillRect(x, y - 1.5, barW, 1.5);
    });

    c.globalAlpha = 1;
  }

  return { nombre: 'Ecualizador', estado, dibujar };
}

/* --- 3. Onda senoidal ---------------------------------- */
function crearOnda() {
  const estado = { fase: 0, inicializado: true };

  function dibujar(c, w, h, dt) {
    estado.fase += dt * Math.PI * 0.85;

    c.beginPath();
    c.strokeStyle = COLOR;
    c.lineWidth   = 1.6;
    c.globalAlpha = 0.5;
    c.lineJoin    = 'round';

    for (let x = 0; x <= w; x += 2) {
      const y = h / 2 + Math.sin((x / w) * Math.PI * 4 + estado.fase) * h * 0.37;
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
    c.globalAlpha = 1;
  }

  return { nombre: 'Onda', estado, dibujar };
}

/* --- 4. Señal con ruido -------------------------------- */
function crearSenial() {
  const estado = { fase: 0, inicializado: true };

  function dibujar(c, w, h, dt) {
    estado.fase += dt * 1.1;
    const f = estado.fase;

    c.beginPath();
    c.strokeStyle = COLOR;
    c.lineWidth   = 1.5;
    c.globalAlpha = 0.5;
    c.lineJoin    = 'round';

    for (let x = 0; x <= w; x += 2) {
      const t = x / w;
      const y = h / 2
        + Math.sin(t * 42 + f * 3.1) * h * 0.13
        + Math.sin(t * 97 + f * 7.3) * h * 0.07
        + Math.sin(t * 183 + f * 13) * h * 0.05
        + Math.sin(t * 24  + f)      * h * 0.10;
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
    c.globalAlpha = 1;
  }

  return { nombre: 'Señal', estado, dibujar };
}

/* --- 5. Anillo de progreso ----------------------------- */
function crearAnillo() {
  const estado = { angulo: 0, inicializado: true };

  function dibujar(c, w, h, dt) {
    estado.angulo += dt * 0.75;

    const cx    = w / 2;
    const cy    = h / 2;
    const rExt  = Math.min(w / 2, h / 2) * 0.82;
    const gros  = rExt * 0.30;
    const rMed  = rExt - gros / 2;
    const pulso = (Math.sin(estado.angulo * 2.2) + 1) / 2;
    const arco  = (0.35 + pulso * 0.60) * Math.PI * 2;

    /* Fondo */
    c.beginPath();
    c.arc(cx, cy, rMed, 0, Math.PI * 2);
    c.strokeStyle = COLOR;
    c.lineWidth   = gros;
    c.globalAlpha = 0.07;
    c.stroke();

    /* Arco activo */
    c.beginPath();
    c.arc(cx, cy, rMed, -Math.PI / 2 + estado.angulo, -Math.PI / 2 + estado.angulo + arco);
    c.strokeStyle = COLOR;
    c.lineWidth   = gros;
    c.lineCap     = 'round';
    c.globalAlpha = 0.32 + pulso * 0.28;
    c.stroke();

    /* Texto central */
    const tamF = Math.max(Math.floor(rMed * 0.58), 8);
    c.globalAlpha   = 0.5 + pulso * 0.35;
    c.fillStyle     = COLOR;
    c.font          = `bold ${tamF}px 'Orbitron', monospace`;
    c.textAlign     = 'center';
    c.textBaseline  = 'middle';
    c.fillText(`${Math.floor(pulso * 100)}%`, cx, cy);

    c.globalAlpha  = 1;
    c.textAlign    = 'start';
    c.textBaseline = 'alphabetic';
  }

  return { nombre: 'Anillo', estado, dibujar };
}

/* --- 6. Partículas / flujo de datos -------------------- */
function crearParticulas() {
  const N = 22;
  const estado = { pts: [], inicializado: false };

  function inicializar(w, h) {
    estado.pts = Array.from({ length: N }, () => ({
      x:     Math.random() * w,
      y:     Math.random() * h,
      vx:    -(0.8 + Math.random() * 2.6),
      radio: 0.8 + Math.random() * 1.6,
      alpha: 0.25 + Math.random() * 0.55,
      cola:  8   + Math.random() * 24,
    }));
    estado.inicializado = true;
  }

  function dibujar(c, w, h, dt) {
    if (!estado.inicializado) inicializar(w, h);

    estado.pts.forEach(p => {
      p.x += p.vx * dt * 60;
      if (p.x + p.cola < 0) {
        p.x    = w + 5;
        p.y    = Math.random() * h;
        p.vx   = -(0.8 + Math.random() * 2.6);
        p.cola = 8 + Math.random() * 24;
      }

      /* Cola con gradiente */
      const grad = c.createLinearGradient(p.x, p.y, p.x + p.cola, p.y);
      grad.addColorStop(0, `rgba(0,255,194,${p.alpha})`);
      grad.addColorStop(1, 'rgba(0,255,194,0)');
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + p.cola, p.y);
      c.strokeStyle = grad;
      c.lineWidth   = p.radio * 2;
      c.globalAlpha = 1;
      c.stroke();

      /* Cabeza brillante */
      c.beginPath();
      c.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      c.fillStyle   = COLOR;
      c.globalAlpha = p.alpha + 0.2;
      c.fill();
    });

    c.globalAlpha = 1;
  }

  return { nombre: 'Partículas', estado, dibujar };
}

/* --- 7. Binario / hexadecimal -------------------------- */
function crearBinario() {
  const CHARS = '0123456789ABCDEF';
  const estado = { t: 0, celdas: [], cols: 0, inicializado: false };

  function inicializar(cols) {
    const FILAS = 2;
    estado.cols = cols;
    estado.celdas = Array.from({ length: cols * FILAS }, () => ({
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      alpha: 0.15 + Math.random() * 0.7,
      prox:  Math.random() * 1.5,
    }));
    estado.inicializado = true;
  }

  function dibujar(c, w, h, dt) {
    estado.t += dt;

    const FILAS  = 2;
    const cols   = Math.floor(w / 22);
    if (!estado.inicializado || estado.cols !== cols) inicializar(cols);

    const colW  = w / cols;
    const filaH = h / FILAS;
    const tamF  = Math.max(Math.floor(Math.min(colW * 0.65, filaH * 0.55)), 7);

    c.font         = `bold ${tamF}px 'Orbitron', monospace`;
    c.textAlign    = 'center';
    c.textBaseline = 'middle';

    estado.celdas.forEach((cel, i) => {
      if (estado.t >= cel.prox) {
        cel.char  = CHARS[Math.floor(Math.random() * CHARS.length)];
        cel.alpha = 0.1 + Math.random() * 0.75;
        cel.prox  = estado.t + 0.05 + Math.random() * 1.2;
      }
      const col  = i % cols;
      const fila = Math.floor(i / cols);
      c.fillStyle   = COLOR;
      c.globalAlpha = cel.alpha;
      c.fillText(cel.char, col * colW + colW / 2, fila * filaH + filaH / 2);
    });

    c.globalAlpha  = 1;
    c.textAlign    = 'start';
    c.textBaseline = 'alphabetic';
  }

  return { nombre: 'Binario', estado, dibujar };
}

/* ----- Registro de todas las animaciones --------------- */
const animaciones = [
  crearEkg(),
  crearRadar(),
  crearEcualizador(),
  crearOnda(),
  crearSenial(),
  crearAnillo(),
  crearParticulas(),
  crearBinario(),
];

let indiceActual = 0;

/* ----- Indicador de puntos y nombre -------------------- */
function crearIndicador() {
  animDotsEl.textContent = '';
  animaciones.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.classList.add('smartwatch__anim-dot');
    if (i === indiceActual) dot.classList.add('smartwatch__anim-dot--activo');
    animDotsEl.appendChild(dot);
  });
}

function actualizarIndicador() {
  const dots = animDotsEl.querySelectorAll('.smartwatch__anim-dot');
  dots.forEach((d, i) => {
    d.classList.toggle('smartwatch__anim-dot--activo', i === indiceActual);
  });
  animNombreEl.textContent = '';
  animNombreEl.appendChild(document.createTextNode(animaciones[indiceActual].nombre));
}

crearIndicador();
actualizarIndicador();

/* ----- Cambio de animación al hacer clic --------------- */
function cambiarAnimacion(e) {
  e.preventDefault();
  indiceActual = (indiceActual + 1) % animaciones.length;
  actualizarIndicador();
}

animSeccionEl.addEventListener('click', cambiarAnimacion);
animSeccionEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') cambiarAnimacion(e);
});

/* =========================================================
   BUCLE PRINCIPAL DE ANIMACIÓN
   ========================================================= */
let tiempoAnterior = performance.now();

function loop(ahora) {
  const dt = Math.min((ahora - tiempoAnterior) / 1000, 0.1);
  tiempoAnterior = ahora;

  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  animaciones[indiceActual].dibujar(ctx, canvasEl.width, canvasEl.height, dt);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
