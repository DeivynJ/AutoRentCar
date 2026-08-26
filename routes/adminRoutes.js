const express = require("express");


const {

    mostrarDashboard,

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

    subirLogoAgencia

} = require(
    "../middleware/uploadMiddleware"
);


const router = express.Router();


/* =========================================================
   PROTECCIÓN GLOBAL ADMIN
========================================================= */


router.use(
    requerirSuperadmin
);


/* =========================================================
   DASHBOARD
========================================================= */


router.get(
    "/admin",
    mostrarDashboard
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

