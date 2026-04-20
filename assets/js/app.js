/* =========================================================
   SMARTWATCH – Lógica principal
   ========================================================= */

/* ----- Referencias al DOM -------------------------------- */
const themeToggleEl  = document.getElementById('js-theme-toggle');
const hoursEl        = document.getElementById('js-hours');
const minutesEl      = document.getElementById('js-minutes');
const secondsEl      = document.getElementById('js-seconds');
const ampmEl         = document.getElementById('js-ampm');
const timeLabelEl    = document.getElementById('js-time-label');
const timeSectionEl  = document.getElementById('js-time-section');
const monthEl        = document.getElementById('js-month');
const dayEl          = document.getElementById('js-day');
const weekdayEl      = document.getElementById('js-weekday');
const temperatureEl  = document.getElementById('js-temperature');
const rainEl         = document.getElementById('js-rain');
const countryEl      = document.getElementById('js-country');
const syncTextEl     = document.getElementById('js-sync-text');
const notifEl        = document.getElementById('js-notification');
const notifMsgEl     = document.getElementById('js-notification-msg');

/* ----- Constantes de fecha en español -------------------- */
const MESES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPT', 'OCTUBRE', 'NOV', 'DIC',
];
const DIAS_SEMANA = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

/* =========================================================
   RELOJ, FECHA Y TOGGLE 24H / 12H
   ========================================================= */
function padDos(n) {
  return String(n).padStart(2, '0');
}

let formato24h = true;

function actualizarReloj() {
  const ahora    = new Date();
  const horas    = ahora.getHours();
  const minutos  = ahora.getMinutes();
  const segundos = ahora.getSeconds();

  if (formato24h) {
    hoursEl.textContent = padDos(horas);
    ampmEl.classList.add('smartwatch__time-ampm--oculto');
  } else {
    const h12    = horas % 12 || 12;
    const periodo = horas < 12 ? 'AM' : 'PM';
    hoursEl.textContent = padDos(h12);
    ampmEl.textContent  = '';
    ampmEl.appendChild(document.createTextNode(periodo));
    ampmEl.classList.remove('smartwatch__time-ampm--oculto');
  }

  minutesEl.textContent = padDos(minutos);
  secondsEl.textContent = padDos(segundos);
  monthEl.textContent   = MESES[ahora.getMonth()];
  dayEl.textContent     = padDos(ahora.getDate());
  weekdayEl.textContent = DIAS_SEMANA[ahora.getDay()];
}

function toggleFormato(e) {
  e.preventDefault();
  formato24h = !formato24h;
  const etiqueta = formato24h ? 'Hora del Sistema' : 'Hora (12 H)';
  timeLabelEl.textContent = '';
  timeLabelEl.appendChild(document.createTextNode(etiqueta));
  actualizarReloj();
}

timeSectionEl.addEventListener('click', toggleFormato);
timeSectionEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') toggleFormato(e);
});

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
   TABLA ISO 3166-1 alpha-2 → alpha-3 (códigos de país)
   ========================================================= */
