const express =
    require(
        "express"
    );


const {

    mostrarVehiculosAgencia,

    mostrarNuevoModelo,

    crearModelo,

    mostrarNuevaUnidad,

    crearUnidad,

    mostrarUnidadesModelo,

    mostrarEditarUnidad,

    actualizarUnidad

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

router.get(
    "/admin/agencias/:id/vehiculos/modelos/nuevo",
    mostrarNuevoModelo
);


router.post(
    "/admin/agencias/:id/vehiculos/modelos/nuevo",
    crearModelo
);

router.get(
    "/admin/agencias/:id/vehiculos/modelos/:modeloId/unidades/nueva",
    mostrarNuevaUnidad
);


router.post(
    "/admin/agencias/:id/vehiculos/modelos/:modeloId/unidades/nueva",
    crearUnidad
);

router.get(
    "/admin/agencias/:id/vehiculos/modelos/:modeloId/unidades",
    mostrarUnidadesModelo
);


router.get(
    "/admin/agencias/:id/vehiculos/modelos/:modeloId/unidades/:unidadId/editar",
    mostrarEditarUnidad
);


router.post(
    "/admin/agencias/:id/vehiculos/modelos/:modeloId/unidades/:unidadId/editar",
    actualizarUnidad
);

/* =========================================================
   EXPORTACIÓN
========================================================= */

module.exports =
    router;