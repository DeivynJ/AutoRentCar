/* =========================================================
   LISTA DE VEHÍCULOS DE AUTORENTCAR
========================================================= */

const vehiculos = [
    {
        id: 1,
        nombre: "Toyota Corolla",
        marca: "Toyota",
        categoria: "Económico",
        categoriaTexto: "Económico",
        precio: 45,
        transmision: "Automática",
        combustible: "Gasolina",
        pasajeros: 5,
        puertas: 4,
        equipaje: 2,
        aire: true,
        destacado: true,
        etiqueta: "Más reservado",
        descripcion:
            "Un sedán cómodo, seguro y económico, ideal para recorridos urbanos, viajes de trabajo y desplazamientos familiares.",
        imagen:
            "img/autos/Toyota-Corolla.jpg"
    },

    {
        id: 2,
        nombre: "Hyundai Tucson",
        marca: "Hyundai",
        categoria: "Gama media",
        categoriaTexto: "Gama media",
        precio: 68,
        transmision: "Automática",
        combustible: "Gasolina",
        pasajeros: 5,
        puertas: 4,
        equipaje: 4,
        aire: true,
        destacado: true,
        etiqueta: "Recomendado",
        descripcion:
            "SUV moderna con excelente espacio interior, gran comodidad y buen rendimiento para viajes familiares o recorridos largos.",
        imagen:
            "img/autos/Tuscon.jpg"
    },

    {
        id: 3,
        nombre: "Kia GT",
        marca: "Kia",
        categoria: "Económico",
        categoriaTexto: "Económico",
        precio: 35,
        transmision: "Automática",
        combustible: "Gasolina",
        pasajeros: 4,
        puertas: 4,
        equipaje: 1,
        aire: true,
        destacado: true,
        etiqueta: "Mejor precio",
        descripcion:
            "Vehículo compacto, eficiente y fácil de conducir, perfecto para moverse por la ciudad y reducir el consumo de combustible.",
        imagen:
            "img/autos/Kia-k5-GT.jpg"
    },

    {
        id: 4,
        nombre: "Honda CR-V",
        marca: "Honda",
        categoria: "Gama media",
        categoriaTexto: "Gama media",
        precio: 75,
        transmision: "Automática",
        combustible: "Gasolina",
        pasajeros: 5,
        puertas: 4,
        equipaje: 4,
        aire: true,
        destacado: false,
        etiqueta: "Familiar",
        descripcion:
            "SUV espaciosa y confiable, diseñada para brindar comodidad, estabilidad y seguridad durante recorridos largos.",
        imagen:
            "img/autos/Honda-CRV.jpg"
    },

    {
        id: 5,
        nombre: "Mercedes-Benz",
        marca: "Mercedes-Benz",
        categoria: "Vehículo de lujo",
        categoriaTexto: "Lujo",
        precio: 125,
        transmision: "Automática",
        combustible: "Gasolina",
        pasajeros: 5,
        puertas: 4,
        equipaje: 3,
        aire: true,
        destacado: false,
        etiqueta: "Premium",
        descripcion:
            "Vehículo elegante y sofisticado con interior de alta calidad, tecnología moderna y una experiencia de conducción superior.",
        imagen:
            "img/autos/Mercedes-Benz.jpg"
    },

    {
        id: 6,
        nombre: "Hyudai Sonata",
        marca: "Hyudai",
        categoria: "Económico",
        categoriaTexto: "Económico",
        precio: 42,
        transmision: "Automática",
        combustible: "Gasolina",
        pasajeros: 5,
        puertas: 4,
        equipaje: 3,
        aire: true,
        destacado: false,
        etiqueta: "Eficiente",
        descripcion:
            "Sedán práctico con excelente rendimiento de combustible, amplio espacio interior y conducción cómoda.",
        imagen:
            "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id: 7,
        nombre: "Mercedes Benz",
        marca: "AMG",
        categoria: "Vehículo de lujo",
        categoriaTexto: "Lujo",
        precio: 32,
        transmision: "Automática",
        combustible: "Gasolina",
        pasajeros: 4,
        puertas: 4,
        equipaje: 1,
        aire: true,
        destacado: false,
        etiqueta: "Gama media",
        descripcion:
            "Automóvil compacto y ligero, adecuado para recorridos cortos, calles urbanas y estacionamientos pequeños.",
        imagen:
            "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id: 8,
        nombre: "BMW X5",
        marca: "BMW",
        categoria: "Vehículo de lujo",
        categoriaTexto: "Lujo",
        precio: 155,
        transmision: "Automática",
        combustible: "Gasolina",
        pasajeros: 5,
        puertas: 4,
        equipaje: 5,
        aire: true,
        destacado: false,
        etiqueta: "Exclusivo",
        descripcion:
            "SUV premium con diseño deportivo, gran potencia, tecnología avanzada y un interior espacioso y elegante.",
        imagen:
            "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id: 9,
        nombre: "Ford",
        marca: "Ford",
        categoria: "Gama media",
        categoriaTexto: "Gama media",
        precio: 110,
        transmision: "Automática",
        combustible: "Gasolina",
        pasajeros: 5,
        puertas: 4,
        equipaje: 3,
        aire: true,
        destacado: false,
        etiqueta: "Aventura",
        descripcion:
            "Vehículo resistente y versátil, ideal para aventuras, excursiones y trayectos que requieren mayor capacidad.",
        imagen:
            "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
    }
];