const CODIGOS_PAIS = {
  ad:'AND', ae:'ARE', af:'AFG', ag:'ATG', al:'ALB', am:'ARM', ao:'AGO',
  ar:'ARG', at:'AUT', au:'AUS', az:'AZE', ba:'BIH', bb:'BRB', bd:'BGD',
  be:'BEL', bf:'BFA', bg:'BGR', bh:'BHR', bi:'BDI', bj:'BEN', bn:'BRN',
  bo:'BOL', br:'BRA', bs:'BHS', bt:'BTN', bw:'BWA', by:'BLR', bz:'BLZ',
  ca:'CAN', cd:'COD', cf:'CAF', cg:'COG', ch:'CHE', ci:'CIV', cl:'CHL',
  cm:'CMR', cn:'CHN', co:'COL', cr:'CRI', cu:'CUB', cv:'CPV', cy:'CYP',
  cz:'CZE', de:'DEU', dj:'DJI', dk:'DNK', dm:'DMA', do:'DOM', dz:'DZA',
  ec:'ECU', ee:'EST', eg:'EGY', er:'ERI', es:'ESP', et:'ETH', fi:'FIN',
  fj:'FJI', fr:'FRA', ga:'GAB', gb:'GBR', gd:'GRD', ge:'GEO', gh:'GHA',
  gm:'GMB', gn:'GIN', gq:'GNQ', gr:'GRC', gt:'GTM', gw:'GNB', gy:'GUY',
  hn:'HND', hr:'HRV', ht:'HTI', hu:'HUN', id:'IDN', ie:'IRL', il:'ISR',
  in:'IND', iq:'IRQ', ir:'IRN', is:'ISL', it:'ITA', jm:'JAM', jo:'JOR',
  jp:'JPN', ke:'KEN', kg:'KGZ', kh:'KHM', ki:'KIR', km:'COM', kn:'KNA',
  kp:'PRK', kr:'KOR', kw:'KWT', kz:'KAZ', la:'LAO', lb:'LBN', lc:'LCA',
  li:'LIE', lk:'LKA', lr:'LBR', ls:'LSO', lt:'LTU', lu:'LUX', lv:'LVA',
  ly:'LBY', ma:'MAR', mc:'MCO', md:'MDA', me:'MNE', mg:'MDG', mh:'MHL',
  mk:'MKD', ml:'MLI', mm:'MMR', mn:'MNG', mr:'MRT', mt:'MLT', mu:'MUS',
  mv:'MDV', mw:'MWI', mx:'MEX', my:'MYS', mz:'MOZ', na:'NAM', ne:'NER',
  ng:'NGA', ni:'NIC', nl:'NLD', no:'NOR', np:'NPL', nr:'NRU', nz:'NZL',
  om:'OMN', pa:'PAN', pe:'PER', pg:'PNG', ph:'PHL', pk:'PAK', pl:'POL',
  pt:'PRT', pw:'PLW', py:'PRY', qa:'QAT', ro:'ROU', rs:'SRB', ru:'RUS',
  rw:'RWA', sa:'SAU', sb:'SLB', sc:'SYC', sd:'SDN', se:'SWE', sg:'SGP',
  si:'SVN', sk:'SVK', sl:'SLE', sm:'SMR', sn:'SEN', so:'SOM', sr:'SUR',
  ss:'SSD', st:'STP', sv:'SLV', sy:'SYR', sz:'SWZ', td:'TCD', tg:'TGO',
  th:'THA', tj:'TJK', tl:'TLS', tm:'TKM', tn:'TUN', to:'TON', tr:'TUR',
  tt:'TTO', tv:'TUV', tz:'TZA', ua:'UKR', ug:'UGA', us:'USA', uy:'URY',
  uz:'UZB', va:'VAT', vc:'VCT', ve:'VEN', vn:'VNM', vu:'VUT', ws:'WSM',
  ye:'YEM', za:'ZAF', zm:'ZMB', zw:'ZWE',
};

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

  const datos  = await respuesta.json();
  const temp   = Math.round(datos.current.temperature_2m);
  const lluvia = datos.hourly.precipitation_probability[new Date().getHours()] ?? '--';

  temperatureEl.textContent = '';
  temperatureEl.appendChild(document.createTextNode(`${temp}°C`));
  rainEl.textContent = '';
  rainEl.appendChild(document.createTextNode(`${lluvia}%`));
  syncTextEl.textContent = '';
  syncTextEl.appendChild(document.createTextNode('Sincronizado'));
}

/* Reverse geocoding con Nominatim (OpenStreetMap, sin API key) */
async function obtenerPais(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const respuesta = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!respuesta.ok) throw new Error('Geocoding no disponible');

  const datos   = await respuesta.json();
  const codigo2 = (datos.address?.country_code ?? '').toLowerCase();
  const codigo3 = CODIGOS_PAIS[codigo2] ?? (codigo2.toUpperCase().slice(0, 3) || '---');

  countryEl.textContent = '';
  countryEl.appendChild(document.createTextNode(codigo3));
}

function manejarErrorUbicacion(err) {
  const msgs = { 1: 'Ubicación denegada.', 2: 'Ubicación no disponible.', 3: 'Tiempo agotado.' };
  mostrarNotificacion(msgs[err.code] ?? 'Error de ubicación.');
  syncTextEl.textContent = '';
  syncTextEl.appendChild(document.createTextNode('Sin conexión'));
}

