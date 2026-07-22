/* =========================================================
   AUTORENTCAR - VEHÍCULOS
========================================================= */

const CATEGORIAS_VEHICULOS = [
    "Económico",
    "Gama media",
    "Vehículo de lujo"
];

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
        categoriaTexto: "Vehículo de lujo",
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
        nombre: "Hyundai Sonata",
        marca: "Hyundai",
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
        nombre: "Mercedes-Benz AMG",
        marca: "Mercedes-Benz",
        categoria: "Vehículo de lujo",
        categoriaTexto: "Vehículo de lujo",
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
        categoriaTexto: "Vehículo de lujo",
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
   FAVORITOS
========================================================= */

let favoritos = obtenerFavoritosGuardados();

function obtenerFavoritosGuardados() {
    const contenido = localStorage.getItem(
        "autorentcarFavoritos"
    );

    if (!contenido) {
        return [];
    }

    try {
        const datos = JSON.parse(contenido);

        if (!Array.isArray(datos)) {
            return [];
        }

        return [
            ...new Set(
                datos
                    .map(Number)
                    .filter((id) =>
                        vehiculos.some(
                            (vehiculo) =>
                                vehiculo.id === id
                        )
                    )
            )
        ];
    } catch (error) {
        console.error(
            "No fue posible cargar los favoritos.",
            error
        );

        localStorage.removeItem(
            "autorentcarFavoritos"
        );

        return [];
    }
}

function guardarFavoritos() {
    try {
        localStorage.setItem(
            "autorentcarFavoritos",
            JSON.stringify(favoritos)
        );
    } catch (error) {
        console.error(
            "No fue posible guardar los favoritos.",
            error
        );

        mostrarNotificacion(
            "No se pudo guardar",
            "Ocurrió un problema al guardar tus favoritos."
        );
    }
}

/* =========================================================
   INICIAR
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    mostrarVehiculosDestacados();
    configurarCatalogoVehiculos();
});

/* =========================================================
   CREAR TARJETA
========================================================= */

function crearTarjetaVehiculo(vehiculo) {
    const esFavorito = favoritos.includes(
        vehiculo.id
    );

    const nombre = escaparVehiculoHTML(
        vehiculo.nombre || "Vehículo"
    );

    const imagen = escaparVehiculoHTML(
        vehiculo.imagen || ""
    );

    const etiqueta = escaparVehiculoHTML(
        vehiculo.etiqueta || ""
    );

    const categoria = escaparVehiculoHTML(
        vehiculo.categoriaTexto ||
        vehiculo.categoria ||
        "Sin categoría"
    );

    const transmision = escaparVehiculoHTML(
        vehiculo.transmision ||
        "Sin información"
    );

    const combustible = escaparVehiculoHTML(
        vehiculo.combustible ||
        "Sin información"
    );

    return `
        <article class="tarjeta-vehiculo">

            <div class="vehiculo-imagen-contenedor">

                <img
                    src="${imagen}"
                    alt="${nombre}"
                    class="vehiculo-imagen"
                    loading="lazy"
                >

                ${
                    etiqueta
                        ? `
                            <span class="vehiculo-etiqueta">
                                ${etiqueta}
                            </span>
                        `
                        : ""
                }

                <button
                    class="vehiculo-favorito ${
                        esFavorito
                            ? "activo"
                            : ""
                    }"
                    type="button"
                    onclick="alternarFavorito(
                        ${Number(vehiculo.id)},
                        this
                    )"
                    aria-label="${
                        esFavorito
                            ? "Eliminar"
                            : "Agregar"
                    } ${nombre} ${
                        esFavorito
                            ? "de"
                            : "a"
                    } favoritos"
                    aria-pressed="${esFavorito}"
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
                        <h3>${nombre}</h3>
                        <span>${categoria}</span>
                    </div>

                    <div class="vehiculo-precio">

                        <strong>
                            ${formatearPrecioVehiculo(
                                vehiculo.precio
                            )}
                        </strong>

                        <span>por día</span>

                    </div>

                </div>

                <div class="vehiculo-caracteristicas">

                    <span>
                        <i class="fa-solid fa-user-group"></i>

                        ${Number(
                            vehiculo.pasajeros || 0
                        )} pasajeros
                    </span>

                    <span>
                        <i class="fa-solid fa-gears"></i>

                        ${transmision}
                    </span>

                    <span>
                        <i class="fa-solid fa-gas-pump"></i>

                        ${combustible}
                    </span>

                </div>

                <div class="vehiculo-acciones">

                    <button
                        class="boton-detalles"
                        type="button"
                        onclick="mostrarDetallesVehiculo(
                            ${Number(vehiculo.id)}
                        )"
                    >
                        Ver detalles
                    </button>

                    <button
                        class="boton-reservar-vehiculo"
                        type="button"
                        onclick="seleccionarVehiculo(
                            ${Number(vehiculo.id)}
                        )"
                    >
                        Reservar
                    </button>

                </div>

            </div>

        </article>
    `;
}

