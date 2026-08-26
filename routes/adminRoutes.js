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

    actualizarUsuario


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

module.exports = router;