async function manejarExitoUbicacion(pos) {
  const { latitude: lat, longitude: lon } = pos.coords;

  /* Clima y país en paralelo; cada uno falla de forma independiente */
  const [climaResult, paisResult] = await Promise.allSettled([
    obtenerClima(lat, lon),
    obtenerPais(lat, lon),
  ]);

  if (climaResult.status === 'rejected') {
    mostrarNotificacion('No se pudo obtener el clima.');
    syncTextEl.textContent = '';
    syncTextEl.appendChild(document.createTextNode('Error de red'));
  }
  if (paisResult.status === 'rejected') {
    countryEl.textContent = '';
    countryEl.appendChild(document.createTextNode('---'));
  }
}

function iniciarClima() {
  if (!('geolocation' in navigator)) { mostrarNotificacion('Sin geolocalización.'); return; }
  syncTextEl.textContent = '';
  syncTextEl.appendChild(document.createTextNode('Sincronizando…'));
  navigator.geolocation.getCurrentPosition(manejarExitoUbicacion, manejarErrorUbicacion, { timeout: 10000 });
}

iniciarClima();
setInterval(iniciarClima, 30 * 60 * 1000);

/* =========================================================
   SISTEMA DE ANIMACIONES – 14 animaciones ciclables
   ========================================================= */
const canvasEl      = document.getElementById('js-anim-canvas');
const animSeccionEl = document.getElementById('js-anim-section');
const animNombreEl  = document.getElementById('js-anim-nombre');
const animDotsEl    = document.getElementById('js-anim-dots');
const ctx           = canvasEl.getContext('2d');
let C               = '#00ffc2'; /* color base — se actualiza con el tema */

/* =========================================================
   TOGGLE DE TEMA (oscuro / claro)
   ========================================================= */
const COLOR_OSCURO = '#00ffc2';
const COLOR_CLARO  = '#006644';

let modoClaro = localStorage.getItem('smartwatch-tema') === 'claro';

function aplicarTema(claro) {
  modoClaro = claro;
  C = claro ? COLOR_CLARO : COLOR_OSCURO;
  document.body.classList.toggle('light-mode', claro);
  themeToggleEl.setAttribute(
    'aria-label',
    claro ? 'Activar modo oscuro' : 'Activar modo claro'
  );
  localStorage.setItem('smartwatch-tema', claro ? 'claro' : 'oscuro');
}

function toggleTema() {
  aplicarTema(!modoClaro);
}

themeToggleEl.addEventListener('click', toggleTema);
themeToggleEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTema(); }
});

/* Aplica el tema guardado al cargar */
if (modoClaro) aplicarTema(true);

function ajustarCanvas() {
  canvasEl.width  = canvasEl.offsetWidth  || 270;
  canvasEl.height = canvasEl.offsetHeight || 65;
}
ajustarCanvas();
window.addEventListener('resize', () => {
  ajustarCanvas();
  animaciones.forEach(a => { a.estado.inicializado = false; });
});

/* =========================================================
   ANIMACIONES ORIGINALES (8)
   ========================================================= */

/* 0 · EKG ------------------------------------------------- */
function crearEkg() {
  const pts = [
    [0,.5],[40,.5],[45,.25],[50,.75],[55,.5],
    [80,.5],[85,.125],[90,.875],[95,.5],
    [130,.5],[135,.375],[140,.625],[145,.5],[200,.5],
  ];
  const estado = { offset: 0, inicializado: true };

  function dibujar(c, w, h, dt) {
    estado.offset = (estado.offset + dt * 32) % 200;
    c.beginPath(); c.strokeStyle = C; c.lineWidth = 1.5;
    c.globalAlpha = 0.5; c.lineJoin = 'round'; c.lineCap = 'round';
    const reps = Math.ceil(w / 200) + 2;
    for (let r = -1; r < reps; r++) {
      pts.forEach(([x, yn], i) => {
        const cx = x + r * 200 - estado.offset, cy = yn * h;
        (r === -1 && i === 0) ? c.moveTo(cx, cy) : c.lineTo(cx, cy);
      });
    }
    c.stroke(); c.globalAlpha = 1;
  }
  return { nombre: 'EKG', estado, dibujar };
}

