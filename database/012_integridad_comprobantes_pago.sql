/* =========================================================
   INTEGRIDAD CRIPTOGRÁFICA DE COMPROBANTES DE PAGO
========================================================= */

ALTER TABLE pagos_reservacion

    ADD COLUMN comprobante_hash_sha256 CHAR(64) NULL
    AFTER comprobante_tamano;