/* =========================================================
   VEHÍCULOS DESTACADOS
========================================================= */

function mostrarVehiculosDestacados() {
    const contenedor = document.getElementById(
        "contenedor-vehiculos-destacados"
    );

    if (!contenedor) {
        return;
    }

    const destacados = vehiculos.filter(
        (vehiculo) =>
            Boolean(vehiculo.destacado)
    );

    contenedor.innerHTML = destacados
        .map(crearTarjetaVehiculo)
        .join("");
}

/* =========================================================
   MODAL DE DETALLES
========================================================= */

function mostrarDetallesVehiculo(id) {
    const vehiculo = vehiculos.find(
        (elemento) =>
            elemento.id === Number(id)
    );

    const modal = document.getElementById(
        "modal-vehiculo"
    );

    const contenidoModal = document.getElementById(
        "contenido-modal"
    );

    if (!vehiculo) {
        mostrarNotificacion(
            "Vehículo no encontrado",
            "No fue posible encontrar la información del vehículo."
        );

        return;
    }

    if (!modal || !contenidoModal) {
        return;
    }

    contenidoModal.innerHTML = `
        <img
            src="${escaparVehiculoHTML(
                vehiculo.imagen || ""
            )}"
            alt="${escaparVehiculoHTML(
                vehiculo.nombre ||
                "Vehículo"
            )}"
            class="modal-vehiculo-imagen"
        >

        <div class="modal-vehiculo-informacion">

            <span class="subtitulo">
                ${escaparVehiculoHTML(
                    vehiculo.categoriaTexto ||
                    vehiculo.categoria ||
                    "Sin categoría"
                )}
            </span>

            <h2>
                ${escaparVehiculoHTML(
                    vehiculo.nombre ||
                    "Vehículo"
                )}
            </h2>

            <p>
                ${escaparVehiculoHTML(
                    vehiculo.descripcion ||
                    "Sin descripción disponible."
                )}
            </p>

            <div class="modal-detalles">

                <div class="modal-detalle">

                    <i class="fa-solid fa-user-group"></i>

                    <strong>
                        ${Number(
                            vehiculo.pasajeros || 0
                        )}
                    </strong>

                    <span>Pasajeros</span>

                </div>

                <div class="modal-detalle">

                    <i class="fa-solid fa-door-open"></i>

                    <strong>
                        ${Number(
                            vehiculo.puertas || 0
                        )}
                    </strong>

                    <span>Puertas</span>

                </div>

                <div class="modal-detalle">

                    <i class="fa-solid fa-suitcase-rolling"></i>

                    <strong>
                        ${Number(
                            vehiculo.equipaje || 0
                        )}
                    </strong>

                    <span>Equipajes</span>

                </div>

                <div class="modal-detalle">

                    <i class="fa-solid fa-gears"></i>

                    <strong>
                        ${escaparVehiculoHTML(
                            vehiculo.transmision ||
                            "Sin información"
                        )}
                    </strong>

                    <span>Transmisión</span>

                </div>

            </div>

            <div class="modal-precio">

                <div>

                    <span>Precio del alquiler</span>

                    <strong>
                        ${formatearPrecioVehiculo(
                            vehiculo.precio
                        )}
                        por día
                    </strong>

                </div>

                <button
                    type="button"
                    class="boton boton-principal"
                    onclick="seleccionarVehiculo(
                        ${Number(vehiculo.id)}
                    )"
                >
                    Reservar este vehículo
                </button>

            </div>

        </div>
    `;

    modal.classList.add("activo");
    actualizarBloqueoVehiculos();
}