/* 1 · Radar ----------------------------------------------- */
function crearRadar() {
  const estado = { t: 0, inicializado: true };
  function dibujar(c, w, h, dt) {
    estado.t += dt;
    const cx = w/2, cy = h/2, rMax = Math.min(w/2,h/2)*0.86, DUR = 2.5;
    c.globalAlpha = 0.18; c.strokeStyle = C; c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(cx-rMax,cy); c.lineTo(cx+rMax,cy);
    c.moveTo(cx,cy-rMax); c.lineTo(cx,cy+rMax);
    c.stroke();
    for (let i = 0; i < 3; i++) {
      const fase = ((estado.t + i*(DUR/3)) % DUR)/DUR;
      c.beginPath(); c.arc(cx, cy, fase*rMax, 0, Math.PI*2);
      c.strokeStyle = C; c.lineWidth = 1.5; c.globalAlpha = (1-fase)*0.65; c.stroke();
    }
    c.beginPath(); c.arc(cx, cy, 2.5, 0, Math.PI*2);
    c.fillStyle = C; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1;
  }
  return { nombre: 'Radar', estado, dibujar };
}

/* 2 · Ecualizador ----------------------------------------- */
function crearEcualizador() {
  const N = 14;
  const estado = {
    barras: Array.from({length:N},()=>({h:Math.random()*.6+.1,obj:Math.random()*.8+.1,vel:1.5+Math.random()*2})),
    t:0, proxActual:0, inicializado:true,
  };
  function dibujar(c, w, h, dt) {
    estado.t += dt;
    if (estado.t >= estado.proxActual) {
      estado.barras.forEach(b=>{b.obj=.08+Math.random()*.88;b.vel=1.5+Math.random()*2.5;});
      estado.proxActual = estado.t + .18 + Math.random()*.22;
    }
    estado.barras.forEach(b => { b.h += (b.obj - b.h) * b.vel * dt; });
    const bW = (w*.9)/(N*2-1), sX = w*.05;
    estado.barras.forEach((b,i)=>{
      const x=sX+i*(bW+bW), alt=b.h*h*.88, y=h-alt;
      c.fillStyle=C; c.globalAlpha=.22+b.h*.55; c.fillRect(x,y,bW,alt);
      c.globalAlpha=.35+b.h*.35; c.fillRect(x,y-1.5,bW,1.5);
    });
    c.globalAlpha=1;
  }
  return { nombre: 'Ecualizador', estado, dibujar };
}

/* 3 · Onda senoidal --------------------------------------- */
function crearOnda() {
  const estado = { fase:0, inicializado:true };
  function dibujar(c, w, h, dt) {
    estado.fase += dt*Math.PI*.85;
    c.beginPath(); c.strokeStyle=C; c.lineWidth=1.6; c.globalAlpha=.5; c.lineJoin='round';
    for (let x=0;x<=w;x+=2){const y=h/2+Math.sin((x/w)*Math.PI*4+estado.fase)*h*.37;x===0?c.moveTo(x,y):c.lineTo(x,y);}
    c.stroke(); c.globalAlpha=1;
  }
  return { nombre: 'Onda', estado, dibujar };
}

/* 4 · Señal con ruido ------------------------------------- */
function crearSenial() {
  const estado = { fase:0, inicializado:true };
  function dibujar(c, w, h, dt) {
    estado.fase += dt*1.1; const f=estado.fase;
    c.beginPath(); c.strokeStyle=C; c.lineWidth=1.5; c.globalAlpha=.5; c.lineJoin='round';
    for (let x=0;x<=w;x+=2){
      const t=x/w;
      const y=h/2+Math.sin(t*42+f*3.1)*h*.13+Math.sin(t*97+f*7.3)*h*.07
             +Math.sin(t*183+f*13)*h*.05+Math.sin(t*24+f)*h*.10;
      x===0?c.moveTo(x,y):c.lineTo(x,y);
    }
    c.stroke(); c.globalAlpha=1;
  }
  return { nombre: 'Señal', estado, dibujar };
}

