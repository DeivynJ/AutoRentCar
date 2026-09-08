const express = require("express");


const {

    mostrarDashboard,

    exportarResumenDashboard,

    mostrarUsuariosGlobales,

    mostrarConfiguracionAdmin,

    actualizarPerfilAdmin,

     actualizarPasswordAdmin,

    mostrarAgencias,

    mostrarNuevaAgencia,

    crearAgencia,

    mostrarDetalleAgencia,

    mostrarEditarAgencia,

    actualizarAgencia,

    mostrarUsuariosAgencia,

    mostrarNuevoUsuario,

    crearUsuarioAgencia,

    mostrarEditarUsuario,

    actualizarUsuario,

    mostrarSuscripciones,

    mostrarSuscripcionAgencia,
    
    actualizarSuscripcionAgencia,

     mostrarPlanes,
     
     mostrarNuevoPlan,
      
      crearPlan,

      mostrarEditarPlan,
      
      actualizarPlan


} = require(
    "../controllers/adminController"
);


const {

    requerirSuperadmin

} = require(
    "../middleware/authMiddleware"
);

const {

    cargarNotificacionesAdmin

} = require(
    "../middleware/notificacionesAdminMiddleware"
);

const {

    abrirNotificacionAdmin

} = require(
    "../controllers/adminNotificacionController"
);

const {

    subirLogoAgencia

} = require(
    "../middleware/uploadMiddleware"
);

const {

    subirFotoPerfil

} = require(
    "../middleware/uploadFotoPerfilMiddleware"
);


const router = express.Router();


/* ========================================================= 
   PROTECCIÓN DE RUTAS SUPERADMIN
========================================================= */ 
 
router.use(
    "/admin",
    requerirSuperadmin
);

router.use(
    "/admin",
    cargarNotificacionesAdmin
);


/* =========================================================
   DASHBOARD
========================================================= */


router.get(
    "/admin",
    mostrarDashboard
);

router.get(
    "/admin/exportar-resumen",
    exportarResumenDashboard
);

/* =========================================================
   USUARIOS GLOBALES
========================================================= */

router.get(
    "/admin/usuarios",
    mostrarUsuariosGlobales
);

/* =========================================================
   CONFIGURACIÓN DEL SUPERADMIN
========================================================= */

router.get(
    "/admin/configuracion",
    mostrarConfiguracionAdmin
);


router.post(
    "/admin/configuracion/perfil",
    subirFotoPerfil,
    actualizarPerfilAdmin
);


router.post(
    "/admin/configuracion/password",
    actualizarPasswordAdmin
);

/* =========================================================
   NOTIFICACIONES DEL SUPERADMIN
========================================================= */

router.post(
    "/admin/notificaciones/:notificacionId/abrir",
    abrirNotificacionAdmin
);


/* =========================================================
   GESTIÓN DE AGENCIAS
========================================================= */


router.get(
    "/admin/agencias",
    mostrarAgencias
);


router.get(
    "/admin/agencias/nueva",
    mostrarNuevaAgencia
);


router.post(
    "/admin/agencias/nueva",
    subirLogoAgencia,
    crearAgencia
);



/* =========================================================
   DETALLE DE AGENCIA
========================================================= */


router.get(
    "/admin/agencias/:id",
    mostrarDetalleAgencia
);

router.get(
    "/admin/agencias/:id/editar",
    mostrarEditarAgencia
);


router.post(
    "/admin/agencias/:id/editar",
    subirLogoAgencia,
    actualizarAgencia
);

/* =========================================================
   USUARIOS DE AGENCIA
========================================================= */


router.get(
    "/admin/agencias/:id/usuarios",
    mostrarUsuariosAgencia
);

router.get(
    "/admin/agencias/:id/usuarios/nuevo",
    mostrarNuevoUsuario
);

router.post(
    "/admin/agencias/:id/usuarios/nuevo",
    crearUsuarioAgencia
);

router.get(
    "/admin/agencias/:id/usuarios/:usuarioId/editar",
    mostrarEditarUsuario
);


router.post(
    "/admin/agencias/:id/usuarios/:usuarioId/editar",
    actualizarUsuario
);

/* =========================================================
   SUSCRIPCIONES
========================================================= */

router.get(
    "/admin/suscripciones",
    mostrarSuscripciones
);

router.get(
    "/admin/agencias/:id/suscripcion",
    mostrarSuscripcionAgencia
);


router.post(
    "/admin/agencias/:id/suscripcion",
    actualizarSuscripcionAgencia
);

/* =========================================================
   PLANES
========================================================= */

router.get(
    "/admin/planes",
    mostrarPlanes
);

router.get(
    "/admin/planes/nuevo",
    mostrarNuevoPlan
);


router.post(
    "/admin/planes/nuevo",
    crearPlan
);

router.get(
    "/admin/planes/:id/editar",
    mostrarEditarPlan
);


router.post(
    "/admin/planes/:id/editar",
    actualizarPlan
);

module.exports = router;

