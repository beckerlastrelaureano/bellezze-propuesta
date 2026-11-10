// Bellezze v3 - GSAP + ScrollTrigger + Lenis + shader WebGL propio.
(() => {
  const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chico = matchMedia("(max-width: 760px)").matches;
  const raiz = document.documentElement;
  let pausado = false;

  // ---------- Datos y utilidades ----------
  const AMBIENTES = [
    { desde: 0,    nombre: "La vidriera",   detalle: "Frente vidriado sobre calle 26" },
    { desde: 2.6,  nombre: "El salón",      detalle: "Piso calcáreo original, 6,50 × 9 m" },
    { desde: 7.6,  nombre: "Sala de estar", detalle: "Con puerta ventana al patio" },
    { desde: 9.8,  nombre: "Kitchenette",   detalle: "Bacha, termotanque y pasillo" },
    { desde: 11.5, nombre: "La oficina",    detalle: "Grande, con ventana. Sirve de depósito" }
  ];
  const formato = (v, d) => v.toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const urlFoto = (n, w) => "https://inmobellezze.com.ar/propiedades/image.php/" + n + "?width=" + w + "&image=/propiedades/admin/fotos/" + n;
  function partirDireccion(dir) {
    const l = dir.replace(/\s+/g, " ").trim();
    const m = l.match(/^(.*?)(\s+e\/|\s+esq\.|\s+Nro\.?:?|,)\s*(.*)$/i);
    let calle = m ? m[1] : l, resto = m ? (m[2].trim() + " " + m[3]) : "";
    if (calle.length > 14) { resto = l; calle = ""; }
    resto = resto.replace(/^e\/\s*/i, "entre ").replace(/\s*e\/\s*/gi, " entre ").replace(/^esq\.\s*/i, "esquina ")
      .replace(/Nro\.?:?\s*/gi, "n.º ").replace(/^,\s*/, "").trim();
    return { calle, resto };
  }

  // ---------- Fichas ----------
  const cont = document.querySelector("[data-fichas]");
  const todas = [{ id: "1419", tipo: "Salón", op: "alquiler", dir: "26 e/15 y 17 Nro. 771", foto: "1768507859_0000.jpg", propia: true }]
    .concat(window.DESTACADAS || []);
  function pintar(op) {
    cont.innerHTML = "";
    todas.filter(p => op === "todas" || p.op === op).slice(0, 9).forEach(p => {
      const d = partirDireccion(p.dir);
      const li = document.createElement("li");
      li.className = "ficha";
      const href = p.propia ? "#recorrido" : "https://inmobellezze.com.ar/index.php?page=propiedad&id_prop=" + p.id;
      li.innerHTML = '<a href="' + href + '" data-cursor="Ver">' +
        '<div class="foto">' + (p.propia
          ? '<video src="../media/recorrido-26-771.mp4" poster="../media/recorrido-poster.jpg" muted loop playsinline preload="none" aria-hidden="true"></video><span class="chip amarillo">Recorrido en video</span>'
          : '<img loading="lazy" alt="' + p.tipo + ' en ' + p.dir + '" src="' + urlFoto(p.foto, 700) + '">') + '</div>' +
        '<div class="info"><p class="tipo"><b>' + p.tipo + '</b><span>' + (p.op === "venta" ? "En venta" : "En alquiler") + '</span></p>' +
        (d.calle ? '<h3 class="angosta">' + (/^\d/.test(d.calle) ? "Calle " : "") + d.calle + '</h3>' : "") +
        '<span class="resto">' + d.resto + '</span></div></a>';
      li.addEventListener("pointermove", e => {
        const r = li.getBoundingClientRect();
        li.style.setProperty("--mx", (e.clientX - r.left) + "px");
        li.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
      const v = li.querySelector("video");
      if (v) {
        li.addEventListener("mouseenter", () => v.play().catch(() => {}));
        li.addEventListener("mouseleave", () => v.pause());
      }
      cont.appendChild(li);
    });
    activarCursor(cont);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  document.querySelectorAll("[data-op]").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("[data-op]").forEach(x => x.setAttribute("aria-pressed", x === b));
    pintar(b.dataset.op);
  }));

  // ---------- Consulta ----------
  const form = document.querySelector("[data-consulta]");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const est = form.querySelector(".estado"), n = form.nombre.value.trim(), t = form.telefono.value.trim();
    if (!n || !t) { est.textContent = "Completá tu nombre y un teléfono para que te podamos llamar."; return; }
    location.href = "mailto:inmobiliariabellezze@gmail.com?subject=" + encodeURIComponent("Consulta desde la web") +
      "&body=" + encodeURIComponent("Nombre: " + n + "\nTeléfono: " + t + "\n\n" + form.mensaje.value.trim());
    est.textContent = "Se abrió tu correo con la consulta lista para enviar.";
  });

  // ---------- Cursor propio ----------
  const cursor = document.querySelector(".cursor"), punto = document.querySelector(".cursor-punto");
  const mouseFino = matchMedia("(hover: hover) and (pointer: fine)").matches;
  function activarCursor(ambito) {
    if (!mouseFino) return;
    ambito.querySelectorAll("[data-cursor]").forEach(el => {
      el.addEventListener("mouseenter", () => { cursor.classList.add("grande"); cursor.textContent = el.dataset.cursor; });
      el.addEventListener("mouseleave", () => { cursor.classList.remove("grande"); cursor.textContent = ""; });
    });
  }

  // ---------- Shader de la portada ----------
  const lienzo = document.getElementById("shader");
  const gl = lienzo.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  let dibujarShader = () => {};
  if (gl) {
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `precision mediump float;
      uniform vec2 r; uniform float t; uniform vec2 m;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}
      void main(){
        vec2 uv=gl_FragCoord.xy/r; vec2 q=uv*vec2(r.x/r.y,1.)*1.6;
        float tt=t*.045;
        vec2 w=vec2(fbm(q+vec2(tt,-tt)),fbm(q+vec2(-tt*.8,tt*1.2)+3.1));
        float f=fbm(q+2.2*w+m*.35);
        vec3 tinta=vec3(.071,.078,.098);
        vec3 amarillo=vec3(.95,.72,.02);
        vec3 rojo=vec3(.78,.06,.18);
        vec3 c=mix(tinta,rojo*.55,smoothstep(.35,.85,w.y)*.8);
        c=mix(c,amarillo*.8,smoothstep(.55,.95,f)*.75);
        c*=.55+.45*smoothstep(1.2,.2,length(uv-vec2(.72,.62)));
        c=mix(c,tinta,smoothstep(.15,-.25,uv.y)*.9+ (1.-uv.y)*.25);
        gl_FragColor=vec4(c,1.);
      }`;
    const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uM = gl.getUniformLocation(prog, "m");
      const escala = Math.min(devicePixelRatio, 1.5) * (chico ? .6 : .75);
      const ajustar = () => { lienzo.width = lienzo.clientWidth * escala; lienzo.height = lienzo.clientHeight * escala; gl.viewport(0, 0, lienzo.width, lienzo.height); };
      ajustar(); addEventListener("resize", ajustar);
      let mx = 0, my = 0, tm = 0, visible = true;
      addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = .5 - e.clientY / innerHeight; });
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(lienzo);
      let anterior = performance.now();
      dibujarShader = ahora => {
        const dt = (ahora - anterior) / 1000; anterior = ahora;
        if (visible && !pausado) {
          tm += dt * (reducido ? .35 : 1);
          gl.uniform2f(uR, lienzo.width, lienzo.height);
          gl.uniform1f(uT, tm + 20);
          gl.uniform2f(uM, mx, my);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      };
    }
  }

  // ---------- Video del recorrido ----------
  const video = document.querySelector(".recorrido video");
  video.src = chico ? video.dataset.srcChico : video.dataset.srcGrande;

  if (!window.gsap || !window.ScrollTrigger) { // sin librerías: video normal
    video.controls = true;
    pintar("todas");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (mouseFino) raiz.classList.add("con-cursor");

  // Scroll suave
  const lenis = window.Lenis ? new Lenis({ lerp: reducido ? 1 : 0.085 }) : null;
  if (lenis) { lenis.on("scroll", ScrollTrigger.update); }
  gsap.ticker.add(t => { if (lenis) lenis.raf(t * 1000); dibujarShader(performance.now()); });
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const destino = document.querySelector(a.getAttribute("href"));
    if (destino && lenis) { e.preventDefault(); lenis.scrollTo(destino, { offset: 0 }); }
  }));

  pintar("todas");

  // Entrada de la portada (único momento automático)
  gsap.from(".portada h1 .linea > span", { yPercent: 110, duration: 1.2, stagger: .12, ease: "power4.out", delay: .15 });
  gsap.from(".portada .sello, .portada .pie-portada > *", { y: 24, opacity: 0, duration: 1, stagger: .1, ease: "power3.out", delay: .5 });
  gsap.from(".nav", { y: -30, opacity: 0, duration: 1, ease: "power3.out", delay: .3 });

  // Portada: el texto se aleja al bajar
  gsap.to(".portada .contenido", { yPercent: -18, opacity: .2, ease: "none",
    scrollTrigger: { trigger: ".portada", start: "top top", end: "bottom top", scrub: true } });

  // Container scroll: la pantalla se aplana (0% a 16% del recorrido)
  gsap.timeline({ scrollTrigger: { trigger: ".recorrido", start: "top bottom", end: "16% top", scrub: true } })
    .fromTo(".pantalla", { rotateX: 32, scale: .82, y: 120 }, { rotateX: 0, scale: 1, y: 0, ease: "none" });
  gsap.timeline({ scrollTrigger: { trigger: ".recorrido", start: "14% top", end: "22% top", scrub: true } })
    .to(".recorrido .titulo", { y: -60, opacity: 0, ease: "none" }, 0)
    .to(".recorrido .fijo", { paddingBottom: 0, ease: "none" }, 0)
    .to(".pantalla", { width: "100vw", maxHeight: "100vh", height: "100vh", borderRadius: 0, ease: "none" }, 0)
    .to(".pantalla .ambiente, .pantalla .chips", { opacity: 1, ease: "none" }, .4);

  // Bajar = caminar (del 22% al 100%)
  let objetivo = 0, actual = 0, duracion = 0, paso = -1;
  const nombre = document.querySelector("[data-nombre]"), detalle = document.querySelector("[data-detalle]");
  video.addEventListener("loadedmetadata", () => { duracion = video.duration - .05; video.pause(); });
  gsap.ticker.add(() => {
    if (!duracion) return;
    actual += (objetivo - actual) * .2;
    if (Math.abs(objetivo - actual) > .004) video.currentTime = actual;
    marcarAmbiente(video.currentTime);
  });
  function marcarAmbiente(tiempo) {
    let i = 0; AMBIENTES.forEach((a, n) => { if (tiempo >= a.desde) i = n; });
    if (i === paso) return;
    paso = i;
    gsap.timeline()
      .to([nombre, detalle], { y: -12, opacity: 0, duration: .15 })
      .add(() => { nombre.textContent = AMBIENTES[i].nombre; detalle.textContent = AMBIENTES[i].detalle; })
      .fromTo([nombre, detalle], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .35, stagger: .05, ease: "power3.out" });
  }
  ScrollTrigger.create({
    trigger: ".recorrido", start: "22% top", end: "bottom bottom",
    onUpdate: s => {
      objetivo = s.progress * duracion;
      gsap.set(".pantalla .barra i", { scaleX: s.progress });
    }
  });

  // Números que cuentan
  document.querySelectorAll("[data-cuenta]").forEach(el => {
    const fin = +el.dataset.cuenta, d = +el.dataset.dec, o = { v: 0 };
    gsap.to(o, { v: fin, duration: 1.8, ease: "power3.out",
      scrollTrigger: { trigger: ".numeros", start: "top 80%", once: true },
      onStart: () => { el.textContent = formato(0, d); },
      onUpdate: () => { el.textContent = formato(o.v, d); } });
  });
  gsap.from(".ficha-datos h2, .ficha-datos p", { y: 40, opacity: 0, stagger: .1, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".ficha-datos", start: "top 75%" } });

  // Tarjetas apiladas: la de atrás se achica y oscurece
  const tarjetas = gsap.utils.toArray(".ambientes .tarjeta");
  tarjetas.forEach((t, i) => {
    if (i === tarjetas.length - 1) return;
    gsap.to(t, { scale: .9, filter: "brightness(.45)", ease: "none",
      scrollTrigger: { trigger: tarjetas[i + 1], start: "top bottom", end: "top 12%", scrub: true } });
  });

  // Fichas que aparecen
  ScrollTrigger.batch(".ficha", { start: "top 90%", once: true,
    onEnter: lote => gsap.from(lote, { y: 60, opacity: 0, duration: 1, stagger: .1, ease: "power3.out" }) });

  // Cierre: título gigante entra desde los costados
  gsap.from(".cierre h2 > span:first-child", { xPercent: -25, opacity: 0, ease: "none",
    scrollTrigger: { trigger: ".cierre", start: "top bottom", end: "top 30%", scrub: true } });
  gsap.from(".cierre h2 > span:last-child", { xPercent: 25, opacity: 0, ease: "none",
    scrollTrigger: { trigger: ".cierre", start: "top bottom", end: "top 30%", scrub: true } });

  // Botones imán
  if (mouseFino) {
    document.querySelectorAll("[data-iman]").forEach(el => {
      const x = gsap.quickTo(el, "x", { duration: .6, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: .6, ease: "power3.out" });
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .3); y((e.clientY - r.top - r.height / 2) * .3);
      });
      el.addEventListener("mouseleave", () => { x(0); y(0); });
    });
    const cx = gsap.quickTo(cursor, "x", { duration: .45, ease: "power3.out" });
    const cy = gsap.quickTo(cursor, "y", { duration: .45, ease: "power3.out" });
    addEventListener("pointermove", e => { cx(e.clientX); cy(e.clientY); gsap.set(punto, { x: e.clientX, y: e.clientY }); });
    activarCursor(document);
  }

  // Botón para pausar animaciones automáticas
  const bPausa = document.querySelector("[data-pausa]");
  const aplicarPausa = v => {
    pausado = v; raiz.classList.toggle("pausado", v);
    bPausa.setAttribute("aria-pressed", v);
    bPausa.textContent = v ? "Reanudar animaciones" : "Pausar animaciones";
  };
  bPausa.addEventListener("click", () => aplicarPausa(!pausado));
  if (reducido) aplicarPausa(false); // el sistema pide menos movimiento: el shader ya va más lento
})();
