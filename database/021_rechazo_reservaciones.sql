/* =========================================================
   AUTORENTCAR
   021 - MOTIVO Y AUDITORÍA DE RECHAZO DE RESERVACIONES
========================================================= */

ALTER TABLE reservaciones

ADD COLUMN IF NOT EXISTS motivo_rechazo
    TEXT
    NULL
    AFTER estado,

ADD COLUMN IF NOT EXISTS rechazada_por_usuario_id
    INT UNSIGNED
    NULL
    AFTER motivo_rechazo,

ADD COLUMN IF NOT EXISTS fecha_rechazo
    DATETIME
    NULL
    AFTER rechazada_por_usuario_id;