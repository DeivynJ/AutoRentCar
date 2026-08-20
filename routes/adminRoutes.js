const express = require("express");

const {
    mostrarDashboard
} = require(
    "../controllers/adminController"
);

const {
    requerirSuperadmin
} = require(
    "../middleware/authMiddleware"
);

const router = express.Router();

/* =========================================================
   DASHBOARD SUPERADMINISTRADOR
========================================================= */

router.get(
    "/admin",
    requerirSuperadmin,
    mostrarDashboard
);

module.exports = router;
