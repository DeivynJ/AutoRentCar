/* =========================================================
   AUTORENTCAR
   007 - NOTIFICACIONES DEL PANEL DE AGENCIA
========================================================= */


/* =========================================================
   NOTIFICACIONES
========================================================= */

CREATE TABLE IF NOT EXISTS notificaciones_agencia (

    id INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,

    agencia_id INT UNSIGNED
        NOT NULL,

    categoria VARCHAR(50)
        NOT NULL,

    tipo VARCHAR(80)
        NOT NULL,

    titulo VARCHAR(180)
        NOT NULL,

    mensaje VARCHAR(500)
        NOT NULL,

    destino_url VARCHAR(255)
        NULL,

    entidad_tipo VARCHAR(80)
        NULL,

    entidad_id INT UNSIGNED
        NULL,

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


    CONSTRAINT fk_notificaciones_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias(
            id
        )

        ON UPDATE CASCADE
        ON DELETE CASCADE,


    INDEX idx_notificaciones_agencia_fecha (
        agencia_id,
        fecha_creacion
    ),

    INDEX idx_notificaciones_agencia_categoria (
        agencia_id,
        categoria
    ),

    INDEX idx_notificaciones_agencia_entidad (
        agencia_id,
        entidad_tipo,
        entidad_id
    )

);


/* =========================================================
   LECTURAS POR USUARIO

   Una notificación pertenece a una agencia, pero cada
   usuario de esa agencia mantiene su propio estado
   de lectura.

   Esto evita que:
   Administrador A abre una notificación
   ↓
   desaparezca como nueva para Administrador B.
========================================================= */

CREATE TABLE IF NOT EXISTS notificacion_lecturas_agencia (

    id BIGINT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,

    notificacion_id INT UNSIGNED
        NOT NULL,

    usuario_id INT UNSIGNED
        NOT NULL,

    fecha_lectura TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_notificacion_lectura_usuario

        UNIQUE (
            notificacion_id,
            usuario_id
        ),


    CONSTRAINT fk_notificacion_lecturas_notificacion

        FOREIGN KEY (
            notificacion_id
        )

        REFERENCES notificaciones_agencia(
            id
        )

        ON UPDATE CASCADE
        ON DELETE CASCADE,


    CONSTRAINT fk_notificacion_lecturas_usuario

        FOREIGN KEY (
            usuario_id
        )

        REFERENCES usuarios(
            id
        )

        ON UPDATE CASCADE
        ON DELETE CASCADE,


    INDEX idx_notificacion_lecturas_usuario (
        usuario_id
    )

);