/* 5 · Anillo de progreso ---------------------------------- */
function crearAnillo() {
  const estado = { angulo:0, inicializado:true };
  function dibujar(c, w, h, dt) {
    estado.angulo += dt*.75;
    const cx=w/2,cy=h/2,rE=Math.min(w/2,h/2)*.82,gr=rE*.30,rM=rE-gr/2;
    const pulso=(Math.sin(estado.angulo*2.2)+1)/2;
    c.beginPath();c.arc(cx,cy,rM,0,Math.PI*2);c.strokeStyle=C;c.lineWidth=gr;c.globalAlpha=.07;c.stroke();
    c.beginPath();c.arc(cx,cy,rM,-Math.PI/2+estado.angulo,-Math.PI/2+estado.angulo+(0.35+pulso*.60)*Math.PI*2);
    c.strokeStyle=C;c.lineWidth=gr;c.lineCap='round';c.globalAlpha=.32+pulso*.28;c.stroke();
    const tamF=Math.max(Math.floor(rM*.58),8);
    c.globalAlpha=.5+pulso*.35;c.fillStyle=C;
    c.font=`bold ${tamF}px 'Orbitron',monospace`;c.textAlign='center';c.textBaseline='middle';
    c.fillText(`${Math.floor(pulso*100)}%`,cx,cy);
    c.globalAlpha=1;c.textAlign='start';c.textBaseline='alphabetic';
  }
  return { nombre: 'Anillo', estado, dibujar };
}

/* 6 · Partículas / flujo de datos ------------------------- */
function crearParticulas() {
  const estado = { pts:[], inicializado:false };
  function init(w,h){
    estado.pts=Array.from({length:22},()=>({
      x:Math.random()*w, y:Math.random()*h,
      vx:-(0.8+Math.random()*2.6), radio:.8+Math.random()*1.6,
      alpha:.25+Math.random()*.55, cola:8+Math.random()*24,
    }));
    estado.inicializado=true;
  }
  function dibujar(c, w, h, dt) {
    if(!estado.inicializado) init(w,h);
    estado.pts.forEach(p=>{
      p.x+=p.vx*dt*60;
      if(p.x+p.cola<0){p.x=w+5;p.y=Math.random()*h;p.vx=-(0.8+Math.random()*2.6);p.cola=8+Math.random()*24;}
      const g=c.createLinearGradient(p.x,p.y,p.x+p.cola,p.y);
      g.addColorStop(0,`rgba(0,255,194,${p.alpha})`);g.addColorStop(1,'rgba(0,255,194,0)');
      c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+p.cola,p.y);
      c.strokeStyle=g;c.lineWidth=p.radio*2;c.globalAlpha=1;c.stroke();
      c.beginPath();c.arc(p.x,p.y,p.radio,0,Math.PI*2);
      c.fillStyle=C;c.globalAlpha=p.alpha+.2;c.fill();
    });
    c.globalAlpha=1;
  }
  return { nombre: 'Partículas', estado, dibujar };
}

/* 7 · Binario / hexadecimal ------------------------------- */
function crearBinario() {
  const HEX='0123456789ABCDEF';
  const estado={t:0,celdas:[],cols:0,inicializado:false};
  function init(cols){
    estado.cols=cols;
    estado.celdas=Array.from({length:cols*2},()=>({
      char:HEX[Math.floor(Math.random()*HEX.length)],
      alpha:.15+Math.random()*.7, prox:Math.random()*1.5,
    }));
    estado.inicializado=true;
  }
  function dibujar(c, w, h, dt) {
    estado.t+=dt;
    const cols=Math.floor(w/22);
    if(!estado.inicializado||estado.cols!==cols) init(cols);
    const cW=w/cols, fH=h/2, tamF=Math.max(Math.floor(Math.min(cW*.65,fH*.55)),7);
    c.font=`bold ${tamF}px 'Orbitron',monospace`;c.textAlign='center';c.textBaseline='middle';
    estado.celdas.forEach((cel,i)=>{
      if(estado.t>=cel.prox){
        cel.char=HEX[Math.floor(Math.random()*HEX.length)];
        cel.alpha=.1+Math.random()*.75; cel.prox=estado.t+.05+Math.random()*1.2;
      }
      c.fillStyle=C;c.globalAlpha=cel.alpha;
      c.fillText(cel.char,(i%cols)*cW+cW/2,Math.floor(i/cols)*fH+fH/2);
    });
    c.globalAlpha=1;c.textAlign='start';c.textBaseline='alphabetic';
  }
  return { nombre: 'Binario', estado, dibujar };
}

/* =========================================================
   ANIMACIONES NUEVAS (6)
   ========================================================= */

