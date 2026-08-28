const express =
    require(
        "express"
    );


const {

    mostrarSucursalesAgencia,

    mostrarNuevaSucursal,

    crearSucursal,

    mostrarEditarSucursal,

    actualizarSucursal

} = require(
    "../controllers/sucursalController"
);


const {

    requerirSuperadmin

} = require(
    "../middleware/authMiddleware"
);


const router =
    express.Router();


/* =========================================================
   PROTECCIÓN
========================================================= */

router.use(
    requerirSuperadmin
);


/* =========================================================
   SUCURSALES
========================================================= */

router.get(
    "/admin/agencias/:id/sucursales",
    mostrarSucursalesAgencia
);

router.get(
    "/admin/agencias/:id/sucursales/nueva",
    mostrarNuevaSucursal
);


router.post(
    "/admin/agencias/:id/sucursales/nueva",
    crearSucursal
);

router.get(
    "/admin/agencias/:id/sucursales/:sucursalId/editar",
    mostrarEditarSucursal
);


router.post(
    "/admin/agencias/:id/sucursales/:sucursalId/editar",
    actualizarSucursal
);


/* =========================================================
   EXPORTACIÓN
========================================================= */

module.exports =
    router;