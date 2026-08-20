const express = require("express");

const {
    mostrarLogin,
    procesarLogin,
    cerrarSesion
} = require(
    "../controllers/authController"
);

const router = express.Router();

router.get(
    "/login",
    mostrarLogin
);

router.post(
    "/login",
    procesarLogin
);

router.post(
    "/logout",
    cerrarSesion
);

module.exports = router;