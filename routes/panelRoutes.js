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

    rechazarReservacionPanel,

    asignarUnidadReservacionPanel,

    entregarVehiculoReservacionPanel,

    registrarDevolucionReservacionPanel

} = require(
    "../controllers/panelReservacionController"
);

const {

    abrirNotificacionPanel

} = require(
    "../controllers/panelNotificacionController"
);

const {

    listarMetodosPagoPanel,
    crearMetodoPagoPanel,
    actualizarMetodoPagoPanel,
    cambiarEstadoMetodoPagoPanel

} = require(
    "../controllers/panelMetodoPagoController"
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
    requerirGestionCatalogo,
    requerirValidacionPagos,
    requerirAdministradorAgencia,
    requerirOperacionReservacion
} = require(
    "../middleware/permisosPanelMiddleware"
);

const {
    subirImagenModelo
} = require(
    "../middleware/uploadVehiculoMiddleware"
);

const {
    confirmarPagoPanel,
    rechazarPagoPanel
} = require(
    "../controllers/panelPagoController"
);

const {
    verComprobantePago
} = require(
    "../controllers/panelComprobantePagoController"
);

const {

    mostrarConfiguracionCorreoPanel,

    guardarConfiguracionCorreoPanel,

    verificarConfiguracionCorreoPanel

} = require(
    "../controllers/panelConfiguracionCorreoController"
);

const {

    mostrarConfiguracionPagosPanel,

    guardarConfiguracionPagosPanel

} = require(
    "../controllers/panelConfiguracionPagosController"
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
   ASIGNACIÓN DE UNIDADES FÍSICAS
========================================================= */

router.post(
    "/panel/reservaciones/:reservacionId/unidades/asignar",
    requerirAdministradorAgencia,
    asignarUnidadReservacionPanel
);

/* =========================================================
   ENTREGA DE VEHÍCULO
========================================================= */

router.post(
    "/panel/reservaciones/:reservacionId/entregar",
    requerirOperacionReservacion,
    entregarVehiculoReservacionPanel
);

/* =========================================================
   DEVOLUCIÓN DE VEHÍCULO
========================================================= */

router.post(
    "/panel/reservaciones/:reservacionId/devolver",
    requerirOperacionReservacion,
    registrarDevolucionReservacionPanel
);

/* =========================================================
   DECISIONES DE RESERVACIÓN
========================================================= */

router.post(
    "/panel/reservaciones/:reservacionId/confirmar",
    requerirAdministradorAgencia,
    confirmarReservacionPanel
);


router.post(
    "/panel/reservaciones/:reservacionId/rechazar",
    requerirAdministradorAgencia,
    rechazarReservacionPanel
);

/* =========================================================
   VALIDACIÓN DE PAGOS
========================================================= */

/*
 * El comprobante permanece en almacenamiento privado.
 *
 * Solo un administrador autenticado de la agencia
 * puede solicitar su visualización.
 */

router.get(
    "/panel/pagos/:pagoId/comprobante",
    requerirAdministradorAgencia,
    verComprobantePago
);


router.post(
    "/panel/pagos/:pagoId/confirmar",
    requerirValidacionPagos,
    confirmarPagoPanel
);


router.post(
    "/panel/pagos/:pagoId/rechazar",
    requerirValidacionPagos,
    rechazarPagoPanel
);

/* =========================================================
   NOTIFICACIONES
========================================================= */

router.post(
    "/panel/notificaciones/:notificacionId/abrir",
    abrirNotificacionPanel
);

/* =========================================================
   MÉTODOS DE PAGO
========================================================= */

router.get(
    "/panel/metodos-pago",
    requerirAdministradorAgencia,
    listarMetodosPagoPanel
);


router.post(
    "/panel/metodos-pago",
    requerirAdministradorAgencia,
    crearMetodoPagoPanel
);


router.post(
    "/panel/metodos-pago/:metodoId/actualizar",
    requerirAdministradorAgencia,
    actualizarMetodoPagoPanel
);


router.post(
    "/panel/metodos-pago/:metodoId/estado",
    requerirAdministradorAgencia,
    cambiarEstadoMetodoPagoPanel
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

/* =========================================================
   CONFIGURACIÓN DE CORREO AUTOMÁTICO
========================================================= */

router.get(
    "/panel/configuracion/correo",
    requerirAdministradorAgencia,
    mostrarConfiguracionCorreoPanel
);


router.post(
    "/panel/configuracion/correo",
    requerirAdministradorAgencia,
    guardarConfiguracionCorreoPanel
);


router.post(
    "/panel/configuracion/correo/verificar",
    requerirAdministradorAgencia,
    verificarConfiguracionCorreoPanel
);

/* =========================================================
   CONFIGURACIÓN DE PAGOS Y ANTICIPOS
========================================================= */

router.get(
    "/panel/configuracion/pagos",
    requerirAdministradorAgencia,
    mostrarConfiguracionPagosPanel
);


router.post(
    "/panel/configuracion/pagos",
    requerirAdministradorAgencia,
    guardarConfiguracionPagosPanel
);

module.exports =
    router;