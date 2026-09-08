/* =========================================================
   AUTORENTCAR
   FOTO DE PERFIL DE USUARIO
========================================================= */

ALTER TABLE usuarios

    ADD COLUMN foto_perfil VARCHAR(255) NULL
    AFTER telefono;