/* =========================================================
   SELECCIONAR VEHÍCULO
========================================================= */

function seleccionarVehiculo(id) {
    const vehiculo = vehiculos.find(
        (elemento) =>
            elemento.id === Number(id)
    );

    if (!vehiculo) {
        mostrarNotificacion(
            "Vehículo no encontrado",
            "No fue posible seleccionar el vehículo."
        );

        return;
    }

    try {
        localStorage.setItem(
            "autorentcarVehiculoSeleccionado",
            JSON.stringify(vehiculo)
        );
    } catch (error) {
        console.error(
            "No fue posible guardar el vehículo seleccionado.",
            error
        );

        mostrarNotificacion(
            "No se pudo seleccionar",
            "Ocurrió un problema al preparar la reservación."
        );

        return;
    }

    if (
        typeof cerrarModalVehiculo ===
        "function"
    ) {
        cerrarModalVehiculo();
    }

    mostrarNotificacion(
        "Vehículo seleccionado",
        `${vehiculo.nombre} fue agregado a tu reservación.`
    );

    setTimeout(() => {
        window.location.href =
            "reserva.html";
    }, 700);
}

/* =========================================================
   FAVORITOS
========================================================= */

function alternarFavorito(id, boton) {
    const identificador = Number(id);

    const vehiculo = vehiculos.find(
        (elemento) =>
            elemento.id === identificador
    );

    if (!vehiculo || !boton) {
        return;
    }

    const icono = boton.querySelector("i");

    if (favoritos.includes(identificador)) {
        favoritos = favoritos.filter(
            (favoritoId) =>
                favoritoId !== identificador
        );

        boton.classList.remove("activo");

        boton.setAttribute(
            "aria-pressed",
            "false"
        );

        boton.setAttribute(
            "aria-label",
            `Agregar ${vehiculo.nombre} a favoritos`
        );

        icono?.classList.remove(
            "fa-solid"
        );

        icono?.classList.add(
            "fa-regular"
        );

        mostrarNotificacion(
            "Eliminado de favoritos",
            `${vehiculo.nombre} fue eliminado de tus favoritos.`
        );
    } else {
        favoritos.push(identificador);

        favoritos = [
            ...new Set(favoritos)
        ];

        boton.classList.add("activo");

        boton.setAttribute(
            "aria-pressed",
            "true"
        );

        boton.setAttribute(
            "aria-label",
            `Eliminar ${vehiculo.nombre} de favoritos`
        );

        icono?.classList.remove(
            "fa-regular"
        );

        icono?.classList.add(
            "fa-solid"
        );

        mostrarNotificacion(
            "Agregado a favoritos",
            `${vehiculo.nombre} fue guardado en tus favoritos.`
        );
    }

    guardarFavoritos();
    actualizarCatalogoSiExiste();
    actualizarDestacadosSiExisten();
}

function actualizarDestacadosSiExisten() {
    const contenedor = document.getElementById(
        "contenedor-vehiculos-destacados"
    );

    if (contenedor) {
        mostrarVehiculosDestacados();
    }
}