/* =========================================================
   FAVORITOS GUARDADOS EN EL NAVEGADOR
========================================================= */

let favoritos = JSON.parse(
    localStorage.getItem("autorentcarFavoritos")
) || [];

/* =========================================================
   CREAR UNA TARJETA DE VEHÍCULO
========================================================= */

function crearTarjetaVehiculo(vehiculo) {
    const esFavorito = favoritos.includes(vehiculo.id);

    return `
        <article class="tarjeta-vehiculo">

            <div class="vehiculo-imagen-contenedor">

                <img
                    src="${vehiculo.imagen}"
                    alt="${vehiculo.nombre}"
                    class="vehiculo-imagen"
                    loading="lazy"
                >

                <span class="vehiculo-etiqueta">
                    ${vehiculo.etiqueta}
                </span>

                <button
                    class="vehiculo-favorito ${esFavorito ? "activo" : ""}"
                    type="button"
                    onclick="alternarFavorito(${vehiculo.id}, this)"
                    aria-label="Agregar ${vehiculo.nombre} a favoritos"
                >
                    <i class="${
                        esFavorito
                            ? "fa-solid"
                            : "fa-regular"
                    } fa-heart"></i>
                </button>

            </div>

            <div class="vehiculo-contenido">

                <div class="vehiculo-superior">

                    <div>
                        <h3>${vehiculo.nombre}</h3>
                        <span>${vehiculo.categoriaTexto}</span>
                    </div>

                    <div class="vehiculo-precio">
                        <strong>US$${vehiculo.precio}</strong>
                        <span>por día</span>
                    </div>

                </div>

                <div class="vehiculo-caracteristicas">

                    <span>
                        <i class="fa-solid fa-user-group"></i>
                        ${vehiculo.pasajeros} pasajeros
                    </span>

                    <span>
                        <i class="fa-solid fa-gears"></i>
                        ${vehiculo.transmision}
                    </span>

                    <span>
                        <i class="fa-solid fa-gas-pump"></i>
                        ${vehiculo.combustible}
                    </span>

                </div>

                <div class="vehiculo-acciones">

                    <button
                        class="boton-detalles"
                        type="button"
                        onclick="mostrarDetallesVehiculo(${vehiculo.id})"
                    >
                        Ver detalles
                    </button>

                    <button
                        class="boton-reservar-vehiculo"
                        type="button"
                        onclick="seleccionarVehiculo(${vehiculo.id})"
                    >
                        Reservar
                    </button>

                </div>

            </div>

        </article>
    `;
}

