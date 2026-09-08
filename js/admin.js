/* =========================================================
   AUTORENTCAR - INTERFAZ ADMINISTRATIVA
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS
    ===================================================== */

    const body = document.body;

    /* =====================================================
   MODO CLARO / OSCURO
===================================================== */

const botonTema =
    document.getElementById(
        "admin-theme-toggle"
    );


const CLAVE_TEMA_ADMIN =
    "autorentcar-admin-tema";


function obtenerTemaAdminActual() {

    return (
        document
            .documentElement
            .dataset
            .adminTema ===
        "oscuro"
    )
        ? "oscuro"
        : "claro";

}


function actualizarBotonTemaAdmin() {

    if (!botonTema) {
        return;
    }


    const temaOscuro =
        obtenerTemaAdminActual() ===
        "oscuro";


    const icono =
        botonTema.querySelector(
            "i"
        );


    botonTema.setAttribute(
        "aria-pressed",
        temaOscuro
            ? "true"
            : "false"
    );


    botonTema.setAttribute(
        "aria-label",
        temaOscuro
            ? "Activar modo claro"
            : "Activar modo oscuro"
    );


    botonTema.setAttribute(
        "title",
        temaOscuro
            ? "Modo claro"
            : "Modo oscuro"
    );


    if (icono) {

        icono.className =
            temaOscuro
                ? "fa-regular fa-sun"
                : "fa-regular fa-moon";

    }

}


function aplicarTemaAdmin(
    tema,
    guardar = true
) {

    const temaSeguro =
        tema === "oscuro"
            ? "oscuro"
            : "claro";


    document
        .documentElement
        .dataset
        .adminTema =
        temaSeguro;


    document
        .documentElement
        .style
        .colorScheme =
        temaSeguro ===
            "oscuro"
            ? "dark"
            : "light";


    if (guardar) {

        try {

            localStorage.setItem(
                CLAVE_TEMA_ADMIN,
                temaSeguro
            );

        } catch (error) {

            console.error(
                "No fue posible guardar el tema administrativo.",
                error
            );

        }

    }


    actualizarBotonTemaAdmin();

}


aplicarTemaAdmin(
    obtenerTemaAdminActual(),
    false
);