/* 8 · Matrix Rain ----------------------------------------- */
function crearMatrixRain() {
  const CHARS = '0123456789ABCDEF';
  const TAM   = 9;
  const estado = { t:0, cols:[], inicializado:false };

  function init(w, h) {
    const n = Math.floor(w / TAM);
    estado.cols = Array.from({length:n}, (_, i) => ({
      x:    i * TAM + TAM / 2,
      y:    -Math.random() * h,
      vel:  22 + Math.random() * 45,
      len:  4  + Math.floor(Math.random() * 7),
      chars: [],
      proxChar: 0,
    }));
    estado.inicializado = true;
    estado.n = n;
  }

  function dibujar(c, w, h, dt) {
    estado.t += dt;
    const n = Math.floor(w / TAM);
    if (!estado.inicializado || estado.n !== n) init(w, h);

    c.font         = `bold ${TAM - 1}px 'Orbitron', monospace`;
    c.textAlign    = 'center';
    c.textBaseline = 'top';

    estado.cols.forEach(col => {
      col.y += col.vel * dt;
      if (col.y > h + col.len * TAM) {
        col.y   = -TAM;
        col.vel = 22 + Math.random() * 45;
        col.len = 4  + Math.floor(Math.random() * 7);
      }
      for (let j = 0; j < col.len; j++) {
        const cy = col.y - j * TAM;
        if (cy < -TAM || cy > h + TAM) continue;
        if (!col.chars[j] || estado.t > col.chars[j].prox) {
          if (!col.chars[j]) col.chars[j] = {};
          col.chars[j].char = CHARS[Math.floor(Math.random() * CHARS.length)];
          col.chars[j].prox = estado.t + 0.04 + Math.random() * 0.25;
        }
        c.fillStyle   = C;
        c.globalAlpha = j === 0 ? 0.9 : (1 - j / col.len) * 0.45;
        c.fillText(col.chars[j].char, col.x, cy);
      }
    });

    c.globalAlpha  = 1;
    c.textAlign    = 'start';
    c.textBaseline = 'alphabetic';
  }
  return { nombre: 'Matrix', estado, dibujar };
}

/* 9 · Asteroides ------------------------------------------ */
function crearAsteroides() {
  const estado = { pts:[], inicializado:false };

  function nuevoAsteroide(w, h) {
    const ang = Math.random() * Math.PI * 2;
    const vel = 18 + Math.random() * 38;
    return {
      x: Math.random() * w, y: Math.random() * h,
      vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3.5,
      ancho: 1.5 + Math.random() * 2.5,
      largo: 5   + Math.random() * 10,
      alpha: 0.2 + Math.random() * 0.5,
    };
  }

  function init(w, h) {
    estado.pts = Array.from({length:16}, () => nuevoAsteroide(w, h));
    estado.inicializado = true;
  }

  function dibujar(c, w, h, dt) {
    if (!estado.inicializado) init(w, h);

    estado.pts.forEach(a => {
      a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vRot * dt;
      if (a.x < -20 || a.x > w+20 || a.y < -20 || a.y > h+20) {
        const edge = Math.floor(Math.random()*4);
        if (edge===0){a.x=Math.random()*w;a.y=-10;}
        else if (edge===1){a.x=w+10;a.y=Math.random()*h;}
        else if (edge===2){a.x=Math.random()*w;a.y=h+10;}
        else{a.x=-10;a.y=Math.random()*h;}
        const ang=Math.random()*Math.PI*2, vel=18+Math.random()*38;
        a.vx=Math.cos(ang)*vel; a.vy=Math.sin(ang)*vel;
      }
      c.save();
      c.translate(a.x, a.y); c.rotate(a.rot);
      c.fillStyle=C; c.globalAlpha=a.alpha;
      c.fillRect(-a.ancho/2, -a.largo/2, a.ancho, a.largo);
      c.restore();
    });
    c.globalAlpha = 1;
  }
  return { nombre: 'Asteroides', estado, dibujar };
}

