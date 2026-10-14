const express = require("express");

const {
    mostrarLogin,
    procesarLogin,
    cerrarSesion
} = require(
    "../controllers/authController"
);

const {
    validarOrigenMismaAplicacion
} = require(
    "../middleware/validarOrigenMiddleware"
);

const router = express.Router();

router.get(
    "/login",
    mostrarLogin
);

router.post(
    "/login",
    validarOrigenMismaAplicacion,
    procesarLogin
);

router.post(
    "/logout",
    validarOrigenMismaAplicacion,
    cerrarSesion
);

module.exports = router;