/* =========================================================
   CATÁLOGO
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

    const botonRestablecerResultados =
        document.getElementById(
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

        if (
            elemento.type === "search" ||
            elemento.type === "text" ||
            elemento.type === "range"
        ) {
            elemento.addEventListener(
                "input",
                aplicarFiltrosCatalogo
            );
        } else {
            elemento.addEventListener(
                "change",
                aplicarFiltrosCatalogo
            );
        }
    });

    filtroPrecio?.addEventListener(
        "input",
        () => {
            if (precioSeleccionado) {
                precioSeleccionado.textContent =
                    formatearPrecioVehiculo(
                        filtroPrecio.value
                    );
            }
        }
    );

    botonLimpiarFiltros?.addEventListener(
        "click",
        limpiarFiltrosCatalogo
    );

    botonRestablecerResultados?.addEventListener(
        "click",
        limpiarFiltrosCatalogo
    );

    botonAbrirFiltros?.addEventListener(
        "click",
        () => {
            panelFiltros?.classList.add(
                "activo"
            );

            actualizarBloqueoVehiculos();
        }
    );

    botonCerrarFiltros?.addEventListener(
        "click",
        () => {
            panelFiltros?.classList.remove(
                "activo"
            );

            actualizarBloqueoVehiculos();
        }
    );

    document.addEventListener(
        "click",
        (evento) => {
            if (
                window.innerWidth > 1000 ||
                !panelFiltros?.classList.contains(
                    "activo"
                )
            ) {
                return;
            }

            const clicDentroPanel =
                panelFiltros.contains(
                    evento.target
                );

            const clicBotonAbrir =
                botonAbrirFiltros?.contains(
                    evento.target
                );

            if (
                !clicDentroPanel &&
                !clicBotonAbrir
            ) {
                panelFiltros.classList.remove(
                    "activo"
                );

                actualizarBloqueoVehiculos();
            }
        }
    );

    document.addEventListener(
        "keydown",
        (evento) => {
            if (evento.key !== "Escape") {
                return;
            }

            if (
                panelFiltros?.classList.contains(
                    "activo"
                )
            ) {
                panelFiltros.classList.remove(
                    "activo"
                );

                actualizarBloqueoVehiculos();
            }
        }
    );

    window.addEventListener(
        "resize",
        () => {
            if (
                window.innerWidth > 1000 &&
                panelFiltros?.classList.contains(
                    "activo"
                )
            ) {
                panelFiltros.classList.remove(
                    "activo"
                );

                actualizarBloqueoVehiculos();
            }
        }
    );

    cargarParametrosCatalogo();
    cargarResumenBusqueda();
    aplicarFiltrosCatalogo();
}

/* =========================================================
   APLICAR FILTROS
========================================================= */