/* 10 · Pulsos de red -------------------------------------- */
function crearRed() {
  const estado = { nodos:[], conexiones:[], pulsos:[], t:0, proxPulso:0, inicializado:false };

  function init(w, h) {
    const N = 6;
    estado.nodos = Array.from({length:N}, () => ({
      x: w * 0.08 + Math.random() * w * 0.84,
      y: h * 0.15 + Math.random() * h * 0.70,
    }));
    estado.conexiones = [];
    for (let i = 0; i < N; i++) {
      estado.conexiones.push([i, (i+1) % N]);
      if (Math.random() > 0.4) estado.conexiones.push([i, (i+2) % N]);
    }
    estado.pulsos      = [];
    estado.proxPulso   = 0;
    estado.inicializado = true;
  }

  function dibujar(c, w, h, dt) {
    if (!estado.inicializado) init(w, h);
    estado.t += dt;

    if (estado.t > estado.proxPulso && estado.conexiones.length) {
      const conn = estado.conexiones[Math.floor(Math.random() * estado.conexiones.length)];
      estado.pulsos.push({ desde:conn[0], hasta:conn[1], t:0 });
      estado.proxPulso = estado.t + 0.25 + Math.random() * 0.45;
    }

    /* Líneas de conexión */
    estado.conexiones.forEach(([i,j]) => {
      c.beginPath();
      c.moveTo(estado.nodos[i].x, estado.nodos[i].y);
      c.lineTo(estado.nodos[j].x, estado.nodos[j].y);
      c.strokeStyle=C; c.lineWidth=0.6; c.globalAlpha=0.15; c.stroke();
    });

    /* Nodos */
    estado.nodos.forEach(n => {
      c.beginPath(); c.arc(n.x, n.y, 2.5, 0, Math.PI*2);
      c.fillStyle=C; c.globalAlpha=0.45; c.fill();
    });

    /* Pulsos viajando */
    estado.pulsos = estado.pulsos.filter(p => {
      p.t += dt * 1.6;
      if (p.t > 1) return false;
      const nd = estado.nodos[p.desde], nh = estado.nodos[p.hasta];
      const x  = nd.x + (nh.x - nd.x) * p.t;
      const y  = nd.y + (nh.y - nd.y) * p.t;
      /* halo */
      c.beginPath(); c.arc(x,y,5,0,Math.PI*2);
      c.fillStyle=C; c.globalAlpha=0.2; c.fill();
      /* punto */
      c.beginPath(); c.arc(x,y,2.5,0,Math.PI*2);
      c.fillStyle=C; c.globalAlpha=0.95; c.fill();
      return true;
    });

    c.globalAlpha = 1;
  }
  return { nombre: 'Red', estado, dibujar };
}

/* 11 · Warp speed ----------------------------------------- */
function crearWarp() {
  const estado = { estrellas:[], inicializado:false };

  function nuevaEstrella(w, h, distribuida) {
    const ang = Math.random() * Math.PI * 2;
    const s = {
      x: w/2, y: h/2, angulo: ang,
      vel: distribuida ? Math.random()*80 : 8 + Math.random()*20,
      acel: 55 + Math.random()*100,
      radio: 0.5 + Math.random(), alpha: 0.4 + Math.random()*0.4,
      px: w/2, py: h/2,
    };
    if (distribuida) {
      s.x += Math.cos(ang) * s.vel * (1 + Math.random());
      s.y += Math.sin(ang) * s.vel * (1 + Math.random());
      s.px = s.x; s.py = s.y;
    }
    return s;
  }

  function init(w, h) {
    estado.estrellas = Array.from({length:32}, () => nuevaEstrella(w, h, true));
    estado.inicializado = true;
  }

  function dibujar(c, w, h, dt) {
    if (!estado.inicializado) init(w, h);

    estado.estrellas.forEach(s => {
      s.px = s.x; s.py = s.y;
      s.vel = Math.min(s.vel + s.acel * dt, 320);
      s.x  += Math.cos(s.angulo) * s.vel * dt;
      s.y  += Math.sin(s.angulo) * s.vel * dt;

      if (s.x < -10 || s.x > w+10 || s.y < -10 || s.y > h+10) {
        Object.assign(s, nuevaEstrella(w, h, false));
        return;
      }

      const g = c.createLinearGradient(s.x, s.y, s.px, s.py);
      g.addColorStop(0, `rgba(0,255,194,${s.alpha})`);
      g.addColorStop(1, 'rgba(0,255,194,0)');
      c.beginPath(); c.moveTo(s.x,s.y); c.lineTo(s.px,s.py);
      c.strokeStyle=g; c.lineWidth=s.radio*2; c.globalAlpha=1; c.stroke();

      c.beginPath(); c.arc(s.x, s.y, s.radio, 0, Math.PI*2);
      c.fillStyle=C; c.globalAlpha=s.alpha; c.fill();
    });
    c.globalAlpha = 1;
  }
  return { nombre: 'Warp', estado, dibujar };
}

