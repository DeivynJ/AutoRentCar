/* =========================================================
   018 - BLOQUEO TEMPORAL DE INICIO DE SESIÓN
========================================================= */

ALTER TABLE usuarios
    ADD COLUMN bloqueado_hasta DATETIME NULL
    AFTER intentos_fallidos;