/* =========================================================
   MOSTRAR VEHÍCULOS DESTACADOS
========================================================= */

function mostrarVehiculosDestacados() {
    const contenedor = document.getElementById(
        "contenedor-vehiculos-destacados"
    );

    if (!contenedor) {
        return;
    }

    const destacados = vehiculos.filter(
        (vehiculo) => vehiculo.destacado
    );

    contenedor.innerHTML = destacados
        .map(crearTarjetaVehiculo)
        .join("");
}

/* =========================================================
   MOSTRAR DETALLES EN LA VENTANA MODAL
========================================================= */

function mostrarDetallesVehiculo(id) {
    const vehiculo = vehiculos.find(
        (elemento) => elemento.id === id
    );

    const modal = document.getElementById("modal-vehiculo");
    const contenidoModal = document.getElementById(
        "contenido-modal"
    );

    if (!vehiculo || !modal || !contenidoModal) {
        return;
    }

    contenidoModal.innerHTML = `
        <img
            src="${vehiculo.imagen}"
            alt="${vehiculo.nombre}"
            class="modal-vehiculo-imagen"
        >

        <div class="modal-vehiculo-informacion">

            <span class="subtitulo">
                ${vehiculo.categoriaTexto}
            </span>

            <h2>${vehiculo.nombre}</h2>

            <p>${vehiculo.descripcion}</p>

            <div class="modal-detalles">

                <div class="modal-detalle">
                    <i class="fa-solid fa-user-group"></i>
                    <strong>${vehiculo.pasajeros}</strong>
                    <span>Pasajeros</span>
                </div>

                <div class="modal-detalle">
                    <i class="fa-solid fa-door-open"></i>
                    <strong>${vehiculo.puertas}</strong>
                    <span>Puertas</span>
                </div>

                <div class="modal-detalle">
                    <i class="fa-solid fa-suitcase-rolling"></i>
                    <strong>${vehiculo.equipaje}</strong>
                    <span>Equipajes</span>
                </div>

                <div class="modal-detalle">
                    <i class="fa-solid fa-gears"></i>
                    <strong>${vehiculo.transmision}</strong>
                    <span>Transmisión</span>
                </div>

            </div>

            <div class="modal-precio">

                <div>
                    <span>Precio del alquiler</span>
                    <strong>US$${vehiculo.precio} por día</strong>
                </div>

                <button
                    type="button"
                    class="boton boton-principal"
                    onclick="seleccionarVehiculo(${vehiculo.id})"
                >
                    Reservar este vehículo
                </button>

            </div>

        </div>
    `;

    modal.classList.add("activo");
    document.body.style.overflow = "hidden";
}

/* =========================================================
   SELECCIONAR VEHÍCULO PARA RESERVAR
========================================================= */

function seleccionarVehiculo(id) {
    const vehiculo = vehiculos.find(
        (elemento) => elemento.id === id
    );

    if (!vehiculo) {
        return;
    }

    localStorage.setItem(
        "autorentcarVehiculoSeleccionado",
        JSON.stringify(vehiculo)
    );

    cerrarModalVehiculo();

    mostrarNotificacion(
        "Vehículo seleccionado",
        `${vehiculo.nombre} fue agregado a tu reservación.`
    );

    setTimeout(() => {
        window.location.href = "reserva.html";
    }, 700);
}


/* =========================================================
   CERRAR LA VENTANA MODAL
========================================================= */

function cerrarModalVehiculo() {
    const modal = document.getElementById("modal-vehiculo");

    if (!modal) {
        return;
    }

    modal.classList.remove("activo");
    document.body.style.overflow = "";
}

/* =========================================================
   AGREGAR O QUITAR FAVORITOS
========================================================= */

