/* =========================================================
   AUTORENTCAR - FUNCIONES GENERALES DEL SITIO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    configurarMenuMovil();
    configurarModoOscuro();
    configurarPreguntasFrecuentes();
    configurarModal();
    configurarFormularioBusqueda();
    configurarFechas();
    configurarEnlacesInternos();
    colocarAnioActual();
    cargarPreferenciaVisual();
    configurarFormularioContacto();
});

/* =========================================================
   MENÚ RESPONSIVE PARA CELULARES
========================================================= */

function configurarMenuMovil() {
    const botonMenu = document.getElementById("boton-menu");
    const menuPrincipal = document.getElementById("menu-principal");

    if (!botonMenu || !menuPrincipal) {
        return;
    }

    botonMenu.addEventListener("click", () => {
        menuPrincipal.classList.toggle("activo");

        const icono = botonMenu.querySelector("i");

        if (menuPrincipal.classList.contains("activo")) {
            icono.classList.remove("fa-bars");
            icono.classList.add("fa-xmark");
            botonMenu.setAttribute("aria-label", "Cerrar menú");
        } else {
            icono.classList.remove("fa-xmark");
            icono.classList.add("fa-bars");
            botonMenu.setAttribute("aria-label", "Abrir menú");
        }
    });

    const enlacesMenu = menuPrincipal.querySelectorAll("a");

    enlacesMenu.forEach((enlace) => {
        enlace.addEventListener("click", () => {
            menuPrincipal.classList.remove("activo");

            const icono = botonMenu.querySelector("i");

            icono.classList.remove("fa-xmark");
            icono.classList.add("fa-bars");
        });
    });

    document.addEventListener("click", (evento) => {
        const clicDentroMenu = menuPrincipal.contains(evento.target);
        const clicEnBoton = botonMenu.contains(evento.target);

        if (!clicDentroMenu && !clicEnBoton) {
            menuPrincipal.classList.remove("activo");

            const icono = botonMenu.querySelector("i");

            icono.classList.remove("fa-xmark");
            icono.classList.add("fa-bars");
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 920) {
            menuPrincipal.classList.remove("activo");

            const icono = botonMenu.querySelector("i");

            icono.classList.remove("fa-xmark");
            icono.classList.add("fa-bars");
        }
    });
}

/* =========================================================
   MODO CLARO Y MODO OSCURO
========================================================= */

function configurarModoOscuro() {
    const botonModo = document.getElementById("boton-modo");

    if (!botonModo) {
        return;
    }

    botonModo.addEventListener("click", () => {
        document.body.classList.toggle("modo-oscuro");

        const modoOscuroActivo =
            document.body.classList.contains("modo-oscuro");

        localStorage.setItem(
            "autorentcarModoOscuro",
            modoOscuroActivo
        );

        actualizarIconoModo();
    });
}

function cargarPreferenciaVisual() {
    const preferenciaGuardada = localStorage.getItem(
        "autorentcarModoOscuro"
    );

    if (preferenciaGuardada === "true") {
        document.body.classList.add("modo-oscuro");
    }

    actualizarIconoModo();
}

function actualizarIconoModo() {
    const botonModo = document.getElementById("boton-modo");

    if (!botonModo) {
        return;
    }

    const icono = botonModo.querySelector("i");
    const modoOscuroActivo =
        document.body.classList.contains("modo-oscuro");

    if (modoOscuroActivo) {
        icono.classList.remove("fa-moon");
        icono.classList.add("fa-sun");
        botonModo.setAttribute("aria-label", "Activar modo claro");
        botonModo.setAttribute("title", "Activar modo claro");
    } else {
        icono.classList.remove("fa-sun");
        icono.classList.add("fa-moon");
        botonModo.setAttribute("aria-label", "Activar modo oscuro");
        botonModo.setAttribute("title", "Activar modo oscuro");
    }
}

/* =========================================================
   PREGUNTAS FRECUENTES
========================================================= */

function configurarPreguntasFrecuentes() {
    const preguntas = document.querySelectorAll(".pregunta");

    if (!preguntas.length) {
        return;
    }

    preguntas.forEach((pregunta) => {
        const boton = pregunta.querySelector(".pregunta-boton");

        if (!boton) {
            return;
        }

        boton.addEventListener("click", () => {
            const estabaActiva = pregunta.classList.contains("activa");

            preguntas.forEach((otraPregunta) => {
                otraPregunta.classList.remove("activa");
            });

            if (!estabaActiva) {
                pregunta.classList.add("activa");
            }
        });
    });
}

/* =========================================================
   CONFIGURACIÓN DEL MODAL
========================================================= */

function configurarModal() {
    const modal = document.getElementById("modal-vehiculo");
    const botonCerrar = document.getElementById("cerrar-modal");

    if (!modal || !botonCerrar) {
        return;
    }

    botonCerrar.addEventListener("click", () => {
        cerrarModalVehiculo();
    });

    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) {
            cerrarModalVehiculo();
        }
    });

    document.addEventListener("keydown", (evento) => {
        if (
            evento.key === "Escape" &&
            modal.classList.contains("activo")
        ) {
            cerrarModalVehiculo();
        }
    });
}

