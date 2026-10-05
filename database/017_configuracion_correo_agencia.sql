/* =========================================================
   AUTORENTCAR
   017 - CONFIGURACIÓN DE CORREO POR AGENCIA
========================================================= */


/* =========================================================
   CONFIGURACIÓN SMTP INDEPENDIENTE POR AGENCIA

   Cada agencia dispone de una única configuración SMTP.

   Las credenciales sensibles son almacenadas cifradas
   mediante el mecanismo utilizado por AutoRentCar.
========================================================= */

CREATE TABLE IF NOT EXISTS `configuracion_correo_agencia` (

    `id` INT(10) UNSIGNED
        NOT NULL
        AUTO_INCREMENT,

    `agencia_id` INT(10) UNSIGNED
        NOT NULL,

    `proveedor` VARCHAR(30)
        NOT NULL
        DEFAULT 'gmail',

    `nombre_remitente` VARCHAR(150)
        NOT NULL,

    `correo_remitente` VARCHAR(150)
        NOT NULL,

    `smtp_host` VARCHAR(150)
        NOT NULL,

    `smtp_puerto` SMALLINT(5) UNSIGNED
        NOT NULL,

    `smtp_secure` TINYINT(1)
        NOT NULL
        DEFAULT 1,

    `smtp_usuario` VARCHAR(150)
        NOT NULL,

    `smtp_clave_cifrada` TEXT
        NOT NULL,

    `smtp_iv` VARCHAR(100)
        NOT NULL,

    `smtp_auth_tag` VARCHAR(100)
        NOT NULL,

    `activo` TINYINT(1)
        NOT NULL
        DEFAULT 1,

    `verificado` TINYINT(1)
        NOT NULL
        DEFAULT 0,

    `fecha_verificacion` DATETIME
        DEFAULT NULL,

    `fecha_creacion` TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    `fecha_actualizacion` TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    UNIQUE KEY `uk_configuracion_correo_agencia` (
        `agencia_id`
    ),

    CONSTRAINT `fk_configuracion_correo_agencia_agencia`
        FOREIGN KEY (`agencia_id`)
        REFERENCES `agencias` (`id`)
        ON DELETE CASCADE

)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;