function alternarFavorito(id, boton) {
    const icono = boton.querySelector("i");
    const vehiculo = vehiculos.find(
        (elemento) => elemento.id === id
    );

    if (!vehiculo) {
        return;
    }

    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(
            (favoritoId) => favoritoId !== id
        );

        boton.classList.remove("activo");
        icono.classList.remove("fa-solid");
        icono.classList.add("fa-regular");

        mostrarNotificacion(
            "Eliminado de favoritos",
            `${vehiculo.nombre} fue eliminado de tus favoritos.`
        );
    } else {
        favoritos.push(id);

        boton.classList.add("activo");
        icono.classList.remove("fa-regular");
        icono.classList.add("fa-solid");

        mostrarNotificacion(
            "Agregado a favoritos",
            `${vehiculo.nombre} fue guardado en tus favoritos.`
        );
    }

    localStorage.setItem(
        "autorentcarFavoritos",
        JSON.stringify(favoritos)
    );
    actualizarCatalogoSiExiste();
}

/* =========================================================
   NOTIFICACIÓN VISUAL
========================================================= */

let temporizadorNotificacion;

function mostrarNotificacion(titulo, mensaje) {
    const notificacion = document.getElementById("notificacion");
    const tituloElemento = document.getElementById(
        "notificacion-titulo"
    );
    const mensajeElemento = document.getElementById(
        "notificacion-mensaje"
    );

    if (
        !notificacion ||
        !tituloElemento ||
        !mensajeElemento
    ) {
        return;
    }

    tituloElemento.textContent = titulo;
    mensajeElemento.textContent = mensaje;

    notificacion.classList.add("visible");

    clearTimeout(temporizadorNotificacion);

    temporizadorNotificacion = setTimeout(() => {
        notificacion.classList.remove("visible");
    }, 3500);
}

/* =========================================================
   EJECUTAR AL CARGAR LA PÁGINA
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    mostrarVehiculosDestacados();
});
/* =========================================================
   CATÁLOGO COMPLETO DE VEHÍCULOS
========================================================= */

function configurarCatalogoVehiculos() {
    const contenedor = document.getElementById(
        "contenedor-todos-vehiculos"
    );

    if (!contenedor) {
        return;
    }

    const buscarVehiculo = document.getElementById(
        "buscar-vehiculo"
    );

    const filtroCategoria = document.getElementById(
        "filtro-categoria"
    );

    const filtroTransmision = document.getElementById(
        "filtro-transmision"
    );

    const filtroPasajeros = document.getElementById(
        "filtro-pasajeros"
    );

    const filtroPrecio = document.getElementById(
        "filtro-precio"
    );

    const precioSeleccionado = document.getElementById(
        "precio-seleccionado"
    );

    const soloDestacados = document.getElementById(
        "solo-destacados"
    );

    const soloFavoritos = document.getElementById(
        "solo-favoritos"
    );

    const ordenarVehiculos = document.getElementById(
        "ordenar-vehiculos"
    );

    const botonLimpiarFiltros = document.getElementById(
        "boton-limpiar-filtros"
    );

    const botonRestablecerResultados = document.getElementById(
        "boton-restablecer-resultados"
    );

    const botonAbrirFiltros = document.getElementById(
        "boton-abrir-filtros"
    );

    const botonCerrarFiltros = document.getElementById(
        "boton-cerrar-filtros"
    );

    const panelFiltros = document.getElementById(
        "panel-filtros"
    );

    const elementosFiltro = [
        buscarVehiculo,
        filtroCategoria,
        filtroTransmision,
        filtroPasajeros,
        filtroPrecio,
        soloDestacados,
        soloFavoritos,
        ordenarVehiculos
    ];

    elementosFiltro.forEach((elemento) => {
        if (!elemento) {
            return;
        }

        elemento.addEventListener("input", aplicarFiltrosCatalogo);
        elemento.addEventListener("change", aplicarFiltrosCatalogo);
    });

    if (filtroPrecio && precioSeleccionado) {
        filtroPrecio.addEventListener("input", () => {
            precioSeleccionado.textContent =
                `US$${filtroPrecio.value}`;
        });
    }

    if (botonLimpiarFiltros) {
        botonLimpiarFiltros.addEventListener(
            "click",
            limpiarFiltrosCatalogo
        );
    }

    if (botonRestablecerResultados) {
        botonRestablecerResultados.addEventListener(
            "click",
            limpiarFiltrosCatalogo
        );
    }

    if (botonAbrirFiltros && panelFiltros) {
        botonAbrirFiltros.addEventListener("click", () => {
            panelFiltros.classList.add("activo");
            document.body.style.overflow = "hidden";
        });
    }

    if (botonCerrarFiltros && panelFiltros) {
        botonCerrarFiltros.addEventListener("click", () => {
            panelFiltros.classList.remove("activo");
            document.body.style.overflow = "";
        });
    }

    document.addEventListener("click", (evento) => {
        if (
            window.innerWidth <= 1000 &&
            panelFiltros &&
            panelFiltros.classList.contains("activo")
        ) {
            const clicDentroPanel =
                panelFiltros.contains(evento.target);

            const clicBotonAbrir =
                botonAbrirFiltros &&
                botonAbrirFiltros.contains(evento.target);

            if (!clicDentroPanel && !clicBotonAbrir) {
                panelFiltros.classList.remove("activo");
                document.body.style.overflow = "";
            }
        }
    });

    cargarParametrosCatalogo();
    cargarResumenBusqueda();
    aplicarFiltrosCatalogo();
}