/* =========================================================
   CONFIGURAR LAS FECHAS
========================================================= */

function configurarFechas() {
    const fechaRecogida = document.getElementById("fecha-recogida");
    const fechaEntrega = document.getElementById("fecha-entrega");

    if (!fechaRecogida || !fechaEntrega) {
        return;
    }

    const hoy = obtenerFechaLocal();
    const manana = sumarDiasAFecha(hoy, 1);

    fechaRecogida.min = hoy;
    fechaEntrega.min = manana;

    if (!fechaRecogida.value) {
        fechaRecogida.value = hoy;
    }

    if (!fechaEntrega.value) {
        fechaEntrega.value = manana;
    }

    fechaRecogida.addEventListener("change", () => {
        if (!fechaRecogida.value) {
            return;
        }

        const fechaMinimaEntrega = sumarDiasAFecha(
            fechaRecogida.value,
            1
        );

        fechaEntrega.min = fechaMinimaEntrega;

        if (
            !fechaEntrega.value ||
            fechaEntrega.value <= fechaRecogida.value
        ) {
            fechaEntrega.value = fechaMinimaEntrega;
        }
    });
}

function obtenerFechaLocal() {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function sumarDiasAFecha(fechaTexto, cantidadDias) {
    const partes = fechaTexto.split("-");

    const fecha = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );

    fecha.setDate(fecha.getDate() + cantidadDias);

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

/* =========================================================
   FORMULARIO DE BÚSQUEDA
========================================================= */

function configurarFormularioBusqueda() {
    const formulario = document.getElementById(
        "formulario-busqueda"
    );

    if (!formulario) {
        return;
    }

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const lugar = document.getElementById(
            "lugar-recogida"
        ).value;

        const fechaRecogida = document.getElementById(
            "fecha-recogida"
        ).value;

        const fechaEntrega = document.getElementById(
            "fecha-entrega"
        ).value;

        const categoria = document.getElementById(
            "categoria-busqueda"
        ).value;

        if (!lugar || !fechaRecogida || !fechaEntrega) {
            mostrarNotificacion(
                "Datos incompletos",
                "Selecciona la ubicación y las fechas de tu reservación."
            );

            return;
        }

        if (fechaEntrega <= fechaRecogida) {
            mostrarNotificacion(
                "Fechas incorrectas",
                "La fecha de entrega debe ser posterior a la fecha de recogida."
            );

            return;
        }

        const cantidadDias = calcularDiasAlquiler(
            fechaRecogida,
            fechaEntrega
        );

        const busqueda = {
            lugar,
            fechaRecogida,
            fechaEntrega,
            categoria,
            cantidadDias
        };

        localStorage.setItem(
            "autorentcarBusqueda",
            JSON.stringify(busqueda)
        );

        const categoriaTexto =
            categoria === "todos"
                ? "todas las categorías"
                : obtenerNombreCategoria(categoria);

        mostrarNotificacion(
            "Búsqueda preparada",
            `Buscando vehículos en ${lugar} durante ${cantidadDias} día(s), en ${categoriaTexto}.`
        );

        setTimeout(() => {
            window.location.href =
                `vehiculos.html?categoria=${encodeURIComponent(
                    categoria
                )}&lugar=${encodeURIComponent(
                    lugar
                )}&recogida=${encodeURIComponent(
                    fechaRecogida
                )}&entrega=${encodeURIComponent(fechaEntrega)}`;
        }, 900);
    });
}

function calcularDiasAlquiler(fechaInicial, fechaFinal) {
    const inicio = new Date(`${fechaInicial}T00:00:00`);
    const final = new Date(`${fechaFinal}T00:00:00`);

    const diferenciaMilisegundos = final - inicio;

    return Math.ceil(
        diferenciaMilisegundos / (1000 * 60 * 60 * 24)
    );
}

function obtenerNombreCategoria(categoria) {
    const categorias = {
        economico: "vehículos económicos",
        sedan: "sedanes",
        suv: "SUV",
        lujo: "vehículos de lujo"
    };

    return categorias[categoria] || "todos los vehículos";
}

/* =========================================================
   DESPLAZAMIENTO SUAVE
========================================================= */