/* 12 · Burbujas de datos ---------------------------------- */
function crearBurbujas() {
  const estado = { burbujas:[], inicializado:false };

  function nuevaBurbuja(w, h, distribuida) {
    return {
      x:     Math.random() * w,
      y:     distribuida ? Math.random() * h : h + 15,
      vy:    -(8 + Math.random() * 20),
      vx:    (Math.random() - 0.5) * 10,
      radio: 3  + Math.random() * 11,
      alpha: 0.1 + Math.random() * 0.28,
      pulso: Math.random() * Math.PI * 2,
    };
  }

  function init(w, h) {
    estado.burbujas = Array.from({length:12}, () => nuevaBurbuja(w, h, true));
    estado.inicializado = true;
  }

  function dibujar(c, w, h, dt) {
    if (!estado.inicializado) init(w, h);

    estado.burbujas.forEach(b => {
      b.y += b.vy * dt; b.x += b.vx * dt; b.pulso += dt * 2;
      if (b.y + b.radio < 0) Object.assign(b, nuevaBurbuja(w, h, false));

      const r = b.radio * (1 + Math.sin(b.pulso) * 0.08);
      c.beginPath(); c.arc(b.x, b.y, r, 0, Math.PI*2);
      c.strokeStyle=C; c.lineWidth=1; c.globalAlpha=b.alpha; c.stroke();

      /* punto interno */
      c.beginPath(); c.arc(b.x, b.y, r*0.28, 0, Math.PI*2);
      c.fillStyle=C; c.globalAlpha=b.alpha*0.55; c.fill();
    });
    c.globalAlpha = 1;
  }
  return { nombre: 'Burbujas', estado, dibujar };
}

/* 13 · Lluvia de guiones (scan lines) --------------------- */
function crearLluvia() {
  const N = 18;
  const estado = { lineas:[], inicializado:false, wPrev:0 };

  function init(w, h) {
    const sepX = w / N;
    estado.lineas = Array.from({length:N}, (_, i) => ({
      x:     i * sepX + Math.random() * sepX,
      y:     Math.random() * h,
      vy:    30  + Math.random() * 80,
      largo: 4   + Math.random() * 16,
      alpha: 0.2 + Math.random() * 0.55,
      gros:  0.8 + Math.random() * 1.4,
    }));
    estado.wPrev = w;
    estado.inicializado = true;
  }

  function dibujar(c, w, h, dt) {
    if (!estado.inicializado || estado.wPrev !== w) init(w, h);

    estado.lineas.forEach(l => {
      l.y += l.vy * dt;
      if (l.y > h + 5) {
        l.y     = -l.largo;
        l.vy    = 30  + Math.random() * 80;
        l.largo = 4   + Math.random() * 16;
        l.alpha = 0.2 + Math.random() * 0.55;
      }
      c.beginPath(); c.moveTo(l.x, l.y); c.lineTo(l.x, l.y + l.largo);
      c.strokeStyle=C; c.lineWidth=l.gros; c.lineCap='round';
      c.globalAlpha=l.alpha; c.stroke();
    });
    c.globalAlpha = 1;
  }
  return { nombre: 'Lluvia', estado, dibujar };
}

/* =========================================================
   REGISTRO DE LAS 14 ANIMACIONES
   ========================================================= */
const animaciones = [
  crearEkg(),          /*  0 */
  crearRadar(),        /*  1 */
  crearEcualizador(),  /*  2 */
  crearOnda(),         /*  3 */
  crearSenial(),       /*  4 */
  crearAnillo(),       /*  5 */
  crearParticulas(),   /*  6 */
  crearBinario(),      /*  7 */
  crearMatrixRain(),   /*  8 */
  crearAsteroides(),   /*  9 */
  crearRed(),          /* 10 */
  crearWarp(),         /* 11 */
  crearBurbujas(),     /* 12 */
  crearLluvia(),       /* 13 */
];

let indiceActual = 0;

/* ----- Indicador de puntos ------------------------------- */
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
  animDotsEl.querySelectorAll('.smartwatch__anim-dot').forEach((d, i) => {
    d.classList.toggle('smartwatch__anim-dot--activo', i === indiceActual);
  });
  animNombreEl.textContent = '';
  animNombreEl.appendChild(document.createTextNode(animaciones[indiceActual].nombre));
}

crearIndicador();
actualizarIndicador();

/* ----- Cambio de animación ------------------------------- */
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
   BUCLE PRINCIPAL
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