/* =========================================================
   APLICAR FILTROS DEL CATÁLOGO
========================================================= */

function aplicarFiltrosCatalogo() {
    const contenedor = document.getElementById(
        "contenedor-todos-vehiculos"
    );

    const buscarVehiculo = document.getElementById(
        "buscar-vehiculo"
    );

    const filtroCategoria = document.getElementById(
        "filtro-categoria"
    );

    const filtroTransmision = document.getElementById(
        "filtro-transmision"
    );

    const filtroPasajeros = document.getElementById(
        "filtro-pasajeros"
    );

    const filtroPrecio = document.getElementById(
        "filtro-precio"
    );

    const soloDestacados = document.getElementById(
        "solo-destacados"
    );

    const soloFavoritos = document.getElementById(
        "solo-favoritos"
    );

    const ordenarVehiculos = document.getElementById(
        "ordenar-vehiculos"
    );

    if (!contenedor) {
        return;
    }

    const textoBusqueda = normalizarTexto(
        buscarVehiculo?.value || ""
    );

    const categoriaSeleccionada =
        filtroCategoria?.value || "todos";

    const transmisionSeleccionada =
        filtroTransmision?.value || "todas";

    const pasajerosSeleccionados =
        filtroPasajeros?.value || "todos";

    const precioMaximo = Number(
        filtroPrecio?.value || 160
    );

    const filtrarDestacados =
        soloDestacados?.checked || false;

    const filtrarFavoritos =
        soloFavoritos?.checked || false;

    let resultados = vehiculos.filter((vehiculo) => {
        const coincideTexto =
            normalizarTexto(vehiculo.nombre).includes(
                textoBusqueda
            ) ||
            normalizarTexto(vehiculo.marca).includes(
                textoBusqueda
            ) ||
            normalizarTexto(vehiculo.categoriaTexto).includes(
                textoBusqueda
            );

        const coincideCategoria =
            categoriaSeleccionada === "todos" ||
            vehiculo.categoria === categoriaSeleccionada;

        const coincideTransmision =
            transmisionSeleccionada === "todas" ||
            vehiculo.transmision === transmisionSeleccionada;

        const coincidePasajeros =
            pasajerosSeleccionados === "todos" ||
            vehiculo.pasajeros >= Number(pasajerosSeleccionados);

        const coincidePrecio =
            vehiculo.precio <= precioMaximo;

        const coincideDestacado =
            !filtrarDestacados || vehiculo.destacado;

        const coincideFavorito =
            !filtrarFavoritos ||
            favoritos.includes(vehiculo.id);

        return (
            coincideTexto &&
            coincideCategoria &&
            coincideTransmision &&
            coincidePasajeros &&
            coincidePrecio &&
            coincideDestacado &&
            coincideFavorito
        );
    });

    resultados = ordenarListaVehiculos(
        resultados,
        ordenarVehiculos?.value || "recomendados"
    );

    mostrarResultadosCatalogo(resultados);
}

