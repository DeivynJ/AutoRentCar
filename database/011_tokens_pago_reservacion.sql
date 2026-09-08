/* =========================================================
   AUTORENTCAR
   MIGRACIÓN 011
   TOKENS SEGUROS PARA PAGO DE RESERVACIONES
========================================================= */

CREATE TABLE tokens_pago_reservacion (

    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    agencia_id INT UNSIGNED NOT NULL,

    reservacion_id INT UNSIGNED NOT NULL,

    token_hash CHAR(64) NOT NULL,

    fecha_expiracion DATETIME NOT NULL,

    fecha_revocacion DATETIME NULL,

    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_tokens_pago_token_hash (
        token_hash
    ),

    KEY idx_tokens_pago_reservacion (
        reservacion_id
    ),

    KEY idx_tokens_pago_agencia_reservacion (
        agencia_id,
        reservacion_id
    ),

    KEY idx_tokens_pago_expiracion (
        fecha_expiracion
    ),

    CONSTRAINT fk_tokens_pago_agencia
        FOREIGN KEY (agencia_id)
        REFERENCES agencias(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_tokens_pago_reservacion
        FOREIGN KEY (reservacion_id)
        REFERENCES reservaciones(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE

);