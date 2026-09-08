/* =========================================================
   AUTORENTCAR
   015 - CLAVE ÚNICA DE EVENTOS ADMINISTRATIVOS
========================================================= */

ALTER TABLE notificaciones_admin

    ADD COLUMN clave_evento VARCHAR(190)
        DEFAULT NULL
        AFTER tipo;


CREATE UNIQUE INDEX uq_notificaciones_admin_clave_evento
ON notificaciones_admin (
    clave_evento
);