function aplicarFiltrosCatalogo() {
    const contenedor = document.getElementById(
        "contenedor-todos-vehiculos"
    );

    if (!contenedor) {
        return;
    }

    const textoBusqueda = normalizarTextoVehiculo(
        document.getElementById(
            "buscar-vehiculo"
        )?.value || ""
    );

    const categoriaSeleccionada =
        document.getElementById(
            "filtro-categoria"
        )?.value || "todos";

    const transmisionSeleccionada =
        document.getElementById(
            "filtro-transmision"
        )?.value || "todas";

    const pasajerosSeleccionados =
        document.getElementById(
            "filtro-pasajeros"
        )?.value || "todos";

    const filtroPrecio =
        document.getElementById(
            "filtro-precio"
        );

    const precioMaximo = Number(
        filtroPrecio?.value ||
        obtenerPrecioMaximoVehiculos()
    );

    const filtrarDestacados = Boolean(
        document.getElementById(
            "solo-destacados"
        )?.checked
    );

    const filtrarFavoritos = Boolean(
        document.getElementById(
            "solo-favoritos"
        )?.checked
    );

    const ordenarVehiculos =
        document.getElementById(
            "ordenar-vehiculos"
        )?.value || "recomendados";

    let resultados = vehiculos.filter(
        (vehiculo) => {
            const contenidoBusqueda =
                normalizarTextoVehiculo(
                    [
                        vehiculo.nombre,
                        vehiculo.marca,
                        vehiculo.categoria,
                        vehiculo.categoriaTexto,
                        vehiculo.transmision,
                        vehiculo.combustible,
                        vehiculo.descripcion,
                        vehiculo.etiqueta
                    ].join(" ")
                );

            const coincideTexto =
                contenidoBusqueda.includes(
                    textoBusqueda
                );

            const coincideCategoria =
                coincideCategoriaVehiculo(
                    vehiculo,
                    categoriaSeleccionada
                );

            const coincideTransmision =
                transmisionSeleccionada ===
                    "todas" ||
                normalizarTextoVehiculo(
                    vehiculo.transmision
                ) ===
                    normalizarTextoVehiculo(
                        transmisionSeleccionada
                    );

            const coincidePasajeros =
                pasajerosSeleccionados ===
                    "todos" ||
                Number(vehiculo.pasajeros) >=
                    Number(
                        pasajerosSeleccionados
                    );

            const coincidePrecio =
                Number(vehiculo.precio) <=
                precioMaximo;

            const coincideDestacado =
                !filtrarDestacados ||
                Boolean(vehiculo.destacado);

            const coincideFavorito =
                !filtrarFavoritos ||
                favoritos.includes(
                    vehiculo.id
                );

            return (
                coincideTexto &&
                coincideCategoria &&
                coincideTransmision &&
                coincidePasajeros &&
                coincidePrecio &&
                coincideDestacado &&
                coincideFavorito
            );
        }
    );

    resultados = ordenarListaVehiculos(
        resultados,
        ordenarVehiculos
    );

    mostrarResultadosCatalogo(resultados);
}

/* =========================================================
   COMPROBAR CATEGORÍA
========================================================= */

function coincideCategoriaVehiculo(
    vehiculo,
    categoriaSeleccionada
) {
    if (
        !categoriaSeleccionada ||
        normalizarTextoVehiculo(
            categoriaSeleccionada
        ) === "todos"
    ) {
        return true;
    }

    const categoriaFiltro =
        normalizarTextoVehiculo(
            categoriaSeleccionada
        );

    const categoriaVehiculo =
        normalizarTextoVehiculo(
            vehiculo.categoria || ""
        );

    const categoriasNormalizadas =
        CATEGORIAS_VEHICULOS.map(
            normalizarTextoVehiculo
        );

    if (
        !categoriasNormalizadas.includes(
            categoriaFiltro
        )
    ) {
        return false;
    }

    return (
        categoriaVehiculo ===
        categoriaFiltro
    );
}

/* =========================================================
   MOSTRAR RESULTADOS
========================================================= */

function mostrarResultadosCatalogo(
    resultados
) {
    const contenedor = document.getElementById(
        "contenedor-todos-vehiculos"
    );

    const cantidadVehiculos =
        document.getElementById(
            "cantidad-vehiculos"
        );

    const sinResultados =
        document.getElementById(
            "sin-resultados"
        );

    if (!contenedor) {
        return;
    }

    colocarCantidadVehiculos(
        cantidadVehiculos,
        resultados.length
    );

    if (!resultados.length) {
        contenedor.innerHTML = "";

        sinResultados?.classList.add(
            "visible"
        );

        return;
    }

    sinResultados?.classList.remove(
        "visible"
    );

    contenedor.innerHTML = resultados
        .map(crearTarjetaVehiculo)
        .join("");
}

function colocarCantidadVehiculos(
    elemento,
    cantidad
) {
    if (!elemento) {
        return;
    }

    elemento.textContent =
        cantidad === 1
            ? "1 vehículo"
            : `${cantidad} vehículos`;
}

/* =========================================================
   ORDENAR VEHÍCULOS
========================================================= */

