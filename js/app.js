// Propuesta Bellezze - comportamiento de las páginas (sin librerías).

// Separa una dirección de Pico en "calle" grande y el resto chico.
// "26 e/15 y 17 Nro. 771" -> { calle: "26", resto: "entre 15 y 17, n.º 771" }
function partirDireccion(dir) {
  const limpio = dir.replace(/\s+/g, " ").trim();
  const m = limpio.match(/^(.*?)(\s+e\/|\s+esq\.|\s+Nro\.?:?|,)\s*(.*)$/i);
  let calle = m ? m[1] : limpio;
  let resto = m ? (m[2].trim() + " " + m[3]) : "";
  if (calle.length > 14) { // nombres largos: no entran como cartel
    resto = limpio; calle = "";
  }
  resto = resto
    .replace(/^e\/\s*/i, "entre ")
    .replace(/\s*e\/\s*/gi, " entre ")
    .replace(/^esq\.\s*/i, "esquina ")
    .replace(/Nro\.?:?\s*/gi, "n.º ")
    .replace(/^,\s*/, "")
    .trim();
  return { calle, resto };
}

function urlFoto(nombre, ancho) {
  return "https://inmobellezze.com.ar/propiedades/image.php/" + nombre +
    "?width=" + ancho + "&image=/propiedades/admin/fotos/" + nombre;
}

// ---------- Fichas de destacadas ----------
function pintarFichas(lista, cont) {
  cont.innerHTML = "";
  if (!lista.length) {
    cont.innerHTML = '<li><p>No hay propiedades con ese filtro. Probá con otra operación o llamanos al 02302-337430.</p></li>';
    return;
  }
  for (const p of lista) {
    const d = partirDireccion(p.dir);
    const enlace = p.id === "1419" ? "propiedad.html" :
      "https://inmobellezze.com.ar/index.php?page=propiedad&id_prop=" + p.id;
    const li = document.createElement("li");
    li.className = "ficha";
    li.innerHTML =
      '<a href="' + enlace + '">' +
        '<figure' + (p.video ? ' class="con-video"' : '') + '>' +
          (p.video
            ? '<video src="' + p.video + '" poster="media/recorrido-poster.jpg" muted loop playsinline preload="none" aria-hidden="true"></video><span class="sello">Recorrido en video</span>'
            : '<img loading="lazy" alt="' + p.tipo + " en " + p.dir + '" src="' + urlFoto(p.foto, 600) + '">') +
        '</figure>' +
        '<p class="tipo"><b>' + p.tipo + '</b><span>' + (p.op === "venta" ? "En venta" : "En alquiler") + '</span></p>' +
        (d.calle ? '<h3 class="calle">' + (/^\d/.test(d.calle) ? "Calle " : "") + d.calle + '</h3>' : "") +
        '<span class="entre resto">' + d.resto + '</span>' +
      '</a>';
    cont.appendChild(li);
    // La ficha con video se reproduce al pasar el mouse o al enfocarla
    const v = li.querySelector("video");
    if (v) {
      const a = li.querySelector("a");
      const on = () => v.play().catch(() => {});
      const off = () => { v.pause(); };
      a.addEventListener("mouseenter", on);
      a.addEventListener("focus", on);
      a.addEventListener("mouseleave", off);
      a.addEventListener("blur", off);
    }
  }
}

function iniciarDestacadas() {
  const cont = document.querySelector("[data-fichas]");
  if (!cont || !window.DESTACADAS) return;
  const destacada = { id: "1419", tipo: "Salón", op: "alquiler", dir: "26 e/15 y 17 Nro. 771", foto: "1768507859_0000.jpg", video: "media/recorrido-26-771.mp4" };
  const todas = [destacada].concat(window.DESTACADAS);
  let filtroOp = "todas";
  const filtroTipo = () => {
    const s = document.querySelector("#busca-tipo");
    return s ? s.value : "";
  };
  const aplicar = () => {
    const lista = todas.filter(p =>
      (filtroOp === "todas" || p.op === filtroOp) &&
      (!filtroTipo() || p.tipo === filtroTipo()));
    pintarFichas(lista, cont);
  };
  document.querySelectorAll("[data-op]").forEach(b => {
    b.addEventListener("click", () => {
      filtroOp = b.dataset.op;
      document.querySelectorAll("[data-op]").forEach(x => x.setAttribute("aria-pressed", x === b));
      aplicar();
    });
  });
  const form = document.querySelector("[data-buscador]");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const op = form.querySelector("#busca-op").value;
      filtroOp = op || "todas";
      document.querySelectorAll("[data-op]").forEach(x => x.setAttribute("aria-pressed", x.dataset.op === filtroOp));
      aplicar();
      document.querySelector("#propiedades").scrollIntoView();
    });
  }
  aplicar();
}

// ---------- Reproductor del recorrido ----------
function iniciarReproductor() {
  const caja = document.querySelector("[data-reproductor]");
  if (!caja) return;
  const video = caja.querySelector("video");
  const play = caja.querySelector(".play");
  const barra = caja.querySelector(".progreso i");
  play.addEventListener("click", () => {
    video.controls = true;
    video.play();
    play.hidden = true;
  });
  video.addEventListener("timeupdate", () => {
    if (video.duration) barra.style.width = (video.currentTime / video.duration * 100) + "%";
  });
  video.addEventListener("ended", () => { play.hidden = false; video.controls = false; });
}

// ---------- Galería con visor ----------
function iniciarGaleria() {
  const gal = document.querySelector("[data-galeria]");
  const visor = document.querySelector("#visor");
  if (!gal || !visor || typeof visor.showModal !== "function") return;
  const botones = [...gal.querySelectorAll("button")];
  const img = visor.querySelector("img");
  const cuenta = visor.querySelector(".cuenta");
  let i = 0;
  const mostrar = n => {
    i = (n + botones.length) % botones.length;
    const fuente = botones[i].querySelector("img");
    img.src = fuente.dataset.grande || fuente.src;
    img.alt = fuente.alt;
    cuenta.textContent = "Foto " + (i + 1) + " de " + botones.length;
  };
  botones.forEach((b, n) => b.addEventListener("click", () => { mostrar(n); visor.showModal(); }));
  visor.querySelector(".cerrar").addEventListener("click", () => visor.close());
  visor.querySelector(".ant").addEventListener("click", () => mostrar(i - 1));
  visor.querySelector(".sig").addEventListener("click", () => mostrar(i + 1));
  visor.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") mostrar(i - 1);
    if (e.key === "ArrowRight") mostrar(i + 1);
  });
  visor.addEventListener("click", e => { if (e.target === visor || e.target.tagName === "FIGURE") visor.close(); });
}

// ---------- Consulta por mail ----------
function iniciarConsulta() {
  const form = document.querySelector("[data-consulta]");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const estado = form.querySelector(".estado");
    const nombre = form.nombre.value.trim();
    const tel = form.telefono.value.trim();
    if (!nombre || !tel) {
      estado.textContent = "Completá tu nombre y un teléfono para que te podamos llamar.";
      return;
    }
    const asunto = "Consulta por " + form.dataset.propiedad;
    const cuerpo = "Nombre: " + nombre + "\nTeléfono: " + tel + "\n\n" + form.mensaje.value.trim();
    window.location.href = "mailto:inmobiliariabellezze@gmail.com?subject=" +
      encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
    estado.textContent = "Se abrió tu correo con la consulta lista para enviar.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarDestacadas();
  iniciarReproductor();
  iniciarGaleria();
  iniciarConsulta();
});
