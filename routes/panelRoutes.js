const express =
    require("express");


const {
    requerirUsuarioAgencia
} = require(
    "../middleware/authMiddleware"
);


const {
    cargarContextoAgencia
} = require(
    "../middleware/contextoAgenciaMiddleware"
);

const {
    cargarNotificacionesAgencia
} = require(
    "../middleware/notificacionesAgenciaMiddleware"
);


const {
    mostrarInicioPanel
} = require(
    "../controllers/panelController"
);

const {

    mostrarReservacionesPanel,

    mostrarDetalleReservacionPanel,

    confirmarReservacionPanel,

    rechazarReservacionPanel

} = require(
    "../controllers/panelReservacionController"
);

const {

    abrirNotificacionPanel

} = require(
    "../controllers/panelNotificacionController"
);

const {

    mostrarCatalogoPanel,

    mostrarNuevoModeloPanel,

    crearModeloPanel,

    mostrarEditarModeloPanel,

    actualizarModeloPanel,

} = require(
    "../controllers/panelCatalogoController"
);

const {

    mostrarUnidadesModeloPanel,

    mostrarNuevaUnidadPanel,

    crearUnidadPanel,

    mostrarEditarUnidadPanel,

    actualizarUnidadPanel

} = require(
    "../controllers/panelVehiculoController"
);

const {
    requerirGestionCatalogo
} = require(
    "../middleware/permisosPanelMiddleware"
);

const {
    subirImagenModelo
} = require(
    "../middleware/uploadVehiculoMiddleware"
);


const router =
    express.Router();


/* =========================================================
   PROTECCIÓN GLOBAL DEL PANEL DE AGENCIA
========================================================= */

router.use(
    "/panel",

    requerirUsuarioAgencia,

    cargarContextoAgencia,

    cargarNotificacionesAgencia
);


/* =========================================================
   INICIO DEL PANEL
========================================================= */

router.get(
    "/panel",
    mostrarInicioPanel
);

/* =========================================================
   RESERVACIONES
========================================================= */

router.get(
    "/panel/reservaciones",
    mostrarReservacionesPanel
);

router.get(
    "/panel/reservaciones/:reservacionId",
    mostrarDetalleReservacionPanel
);

/* =========================================================
   DECISIONES DE RESERVACIÓN
========================================================= */

router.post(
    "/panel/reservaciones/:reservacionId/confirmar",
    confirmarReservacionPanel
);


router.post(
    "/panel/reservaciones/:reservacionId/rechazar",
    rechazarReservacionPanel
);

/* =========================================================
   NOTIFICACIONES
========================================================= */

router.post(
    "/panel/notificaciones/:notificacionId/abrir",
    abrirNotificacionPanel
);

/* =========================================================
   CATÁLOGO
========================================================= */

router.get(
    "/panel/catalogo",
    mostrarCatalogoPanel
);

router.get(
    "/panel/catalogo/modelos/nuevo",
    requerirGestionCatalogo,
    mostrarNuevoModeloPanel
);


router.post(
    "/panel/catalogo/modelos/nuevo",
    requerirGestionCatalogo,
    crearModeloPanel
);


/* =========================================================
   EDITAR MODELO DEL CATÁLOGO
========================================================= */

router.get(
    "/panel/catalogo/modelos/:modeloId/editar",
    requerirGestionCatalogo,
    mostrarEditarModeloPanel
);


router.post(
    "/panel/catalogo/modelos/:modeloId/editar",
    requerirGestionCatalogo,
    subirImagenModelo,
    actualizarModeloPanel
);

/* =========================================================
   UNIDADES FÍSICAS
========================================================= */

router.get(
    "/panel/vehiculos/modelos/:modeloId/unidades",
    mostrarUnidadesModeloPanel
);


router.get(
    "/panel/vehiculos/modelos/:modeloId/unidades/nueva",
    requerirGestionCatalogo,
    mostrarNuevaUnidadPanel
);


router.post(
    "/panel/vehiculos/modelos/:modeloId/unidades/nueva",
    requerirGestionCatalogo,
    crearUnidadPanel
);

/* =========================================================
   EDITAR UNIDAD FÍSICA
========================================================= */

router.get(
    "/panel/vehiculos/modelos/:modeloId/unidades/:unidadId/editar",
    requerirGestionCatalogo,
    mostrarEditarUnidadPanel
);


router.post(
    "/panel/vehiculos/modelos/:modeloId/unidades/:unidadId/editar",
    requerirGestionCatalogo,
    actualizarUnidadPanel
);

module.exports =
    router;