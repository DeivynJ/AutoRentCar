/* =========================================================
   AUTORENTCAR
   014 - NOTIFICACIONES DEL SUPERADMIN
========================================================= */


/* =========================================================
   NOTIFICACIONES DEL SUPERADMIN
========================================================= */

CREATE TABLE IF NOT EXISTS notificaciones_admin (

    id INT(10) UNSIGNED
        NOT NULL
        AUTO_INCREMENT,

    categoria VARCHAR(50)
        NOT NULL,

    tipo VARCHAR(80)
        NOT NULL,

    titulo VARCHAR(180)
        NOT NULL,

    mensaje VARCHAR(500)
        NOT NULL,

    destino_url VARCHAR(255)
        DEFAULT NULL,

    entidad_tipo VARCHAR(80)
        DEFAULT NULL,

    entidad_id INT(10) UNSIGNED
        DEFAULT NULL,

    nivel ENUM(
        'info',
        'exito',
        'advertencia',
        'critica'
    )
        NOT NULL
        DEFAULT 'info',

    fecha_creacion TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    PRIMARY KEY (
        id
    ),


    KEY idx_notificaciones_admin_fecha (
        fecha_creacion
    ),


    KEY idx_notificaciones_admin_categoria (
        categoria
    ),


    KEY idx_notificaciones_admin_entidad (
        entidad_tipo,
        entidad_id
    )

)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


/* =========================================================
   LECTURAS DE NOTIFICACIONES DEL SUPERADMIN
========================================================= */

CREATE TABLE IF NOT EXISTS notificacion_lecturas_admin (

    id BIGINT(20) UNSIGNED
        NOT NULL
        AUTO_INCREMENT,

    notificacion_id INT(10) UNSIGNED
        NOT NULL,

    usuario_id INT(10) UNSIGNED
        NOT NULL,

    fecha_lectura TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    PRIMARY KEY (
        id
    ),


    UNIQUE KEY uq_notificacion_admin_lectura_usuario (
        notificacion_id,
        usuario_id
    ),


    KEY idx_notificacion_lecturas_admin_usuario (
        usuario_id
    ),


    CONSTRAINT fk_notificacion_lecturas_admin_notificacion

        FOREIGN KEY (
            notificacion_id
        )

        REFERENCES notificaciones_admin (
            id
        )

        ON DELETE CASCADE
        ON UPDATE CASCADE,


    CONSTRAINT fk_notificacion_lecturas_admin_usuario

        FOREIGN KEY (
            usuario_id
        )

        REFERENCES usuarios (
            id
        )

        ON DELETE CASCADE
        ON UPDATE CASCADE

)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;