/* =========================================================
   MOSTRAR RESULTADOS
========================================================= */

function mostrarResultadosCatalogo(resultados) {
    const contenedor = document.getElementById(
        "contenedor-todos-vehiculos"
    );

    const cantidadVehiculos = document.getElementById(
        "cantidad-vehiculos"
    );

    const sinResultados = document.getElementById(
        "sin-resultados"
    );

    if (!contenedor) {
        return;
    }

    if (cantidadVehiculos) {
        cantidadVehiculos.textContent =
            resultados.length === 1
                ? "1 vehículo"
                : `${resultados.length} vehículos`;
    }

    if (resultados.length === 0) {
        contenedor.innerHTML = "";

        if (sinResultados) {
            sinResultados.classList.add("visible");
        }

        return;
    }

    if (sinResultados) {
        sinResultados.classList.remove("visible");
    }

    contenedor.innerHTML = resultados
        .map(crearTarjetaVehiculo)
        .join("");
}

/* =========================================================
   ORDENAR VEHÍCULOS
========================================================= */

function ordenarListaVehiculos(lista, tipoOrden) {
    const copia = [...lista];

    switch (tipoOrden) {
        case "precio-menor":
            return copia.sort(
                (vehiculoA, vehiculoB) =>
                    vehiculoA.precio - vehiculoB.precio
            );

        case "precio-mayor":
            return copia.sort(
                (vehiculoA, vehiculoB) =>
                    vehiculoB.precio - vehiculoA.precio
            );

        case "nombre-az":
            return copia.sort((vehiculoA, vehiculoB) =>
                vehiculoA.nombre.localeCompare(
                    vehiculoB.nombre,
                    "es"
                )
            );

        case "nombre-za":
            return copia.sort((vehiculoA, vehiculoB) =>
                vehiculoB.nombre.localeCompare(
                    vehiculoA.nombre,
                    "es"
                )
            );

        case "recomendados":
        default:
            return copia.sort((vehiculoA, vehiculoB) => {
                if (
                    vehiculoA.destacado === vehiculoB.destacado
                ) {
                    return vehiculoA.precio - vehiculoB.precio;
                }

                return vehiculoA.destacado ? -1 : 1;
            });
    }
}

/* =========================================================
   LIMPIAR FILTROS
========================================================= */

function limpiarFiltrosCatalogo() {
    const buscarVehiculo = document.getElementById(
        "buscar-vehiculo"
    );

    const filtroCategoria = document.getElementById(
        "filtro-categoria"
    );

    const filtroTransmision = document.getElementById(
        "filtro-transmision"
    );

    const filtroPasajeros = document.getElementById(
        "filtro-pasajeros"
    );

    const filtroPrecio = document.getElementById(
        "filtro-precio"
    );

    const precioSeleccionado = document.getElementById(
        "precio-seleccionado"
    );

    const soloDestacados = document.getElementById(
        "solo-destacados"
    );

    const soloFavoritos = document.getElementById(
        "solo-favoritos"
    );

    const ordenarVehiculos = document.getElementById(
        "ordenar-vehiculos"
    );

    if (buscarVehiculo) {
        buscarVehiculo.value = "";
    }

    if (filtroCategoria) {
        filtroCategoria.value = "todos";
    }

    if (filtroTransmision) {
        filtroTransmision.value = "todas";
    }

    if (filtroPasajeros) {
        filtroPasajeros.value = "todos";
    }

    if (filtroPrecio) {
        filtroPrecio.value = "160";
    }

    if (precioSeleccionado) {
        precioSeleccionado.textContent = "US$160";
    }

    if (soloDestacados) {
        soloDestacados.checked = false;
    }

    if (soloFavoritos) {
        soloFavoritos.checked = false;
    }

    if (ordenarVehiculos) {
        ordenarVehiculos.value = "recomendados";
    }

    aplicarFiltrosCatalogo();

    mostrarNotificacion(
        "Filtros restablecidos",
        "Ahora se muestran todos los vehículos disponibles."
    );
}

