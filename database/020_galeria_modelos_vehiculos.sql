/* =========================================================
   AUTORENTCAR / AVYNEXO
   GALERÍA DE IMÁGENES DE MODELOS DE VEHÍCULOS
========================================================= */

USE autorentcar;


/* =========================================================
   IMÁGENES SECUNDARIAS DEL MODELO
========================================================= */

CREATE TABLE IF NOT EXISTS modelo_vehiculo_imagenes (

    id INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,

    agencia_id INT UNSIGNED
        NOT NULL,

    modelo_id INT UNSIGNED
        NOT NULL,

    imagen VARCHAR(255)
        NOT NULL,

    orden INT UNSIGNED
        NOT NULL
        DEFAULT 0,

    fecha_creacion TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_modelo_vehiculo_imagen_agencia
        FOREIGN KEY (
            agencia_id
        )
        REFERENCES agencias(
            id
        )
        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    CONSTRAINT fk_modelo_vehiculo_imagen_modelo
        FOREIGN KEY (
            modelo_id
        )
        REFERENCES modelos_vehiculos(
            id
        )
        ON UPDATE CASCADE
        ON DELETE CASCADE,


    INDEX idx_modelo_vehiculo_imagen_agencia_modelo (
        agencia_id,
        modelo_id
    ),

    INDEX idx_modelo_vehiculo_imagen_orden (
        modelo_id,
        orden
    )

);