botonTema?.addEventListener(
    "click",
    () => {

        const siguienteTema =
            obtenerTemaAdminActual() ===
                "oscuro"
                ? "claro"
                : "oscuro";


        aplicarTemaAdmin(
            siguienteTema
        );

    }
);

    const botonColapsar = document.getElementById(
        "sidebar-collapse-btn"
    );

    const botonMenuMovil = document.getElementById(
        "topbar-menu-mobile"
    );

    const overlay = document.getElementById(
        "sidebar-overlay"
    );

    const usuario = document.querySelector(
        ".topbar-user"
    );

    const botonUsuario = document.getElementById(
        "topbar-user-button"
    );


    /* =====================================================
       SIDEBAR - ESTADO GUARDADO
    ===================================================== */

    const estadoSidebar = localStorage.getItem(
        "autorentcar-admin-sidebar"
    );

    if (estadoSidebar === "collapsed") {
        body.classList.add("sidebar-collapsed");
    }


    /* =====================================================
       COLAPSAR SIDEBAR
    ===================================================== */

    if (botonColapsar) {

        botonColapsar.addEventListener("click", () => {

            body.classList.toggle(
                "sidebar-collapsed"
            );

            const colapsado =
                body.classList.contains(
                    "sidebar-collapsed"
                );

            localStorage.setItem(
                "autorentcar-admin-sidebar",
                colapsado
                    ? "collapsed"
                    : "expanded"
            );

        });

    }


    /* =====================================================
       SIDEBAR MÓVIL
    ===================================================== */

    function abrirMenuMovil() {

        body.classList.add(
            "sidebar-mobile-open"
        );

    }


    function cerrarMenuMovil() {

        body.classList.remove(
            "sidebar-mobile-open"
        );

    }


    if (botonMenuMovil) {

        botonMenuMovil.addEventListener(
            "click",
            abrirMenuMovil
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            cerrarMenuMovil
        );

    }


    /* =====================================================
       MENÚ DE USUARIO
    ===================================================== */

    if (botonUsuario && usuario) {

        botonUsuario.addEventListener(
            "click",
            (evento) => {

                evento.stopPropagation();

                usuario.classList.toggle(
                    "open"
                );

                const abierto =
                    usuario.classList.contains(
                        "open"
                    );

                botonUsuario.setAttribute(
                    "aria-expanded",
                    abierto
                        ? "true"
                        : "false"
                );

            }
        );

    }


    /* =====================================================
       CERRAR MENÚ AL HACER CLIC FUERA
    ===================================================== */

    document.addEventListener(
        "click",
        (evento) => {

            if (
                usuario &&
                !usuario.contains(evento.target)
            ) {

                usuario.classList.remove(
                    "open"
                );

                if (botonUsuario) {

                    botonUsuario.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }

        }
    );


    /* =====================================================
       TECLA ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        (evento) => {

            if (evento.key !== "Escape") {
                return;
            }

            cerrarMenuMovil();

            if (usuario) {

                usuario.classList.remove(
                    "open"
                );

            }

            if (botonUsuario) {

                botonUsuario.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    /* =====================================================
       CERRAR SIDEBAR MÓVIL AL CAMBIAR DE PÁGINA
    ===================================================== */

    const enlacesSidebar = document.querySelectorAll(
        ".sidebar-link"
    );

    enlacesSidebar.forEach((enlace) => {

        enlace.addEventListener(
            "click",
            () => {

                if (window.innerWidth <= 980) {

                    cerrarMenuMovil();

                }

            }
        );

    });


    /* =====================================================
       ANIMACIONES DE ENTRADA
    ===================================================== */

    const elementosAnimados =
        document.querySelectorAll(
            "[data-animate]"
        );

    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                (entradas) => {

                    entradas.forEach(
                        (entrada) => {

                            if (
                                entrada.isIntersecting
                            ) {

                                entrada.target.classList.add(
                                    "is-visible"
                                );

                                observer.unobserve(
                                    entrada.target
                                );

                            }

                        }
                    );

                },
                {
                    threshold: 0.08
                }
            );


        elementosAnimados.forEach(
            (elemento) => {

                observer.observe(
                    elemento
                );

            }
        );

    } else {

        elementosAnimados.forEach(
            (elemento) => {

                elemento.classList.add(
                    "is-visible"
                );

            }
        );

    }
    /* =====================================================
       AJUSTE AL CAMBIAR TAMAÑO DE PANTALLA
    ===================================================== */

    window.addEventListener(
        "resize",
        () => {

            if (window.innerWidth > 980) {

                cerrarMenuMovil();

            }

        }
    );

});

/* =========================================================
   ACCIONES RÁPIDAS SUPERADMIN
========================================================= */

const topbarQuickAction =
    document.getElementById(
        "topbar-quick-action"
    );


const topbarQuickActionButton =
    document.getElementById(
        "topbar-quick-action-button"
    );


const topbarQuickActionMenu =
    document.getElementById(
        "topbar-quick-action-menu"
    );


function cerrarAccionesRapidas() {

    if (
        !topbarQuickAction ||
        !topbarQuickActionButton ||
        !topbarQuickActionMenu
    ) {

        return;

    }


    topbarQuickAction.classList.remove(
        "open"
    );


    topbarQuickActionButton.setAttribute(
        "aria-expanded",
        "false"
    );


    topbarQuickActionMenu.setAttribute(
        "aria-hidden",
        "true"
    );

}