function configurarEnlacesInternos() {
    const enlacesInternos = document.querySelectorAll(
        'a[href^="#"]'
    );

    enlacesInternos.forEach((enlace) => {
        enlace.addEventListener("click", (evento) => {
            const destinoTexto = enlace.getAttribute("href");

            if (!destinoTexto || destinoTexto === "#") {
                evento.preventDefault();
                return;
            }

            const destino = document.querySelector(destinoTexto);

            if (!destino) {
                return;
            }

            evento.preventDefault();

            destino.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

/* =========================================================
   AÑO AUTOMÁTICO EN EL PIE DE PÁGINA
========================================================= */

function colocarAnioActual() {
    const elementoAnio = document.getElementById("anio-actual");

    if (!elementoAnio) {
        return;
    }

    elementoAnio.textContent = new Date().getFullYear();
}

/* =========================================================
   EFECTO DEL MENÚ AL DESPLAZARSE
========================================================= */

window.addEventListener("scroll", () => {
    const navegacion = document.querySelector(".navegacion");

    if (!navegacion) {
        return;
    }

    if (window.scrollY > 40) {
        navegacion.classList.add("navegacion-desplazada");
    } else {
        navegacion.classList.remove("navegacion-desplazada");
    }
});
/* =========================================================
   FORMULARIO DE CONTACTO
========================================================= */

function configurarFormularioContacto() {
    const formulario = document.getElementById(
        "formulario-contacto"
    );

    if (!formulario) {
        return;
    }

    const nombre = document.getElementById("nombre-contacto");
    const telefono = document.getElementById("telefono-contacto");
    const correo = document.getElementById("correo-contacto");
    const asunto = document.getElementById("asunto-contacto");
    const mensaje = document.getElementById("mensaje-contacto");
    const aceptarTerminos = document.getElementById(
        "aceptar-terminos"
    );

    const contador = document.getElementById(
        "contador-caracteres"
    );

    if (mensaje && contador) {
        mensaje.maxLength = 500;

        mensaje.addEventListener("input", () => {
            contador.textContent =
                `${mensaje.value.length} / 500`;
        });
    }

    const campos = [
        nombre,
        telefono,
        correo,
        asunto,
        mensaje
    ];

    campos.forEach((campo) => {
        if (!campo) {
            return;
        }

        campo.addEventListener("blur", () => {
            validarCampoContacto(campo);
        });

        campo.addEventListener("input", () => {
            const contenedor = campo.closest(".campo-contacto");

            if (
                contenedor &&
                contenedor.classList.contains("error")
            ) {
                validarCampoContacto(campo);
            }
        });
    });

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const camposValidos = campos
            .map(validarCampoContacto)
            .every(Boolean);

        if (!aceptarTerminos.checked) {
            mostrarNotificacion(
                "Aceptación necesaria",
                "Debes aceptar el uso de tus datos para enviar el mensaje."
            );

            return;
        }

        if (!camposValidos) {
            mostrarNotificacion(
                "Revisa el formulario",
                "Completa correctamente los campos señalados."
            );

            return;
        }

        const solicitud = {
            nombre: nombre.value.trim(),
            telefono: telefono.value.trim(),
            correo: correo.value.trim(),
            asunto: asunto.value,
            mensaje: mensaje.value.trim(),
            fecha: new Date().toISOString()
        };

        const solicitudesGuardadas = JSON.parse(
            localStorage.getItem("autorentcarContactos")
        ) || [];

        solicitudesGuardadas.push(solicitud);

        localStorage.setItem(
            "autorentcarContactos",
            JSON.stringify(solicitudesGuardadas)
        );

        mostrarNotificacion(
            "Mensaje enviado",
            "Recibimos tu solicitud. Nuestro equipo se comunicará contigo."
        );

        formulario.reset();

        campos.forEach((campo) => {
            const contenedor = campo.closest(".campo-contacto");

            if (contenedor) {
                contenedor.classList.remove(
                    "correcto",
                    "error"
                );
            }
        });

        if (contador) {
            contador.textContent = "0 / 500";
        }
    });
}

function validarCampoContacto(campo) {
    const valor = campo.value.trim();

    let mensajeError = "";

    if (!valor) {
        mensajeError = "Este campo es obligatorio.";
    } else if (
        campo.id === "nombre-contacto" &&
        valor.length < 3
    ) {
        mensajeError = "Escribe un nombre válido.";
    } else if (
        campo.id === "telefono-contacto" &&
        !/^[0-9+\-()\s]{8,20}$/.test(valor)
    ) {
        mensajeError = "Escribe un teléfono válido.";
    } else if (
        campo.id === "correo-contacto" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
    ) {
        mensajeError = "Escribe un correo válido.";
    } else if (
        campo.id === "mensaje-contacto" &&
        valor.length < 10
    ) {
        mensajeError =
            "El mensaje debe tener al menos 10 caracteres.";
    }

    const contenedor = campo.closest(".campo-contacto");
    const error = contenedor?.querySelector(".mensaje-error");

    if (!contenedor) {
        return false;
    }

    if (mensajeError) {
        contenedor.classList.add("error");
        contenedor.classList.remove("correcto");

        if (error) {
            error.textContent = mensajeError;
        }

        return false;
    }

    contenedor.classList.remove("error");
    contenedor.classList.add("correcto");

    if (error) {
        error.textContent = "";
    }

    return true;
}