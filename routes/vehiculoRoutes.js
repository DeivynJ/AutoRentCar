const express =
    require(
        "express"
    );


const {

    mostrarVehiculosAgencia

} = require(
    "../controllers/vehiculoController"
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
   VEHÍCULOS DE AGENCIA
========================================================= */

router.get(
    "/admin/agencias/:id/vehiculos",
    mostrarVehiculosAgencia
);


/* =========================================================
   EXPORTACIÓN
========================================================= */

module.exports =
    router;