function ordenarListaVehiculos(
    lista,
    tipoOrden
) {
    const copia = [...lista];

    switch (tipoOrden) {
        case "precio-menor":
            return copia.sort(
                (vehiculoA, vehiculoB) =>
                    Number(
                        vehiculoA.precio || 0
                    ) -
                    Number(
                        vehiculoB.precio || 0
                    )
            );

        case "precio-mayor":
            return copia.sort(
                (vehiculoA, vehiculoB) =>
                    Number(
                        vehiculoB.precio || 0
                    ) -
                    Number(
                        vehiculoA.precio || 0
                    )
            );

        case "nombre-az":
            return copia.sort(
                (vehiculoA, vehiculoB) =>
                    String(
                        vehiculoA.nombre || ""
                    ).localeCompare(
                        String(
                            vehiculoB.nombre || ""
                        ),
                        "es",
                        {
                            sensitivity: "base"
                        }
                    )
            );

        case "nombre-za":
            return copia.sort(
                (vehiculoA, vehiculoB) =>
                    String(
                        vehiculoB.nombre || ""
                    ).localeCompare(
                        String(
                            vehiculoA.nombre || ""
                        ),
                        "es",
                        {
                            sensitivity: "base"
                        }
                    )
            );

        case "recomendados":
        default:
            return copia.sort(
                (vehiculoA, vehiculoB) => {
                    if (
                        Boolean(
                            vehiculoA.destacado
                        ) ===
                        Boolean(
                            vehiculoB.destacado
                        )
                    ) {
                        return (
                            Number(
                                vehiculoA.precio || 0
                            ) -
                            Number(
                                vehiculoB.precio || 0
                            )
                        );
                    }

                    return vehiculoA.destacado
                        ? -1
                        : 1;
                }
            );
    }
}

/* =========================================================
   LIMPIAR FILTROS
========================================================= */

function limpiarFiltrosCatalogo() {
    asignarValorFiltro(
        "buscar-vehiculo",
        ""
    );

    asignarValorFiltro(
        "filtro-categoria",
        "todos"
    );

    asignarValorFiltro(
        "filtro-transmision",
        "todas"
    );

    asignarValorFiltro(
        "filtro-pasajeros",
        "todos"
    );

    const precioMaximo =
        obtenerPrecioMaximoVehiculos();

    asignarValorFiltro(
        "filtro-precio",
        String(precioMaximo)
    );

    const precioSeleccionado =
        document.getElementById(
            "precio-seleccionado"
        );

    if (precioSeleccionado) {
        precioSeleccionado.textContent =
            formatearPrecioVehiculo(
                precioMaximo
            );
    }

    const soloDestacados =
        document.getElementById(
            "solo-destacados"
        );

    const soloFavoritos =
        document.getElementById(
            "solo-favoritos"
        );

    if (soloDestacados) {
        soloDestacados.checked = false;
    }

    if (soloFavoritos) {
        soloFavoritos.checked = false;
    }

    asignarValorFiltro(
        "ordenar-vehiculos",
        "recomendados"
    );

    aplicarFiltrosCatalogo();

    mostrarNotificacion(
        "Filtros restablecidos",
        "Ahora se muestran todos los vehículos disponibles."
    );
}

function asignarValorFiltro(id, valor) {
    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.value = valor;
    }
}

function obtenerPrecioMaximoVehiculos() {
    const precios = vehiculos
        .map((vehiculo) =>
            Number(vehiculo.precio)
        )
        .filter(Number.isFinite);

    return precios.length
        ? Math.max(...precios)
        : 160;
}

/* =========================================================
   PARÁMETROS DE LA URL
========================================================= */