/* =========================================================
   CARGAR CATEGORÍA DESDE LA DIRECCIÓN WEB
========================================================= */

function cargarParametrosCatalogo() {
    const parametros = new URLSearchParams(
        window.location.search
    );

    const categoria = parametros.get("categoria");
    const filtroCategoria = document.getElementById(
        "filtro-categoria"
    );

    const categoriasValidas = [
        "todos",
        "economico",
        "sedan",
        "suv",
        "lujo"
    ];

    if (
        categoria &&
        filtroCategoria &&
        categoriasValidas.includes(categoria)
    ) {
        filtroCategoria.value = categoria;
    }
}

/* =========================================================
   CARGAR RESUMEN DE LA BÚSQUEDA
========================================================= */

function cargarResumenBusqueda() {
    const busquedaGuardada = localStorage.getItem(
        "autorentcarBusqueda"
    );

    const parametros = new URLSearchParams(
        window.location.search
    );

    let busqueda = null;

    if (busquedaGuardada) {
        try {
            busqueda = JSON.parse(busquedaGuardada);
        } catch (error) {
            console.error(
                "No fue posible leer la búsqueda guardada.",
                error
            );
        }
    }

    const lugar =
        parametros.get("lugar") ||
        busqueda?.lugar ||
        "";

    const fechaRecogida =
        parametros.get("recogida") ||
        busqueda?.fechaRecogida ||
        "";

    const fechaEntrega =
        parametros.get("entrega") ||
        busqueda?.fechaEntrega ||
        "";

    const resumenUbicacion = document.getElementById(
        "resumen-ubicacion"
    );

    const resumenRecogida = document.getElementById(
        "resumen-recogida"
    );

    const resumenEntrega = document.getElementById(
        "resumen-entrega"
    );

    const resumenDias = document.getElementById(
        "resumen-dias"
    );

    if (resumenUbicacion && lugar) {
        resumenUbicacion.textContent =
            `Vehículos disponibles en ${lugar}`;
    }

    if (resumenRecogida && fechaRecogida) {
        resumenRecogida.textContent =
            formatearFechaEspañol(fechaRecogida);
    }

    if (resumenEntrega && fechaEntrega) {
        resumenEntrega.textContent =
            formatearFechaEspañol(fechaEntrega);
    }

    if (
        resumenDias &&
        fechaRecogida &&
        fechaEntrega
    ) {
        const dias = calcularDiasEntreFechas(
            fechaRecogida,
            fechaEntrega
        );

        resumenDias.textContent =
            dias === 1
                ? "1 día"
                : `${dias} días`;
    }
}

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function calcularDiasEntreFechas(fechaInicial, fechaFinal) {
    const inicio = new Date(`${fechaInicial}T00:00:00`);
    const final = new Date(`${fechaFinal}T00:00:00`);

    const diferencia = final - inicio;

    return Math.max(
        1,
        Math.ceil(
            diferencia / (1000 * 60 * 60 * 24)
        )
    );
}

function formatearFechaEspañol(fechaTexto) {
    const fecha = new Date(`${fechaTexto}T00:00:00`);

    return fecha.toLocaleDateString("es-DO", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

/* =========================================================
   ACTUALIZAR CATÁLOGO DESPUÉS DE CAMBIAR FAVORITOS
========================================================= */

function actualizarCatalogoSiExiste() {
    const contenedor = document.getElementById(
        "contenedor-todos-vehiculos"
    );

    if (contenedor) {
        aplicarFiltrosCatalogo();
    }
}

/* =========================================================
   INICIAR CATÁLOGO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    configurarCatalogoVehiculos();
});
