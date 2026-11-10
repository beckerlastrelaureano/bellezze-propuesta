// Bellezze v2 - animaciones con GSAP + ScrollTrigger + Lenis.
// Idea central: bajar con el scroll = caminar por el salón.

(() => {
  // "Reducir movimiento" apaga lo automático (carga, deslizamientos, imán),
  // pero el recorrido por scroll sigue: lo controla la persona al bajar.
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quieto = !window.gsap || !window.ScrollTrigger;
  const chico = window.matchMedia("(max-width: 700px)").matches;
  const raiz = document.documentElement;
  if (quieto) raiz.classList.add("quieto");

  // ---------- Ambientes del recorrido (segundos del video) ----------
  const AMBIENTES = [
    { desde: 0,    nombre: "La vidriera",   detalle: "Frente vidriado sobre calle 26" },
    { desde: 2.6,  nombre: "El salón",      detalle: "Piso calcáreo original, 6,50 × 9 m" },
    { desde: 7.6,  nombre: "Sala de estar", detalle: "Con puerta ventana al patio" },
    { desde: 9.8,  nombre: "Kitchenette",   detalle: "Bacha, termotanque y pasillo" },
    { desde: 11.5, nombre: "La oficina",    detalle: "Grande, con ventana. Sirve de depósito" }
  ];

  // ---------- Utilidades ----------
  function partirDireccion(dir) {
    const limpio = dir.replace(/\s+/g, " ").trim();
    const m = limpio.match(/^(.*?)(\s+e\/|\s+esq\.|\s+Nro\.?:?|,)\s*(.*)$/i);
    let calle = m ? m[1] : limpio;
    let resto = m ? (m[2].trim() + " " + m[3]) : "";
    if (calle.length > 14) { resto = limpio; calle = ""; }
    resto = resto.replace(/^e\/\s*/i, "entre ").replace(/\s*e\/\s*/gi, " entre ")
      .replace(/^esq\.\s*/i, "esquina ").replace(/Nro\.?:?\s*/gi, "n.º ").replace(/^,\s*/, "").trim();
    return { calle, resto };
  }
  const urlFoto = (n, w) => "https://inmobellezze.com.ar/propiedades/image.php/" + n + "?width=" + w + "&image=/propiedades/admin/fotos/" + n;
  const formato = (v, dec) => v.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  // ---------- Fichas de otras propiedades ----------
  const contFichas = document.querySelector("[data-fichas]");
  if (contFichas && window.DESTACADAS) {
    window.DESTACADAS.slice(0, 9).forEach(p => {
      const d = partirDireccion(p.dir);
      const li = document.createElement("li");
      li.className = "ficha";
      li.innerHTML =
        '<a href="https://inmobellezze.com.ar/index.php?page=propiedad&id_prop=' + p.id + '">' +
          '<div class="marco"><img loading="lazy" alt="' + p.tipo + ' en ' + p.dir + '" src="' + urlFoto(p.foto, 700) + '"></div>' +
          '<p class="tipo"><b>' + p.tipo + '</b><span>' + (p.op === "venta" ? "En venta" : "En alquiler") + '</span></p>' +
          (d.calle ? '<h3 class="angosta">' + (/^\d/.test(d.calle) ? "Calle " : "") + d.calle + '</h3>' : "") +
          '<span class="resto">' + d.resto + '</span>' +
        '</a>';
      contFichas.appendChild(li);
    });
  }

  // ---------- Consulta por correo ----------
  const form = document.querySelector("[data-consulta]");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    const estado = form.querySelector(".estado");
    const nombre = form.nombre.value.trim(), tel = form.telefono.value.trim();
    if (!nombre || !tel) { estado.textContent = "Completá tu nombre y un teléfono para que te podamos llamar."; return; }
    const cuerpo = "Nombre: " + nombre + "\nTeléfono: " + tel + "\n\n" + form.mensaje.value.trim();
    location.href = "mailto:inmobiliariabellezze@gmail.com?subject=" + encodeURIComponent("Consulta por salón calle 26 n.º 771 (ficha 1419)") + "&body=" + encodeURIComponent(cuerpo);
    estado.textContent = "Se abrió tu correo con la consulta lista para enviar.";
  });

  // ---------- Video ----------
  const video = document.querySelector(".recorrido video");
  video.src = chico ? video.dataset.srcChico : video.dataset.srcGrande;

  if (quieto) { // sin animaciones: video normal con controles
    video.controls = true;
    video.preload = "metadata";
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Scroll suave (no con movimiento reducido)
  const lenis = (!reducido && window.Lenis) ? new Lenis({ lerp: 0.09 }) : { start() {}, stop() {}, on() {} };
  if (lenis.raf) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Partir el título en letras
  const titulo = document.querySelector("[data-letras]");
  titulo.setAttribute("aria-label", titulo.textContent);
  titulo.innerHTML = titulo.textContent.split("").map(c =>
    c === " " ? " " : '<span class="letra" aria-hidden="true">' + c + "</span>").join("");

  // ---------- Pantalla de carga (el único momento automático) ----------
  if (reducido) {
    document.querySelector(".carga").remove();
  } else {
  lenis.stop();
  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .from(".carga .marca span", { yPercent: 60, opacity: 0, duration: .7 })
    .from(".carga .linea-a", { scaleX: 0, duration: .6 }, "-=.35")
    .from(".carga .linea-r", { scaleX: 0, duration: .6 }, "-=.45")
    .from(".carga small", { opacity: 0, duration: .4 }, "-=.3")
    .to(".carga", { yPercent: -100, duration: .9, ease: "power4.inOut" }, "+=.35")
    .from(".titulo-escena .letra", { yPercent: 110, opacity: 0, stagger: .03, duration: .8 }, "-=.45")
    .from(".titulo-escena p, .titulo-escena .entre, .aviso-scroll", { y: 20, opacity: 0, stagger: .08, duration: .6 }, "-=.6")
    .add(() => { lenis.start(); document.querySelector(".carga").remove(); });
  }

  // ---------- Bajar = caminar ----------
  let objetivo = 0, actual = 0, duracion = 0, pasoActivo = -1;
  const nombre = document.querySelector("[data-nombre]");
  const detalle = document.querySelector("[data-detalle]");
  const puntos = [...document.querySelectorAll(".plano li")];

  function marcarPaso(t) {
    let i = 0;
    AMBIENTES.forEach((a, n) => { if (t >= a.desde) i = n; });
    if (i === pasoActivo) return;
    pasoActivo = i;
    puntos.forEach((p, n) => p.classList.toggle("activo", n === i));
    if (reducido) { nombre.textContent = AMBIENTES[i].nombre; detalle.textContent = AMBIENTES[i].detalle; return; }
    gsap.timeline()
      .to([nombre, detalle], { y: -14, opacity: 0, duration: .18, ease: "power2.in" })
      .add(() => { nombre.textContent = AMBIENTES[i].nombre; detalle.textContent = AMBIENTES[i].detalle; })
      .fromTo([nombre, detalle], { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .35, stagger: .05, ease: "power3.out" });
  }

  function avanzarVideo() {
    if (duracion) {
      actual += (objetivo - actual) * 0.18;
      if (Math.abs(objetivo - actual) > 0.004) {
        video.currentTime = actual;
      }
    }
    requestAnimationFrame(avanzarVideo);
  }

  video.addEventListener("loadedmetadata", () => {
    duracion = video.duration - 0.05;
    video.pause();
    requestAnimationFrame(avanzarVideo);
  });

  ScrollTrigger.create({
    trigger: ".recorrido",
    start: "top top",
    end: "bottom bottom",
    onUpdate: s => {
      objetivo = s.progress * duracion;
      marcarPaso(objetivo);
      gsap.set(".avance i", { scaleX: s.progress });
    }
  });

  // El título se va y aparecen el ambiente y el plano
  gsap.timeline({ scrollTrigger: { trigger: ".recorrido", start: "top top", end: "8% top", scrub: true } })
    .fromTo(".titulo-escena .letra", { yPercent: 0, opacity: 1 }, { yPercent: -120, opacity: 0, stagger: .015, ease: "none", immediateRender: false }, 0)
    .fromTo(".titulo-escena p, .titulo-escena .entre", { y: 0, opacity: 1 }, { y: -40, opacity: 0, ease: "none", immediateRender: false }, 0)
    .to(".aviso-scroll", { opacity: 0, ease: "none" }, 0)
    .to(".ambiente, .plano", { opacity: 1, ease: "none" }, .5);

  // ---------- Texto que se enciende palabra por palabra ----------
  const parrafo = document.querySelector("[data-palabras]");
  parrafo.innerHTML = parrafo.textContent.split(" ").map(p => '<span class="palabra">' + p + "</span>").join(" ");
  gsap.to(".manifiesto .palabra", {
    opacity: 1, stagger: .1, ease: "none",
    scrollTrigger: { trigger: ".manifiesto", start: "top 70%", end: "bottom 60%", scrub: true }
  });

  // ---------- Números que cuentan ----------
  document.querySelectorAll("[data-cuenta]").forEach(el => {
    const fin = parseFloat(el.dataset.cuenta), dec = +el.dataset.decimales;
    const obj = { v: 0 };
    el.textContent = formato(0, dec);
    gsap.to(obj, {
      v: fin, duration: 1.6, ease: "power2.out",
      scrollTrigger: { trigger: ".datos", start: "top 75%", once: true },
      onUpdate: () => { el.textContent = formato(obj.v, dec); }
    });
  });

  // ---------- Galería horizontal (solo pantallas grandes) ----------
  const mm = gsap.matchMedia();
  mm.add("(min-width: 761px)", () => {
    const cinta = document.querySelector(".galeria .cinta");
    const mover = gsap.to(cinta, {
      x: () => -(cinta.scrollWidth - innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: ".galeria", start: "top top", end: () => "+=" + (cinta.scrollWidth - innerWidth),
        pin: true, scrub: true, invalidateOnRefresh: true
      }
    });
    gsap.utils.toArray(".galeria .marco img").forEach(img => {
      gsap.fromTo(img, { xPercent: -15 }, {
        xPercent: 0, ease: "none",
        scrollTrigger: { trigger: img.parentElement, containerAnimation: mover, start: "left right", end: "right left", scrub: true }
      });
    });
    gsap.utils.toArray(".galeria figure").forEach(f => {
      gsap.from(f.querySelector(".marco"), {
        clipPath: "inset(0 0 0 100%)", ease: "power2.out",
        scrollTrigger: { trigger: f, containerAnimation: mover, start: "left 95%", end: "left 55%", scrub: true }
      });
    });
  });
  mm.add("(max-width: 760px)", () => {
    gsap.utils.toArray(".galeria figure .marco").forEach(m => {
      gsap.from(m, { clipPath: "inset(100% 0 0 0)", duration: 1, ease: "power3.out", scrollTrigger: { trigger: m, start: "top 85%" } });
    });
  });

  // ---------- Cabecera y barra del celular ----------
  ScrollTrigger.create({
    trigger: ".manifiesto", start: "bottom top", end: "max",
    onToggle: s => document.querySelector(".cabecera").classList.toggle("sobre-claro", s.isActive)
  });
  ScrollTrigger.create({
    trigger: ".manifiesto", start: "top bottom", end: "max",
    onToggle: s => document.querySelector(".barra-movil").classList.toggle("visible", s.isActive)
  });

  if (reducido) return; // lo que sigue es decorativo y automático

  // ---------- Fichas que se destapan ----------
  ScrollTrigger.batch(".ficha", {
    start: "top 88%",
    onEnter: lote => gsap.fromTo(lote.map(l => l.querySelector(".marco")),
      { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.1, stagger: .12, ease: "power3.out" }),
    once: true
  });

  // ---------- Texto gigante que se desliza ----------
  gsap.fromTo(".visita .gigante", { xPercent: 0 }, {
    xPercent: -38, ease: "none",
    scrollTrigger: { trigger: ".visita", start: "top bottom", end: "bottom top", scrub: true }
  });

  // ---------- Botón imán ----------
  const iman = document.querySelector("[data-iman]");
  if (iman && matchMedia("(hover: hover)").matches) {
    const mx = gsap.quickTo(iman, "x", { duration: .5, ease: "power3.out" });
    const my = gsap.quickTo(iman, "y", { duration: .5, ease: "power3.out" });
    iman.addEventListener("mousemove", e => {
      const r = iman.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * .35);
      my((e.clientY - r.top - r.height / 2) * .35);
    });
    iman.addEventListener("mouseleave", () => { mx(0); my(0); });
  }
})();