function abrirAccionesRapidas() {

    if (
        !topbarQuickAction ||
        !topbarQuickActionButton ||
        !topbarQuickActionMenu
    ) {

        return;

    }


    /*
     * Si el menú del usuario está abierto,
     * lo cerramos para evitar dos desplegables
     * simultáneos.
     */

    const topbarUsuario =
        document.querySelector(
            ".topbar-user"
        );


    const topbarUsuarioBoton =
        document.getElementById(
            "topbar-user-button"
        );


    if (topbarUsuario) {

        topbarUsuario.classList.remove(
            "open"
        );

    }


    if (topbarUsuarioBoton) {

        topbarUsuarioBoton.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    topbarQuickAction.classList.add(
        "open"
    );


    topbarQuickActionButton.setAttribute(
        "aria-expanded",
        "true"
    );


    topbarQuickActionMenu.setAttribute(
        "aria-hidden",
        "false"
    );

}


topbarQuickActionButton
    ?.addEventListener(
        "click",
        event =>
        {

            event.stopPropagation();


            const estaAbierto =
                topbarQuickAction
                    ?.classList
                    .contains(
                        "open"
                    );


            if (estaAbierto) {

                cerrarAccionesRapidas();

            } else {

                abrirAccionesRapidas();

            }

        }
    );


topbarQuickActionMenu
    ?.addEventListener(
        "click",
        event =>
        {

            event.stopPropagation();

        }
    );


document.addEventListener(
    "click",
    event =>
    {

        if (
            topbarQuickAction &&
            !topbarQuickAction.contains(
                event.target
            )
        ) {

            cerrarAccionesRapidas();

        }

    }
);

document.addEventListener(
    "keydown",
    event =>
    {

        if (
            event.key ===
            "Escape"
        ) {

            cerrarAccionesRapidas();

        }

    }
);

/* =========================================================
   NOTIFICACIONES SUPERADMIN
========================================================= */

const topbarNotifications =
    document.getElementById(
        "topbar-notifications"
    );


const topbarNotificationsButton =
    document.getElementById(
        "topbar-notifications-button"
    );


const topbarNotificationsMenu =
    document.getElementById(
        "topbar-notifications-menu"
    );


/* =========================================================
   CERRAR NOTIFICACIONES
========================================================= */

function cerrarNotificacionesAdmin() {

    if (
        !topbarNotifications ||
        !topbarNotificationsButton ||
        !topbarNotificationsMenu
    ) {

        return;

    }


    topbarNotifications.classList.remove(
        "open"
    );


    topbarNotificationsButton.setAttribute(
        "aria-expanded",
        "false"
    );


    topbarNotificationsMenu.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   ABRIR NOTIFICACIONES
========================================================= */

function abrirNotificacionesAdmin() {

    if (
        !topbarNotifications ||
        !topbarNotificationsButton ||
        !topbarNotificationsMenu
    ) {

        return;

    }


    /*
     * Cerrar menú del usuario.
     */

    const topbarUsuario =
        document.querySelector(
            ".topbar-user"
        );


    const topbarUsuarioBoton =
        document.getElementById(
            "topbar-user-button"
        );


    if (topbarUsuario) {

        topbarUsuario.classList.remove(
            "open"
        );

    }


    if (topbarUsuarioBoton) {

        topbarUsuarioBoton.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    /*
     * Cerrar Acciones rápidas.
     *
     * Esta función ya existe en tu archivo.
     */

    cerrarAccionesRapidas();


    topbarNotifications.classList.add(
        "open"
    );


    topbarNotificationsButton.setAttribute(
        "aria-expanded",
        "true"
    );


    topbarNotificationsMenu.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* =========================================================
   BOTÓN CAMPANA
========================================================= */

topbarNotificationsButton
    ?.addEventListener(
        "click",
        event =>
        {

            event.stopPropagation();


            const estaAbierto =
                topbarNotifications
                    ?.classList
                    .contains(
                        "open"
                    );


            if (estaAbierto) {

                cerrarNotificacionesAdmin();

            } else {

                abrirNotificacionesAdmin();

            }

        }
    );


/* =========================================================
   CLIC DENTRO DEL MENÚ
========================================================= */

topbarNotificationsMenu
    ?.addEventListener(
        "click",
        event =>
        {

            /*
             * Impide que el clic se propague al documento.
             *
             * Los formularios de notificación podrán
             * enviarse normalmente.
             */

            event.stopPropagation();

        }
    );


/* =========================================================
   SI ABRIMOS ACCIÓN RÁPIDA,
   CERRAR NOTIFICACIONES
========================================================= */

topbarQuickActionButton
    ?.addEventListener(
        "click",
        () =>
        {

            cerrarNotificacionesAdmin();

        }
    );


/* =========================================================
   SI ABRIMOS MENÚ DE USUARIO,
   CERRAR NOTIFICACIONES
========================================================= */

document
    .getElementById(
        "topbar-user-button"
    )
    ?.addEventListener(
        "click",
        () =>
        {

            cerrarNotificacionesAdmin();

        }
    );


/* =========================================================
   CLIC FUERA
========================================================= */

document.addEventListener(
    "click",
    event =>
    {

        if (
            topbarNotifications &&
            !topbarNotifications.contains(
                event.target
            )
        ) {

            cerrarNotificacionesAdmin();

        }

    }
);


/* =========================================================
   ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    event =>
    {

        if (
            event.key ===
            "Escape"
        ) {

            cerrarNotificacionesAdmin();

        }

    }
);

/* =========================================================
   ACCIONES DE AGENCIAS RECIENTES - DASHBOARD
========================================================= */

const menusAccionAgencia =
    document.querySelectorAll(
        ".table-action-menu"
    );


/* =========================================================
   CERRAR MENÚS
========================================================= */

function cerrarMenusAccionAgencia(
    excepcion = null
) {

    menusAccionAgencia.forEach(
        contenedor =>
        {

            if (
                excepcion &&
                contenedor ===
                    excepcion
            ) {

                return;

            }


            contenedor.classList.remove(
                "open"
            );


            const boton =
                contenedor.querySelector(
                    "[data-agency-action-button]"
                );


            const menu =
                contenedor.querySelector(
                    "[data-agency-action-menu]"
                );


            boton?.setAttribute(
                "aria-expanded",
                "false"
            );


            menu?.setAttribute(
                "aria-hidden",
                "true"
            );

        }
    );

}


/* =========================================================
   CONFIGURAR CADA MENÚ
========================================================= */

menusAccionAgencia.forEach(
    contenedor =>
    {

        const boton =
            contenedor.querySelector(
                "[data-agency-action-button]"
            );


        const menu =
            contenedor.querySelector(
                "[data-agency-action-menu]"
            );


        if (
            !boton ||
            !menu
        ) {

            return;

        }


        boton.addEventListener(
            "click",
            event =>
            {

                event.preventDefault();

                event.stopPropagation();


                const estabaAbierto =
                    contenedor
                        .classList
                        .contains(
                            "open"
                        );


                /*
                 * Cerramos primero cualquier otro menú
                 * de otra agencia.
                 */

                cerrarMenusAccionAgencia(
                    contenedor
                );


                /*
                 * Cerramos desplegables superiores
                 * para evitar tener varios menús
                 * abiertos al mismo tiempo.
                 */

                if (
                    typeof cerrarAccionesRapidas ===
                        "function"
                ) {

                    cerrarAccionesRapidas();

                }


                if (
                    typeof cerrarNotificacionesAdmin ===
                        "function"
                ) {

                    cerrarNotificacionesAdmin();

                }


                const topbarUsuario =
                    document.querySelector(
                        ".topbar-user"
                    );


                const topbarUsuarioBoton =
                    document.getElementById(
                        "topbar-user-button"
                    );


                topbarUsuario
                    ?.classList
                    .remove(
                        "open"
                    );


                topbarUsuarioBoton
                    ?.setAttribute(
                        "aria-expanded",
                        "false"
                    );


                if (
                    estabaAbierto
                ) {

                    contenedor.classList.remove(
                        "open"
                    );


                    boton.setAttribute(
                        "aria-expanded",
                        "false"
                    );


                    menu.setAttribute(
                        "aria-hidden",
                        "true"
                    );


                    return;

                }


                contenedor.classList.add(
                    "open"
                );


                boton.setAttribute(
                    "aria-expanded",
                    "true"
                );


                menu.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }
        );


        menu.addEventListener(
            "click",
            event =>
            {

                event.stopPropagation();

            }
        );

    }
);


/* =========================================================
   CERRAR AL HACER CLIC FUERA
========================================================= */

document.addEventListener(
    "click",
    event =>
    {

        const dentroDeMenu =
            event.target.closest(
                ".table-action-menu"
            );


        if (
            !dentroDeMenu
        ) {

            cerrarMenusAccionAgencia();

        }

    }
);


/* =========================================================
   CERRAR CON ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    event =>
    {

        if (
            event.key ===
            "Escape"
        ) {

            cerrarMenusAccionAgencia();

        }

    }
);