function cargarParametrosCatalogo() {
    const parametros = new URLSearchParams(
        window.location.search
    );

    const categoriaParametro =
        normalizarTextoVehiculo(
            parametros.get("categoria") || ""
        );

    const filtroCategoria =
        document.getElementById(
            "filtro-categoria"
        );

    if (
        !categoriaParametro ||
        !filtroCategoria
    ) {
        return;
    }

    const opciones = Array.from(
        filtroCategoria.options
    );

    const opcionCoincidente =
        opciones.find((opcion) => {
            const valorOpcion =
                normalizarTextoVehiculo(
                    opcion.value
                );

            const textoOpcion =
                normalizarTextoVehiculo(
                    opcion.textContent
                );

            return (
                valorOpcion ===
                    categoriaParametro ||
                textoOpcion ===
                    categoriaParametro
            );
        });

    if (opcionCoincidente) {
        filtroCategoria.value =
            opcionCoincidente.value;
    }
}

/* =========================================================
   RESUMEN DE BÚSQUEDA
========================================================= */

function cargarResumenBusqueda() {
    const busquedaGuardada =
        localStorage.getItem(
            "autorentcarBusqueda"
        );

    const parametros = new URLSearchParams(
        window.location.search
    );

    let busqueda = null;

    if (busquedaGuardada) {
        try {
            const datos = JSON.parse(
                busquedaGuardada
            );

            if (
                datos &&
                typeof datos === "object"
            ) {
                busqueda = datos;
            }
        } catch (error) {
            localStorage.removeItem(
                "autorentcarBusqueda"
            );

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

    colocarResumenBusqueda(
        "resumen-ubicacion",
        lugar
            ? `Vehículos disponibles en ${lugar}`
            : "Vehículos disponibles"
    );

    colocarResumenBusqueda(
        "resumen-recogida",
        formatearFechaVehiculo(
            fechaRecogida
        )
    );

    colocarResumenBusqueda(
        "resumen-entrega",
        formatearFechaVehiculo(
            fechaEntrega
        )
    );

    const dias = calcularDiasEntreFechas(
        fechaRecogida,
        fechaEntrega
    );

    colocarResumenBusqueda(
        "resumen-dias",
        dias > 0
            ? dias === 1
                ? "1 día"
                : `${dias} días`
            : "Fechas no seleccionadas"
    );
}

function colocarResumenBusqueda(
    id,
    valor
) {
    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function normalizarTextoVehiculo(texto) {
    return String(texto ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim();
}

function calcularDiasEntreFechas(
    fechaInicial,
    fechaFinal
) {
    const inicio =
        convertirFechaVehiculo(
            fechaInicial
        );

    const final =
        convertirFechaVehiculo(
            fechaFinal
        );

    if (
        !inicio ||
        !final ||
        final <= inicio
    ) {
        return 0;
    }

    return Math.ceil(
        (final - inicio) /
        (1000 * 60 * 60 * 24)
    );
}

function convertirFechaVehiculo(
    fechaTexto
) {
    if (!fechaTexto) {
        return null;
    }

    const fecha = new Date(
        `${fechaTexto}T00:00:00`
    );

    if (Number.isNaN(fecha.getTime())) {
        return null;
    }

    return fecha;
}

function formatearFechaVehiculo(
    fechaTexto
) {
    const fecha = convertirFechaVehiculo(
        fechaTexto
    );

    if (!fecha) {
        return "Sin fecha";
    }

    return fecha.toLocaleDateString(
        "es-DO",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

function formatearPrecioVehiculo(valor) {
    const numero = Number(valor);

    const precio =
        Number.isFinite(numero)
            ? numero
            : 0;

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(precio);
}

function escaparVehiculoHTML(texto) {
    const elemento =
        document.createElement("div");

    elemento.textContent =
        String(texto ?? "");

    return elemento.innerHTML;
}

function actualizarCatalogoSiExiste() {
    const contenedor = document.getElementById(
        "contenedor-todos-vehiculos"
    );

    if (contenedor) {
        aplicarFiltrosCatalogo();
    }
}

function actualizarBloqueoVehiculos() {
    const modalActivo =
        document.querySelector(
            ".modal.activo"
        );

    const filtrosActivos =
        document.getElementById(
            "panel-filtros"
        )?.classList.contains("activo");

    document.body.style.overflow =
        modalActivo || filtrosActivos
            ? "hidden"
            : "";
}
