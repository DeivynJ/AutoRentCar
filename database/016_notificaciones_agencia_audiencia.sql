/* =========================================================
   AUTORENTCAR
   016 - AUDIENCIA Y DEDUPLICACIÓN DE NOTIFICACIONES AGENCIA
========================================================= */


/* =========================================================
   AMPLIAR NOTIFICACIONES DE AGENCIA
========================================================= */

ALTER TABLE notificaciones_agencia

    ADD COLUMN clave_evento VARCHAR(190)
        DEFAULT NULL
        AFTER tipo,

    ADD COLUMN audiencia ENUM(
        'todos',
        'administradores'
    )
        NOT NULL
        DEFAULT 'todos'
        AFTER nivel;


/* =========================================================
   EVITAR EVENTOS DUPLICADOS POR AGENCIA
========================================================= */

CREATE UNIQUE INDEX uq_notificaciones_agencia_evento

ON notificaciones_agencia (
    agencia_id,
    clave_evento
);