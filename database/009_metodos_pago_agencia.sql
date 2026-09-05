/* =========================================================
   AUTORENTCAR
   009 - MÉTODOS DE PAGO POR AGENCIA
========================================================= */


/* =========================================================
   MÉTODOS DE PAGO

   Cada agencia administra exclusivamente sus propios
   métodos de pago.

   Ejemplos iniciales:

   - Transferencia bancaria
   - Depósito bancario
   - Efectivo
   - Otro

   Los datos bancarios pertenecen a la agencia y serán
   mostrados al cliente únicamente dentro del flujo
   autorizado de pago.
========================================================= */

CREATE TABLE IF NOT EXISTS metodos_pago_agencia (

    id INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,


    agencia_id INT UNSIGNED
        NOT NULL,


    /*
     * Código interno estable dentro de la agencia.
     *
     * Ejemplos:
     * transferencia-popular
     * deposito-reservas
     */

    codigo VARCHAR(80)
        NOT NULL,


    nombre VARCHAR(150)
        NOT NULL,


    tipo ENUM(
        'transferencia',
        'deposito',
        'efectivo',
        'otro'
    )
        NOT NULL,


    /* -----------------------------------------------------
       DATOS BANCARIOS

       Pueden ser NULL porque no todos los métodos
       necesariamente utilizan una cuenta bancaria.
    ----------------------------------------------------- */

    banco VARCHAR(150)
        NULL,


    titular VARCHAR(180)
        NULL,


    tipo_cuenta VARCHAR(80)
        NULL,


    numero_cuenta VARCHAR(120)
        NULL,


    moneda CHAR(3)
        NOT NULL
        DEFAULT 'USD',


    instrucciones TEXT
        NULL,


    /*
     * Transferencias y depósitos normalmente requerirán
     * comprobante.

     * Lo dejamos configurable para no imponerlo a todos
     * los métodos.
    */

    requiere_comprobante TINYINT(1)
        NOT NULL
        DEFAULT 1,


    /*
     * Permite desactivar un método sin eliminarlo.
     */

    activo TINYINT(1)
        NOT NULL
        DEFAULT 1,


    /*
     * Orden en el que aparecerán los métodos
     * en la futura página de pago.
    */

    orden SMALLINT UNSIGNED
        NOT NULL
        DEFAULT 0,


    fecha_creacion TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    fecha_actualizacion TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT uq_metodo_pago_agencia_codigo

        UNIQUE (
            agencia_id,
            codigo
        ),


    CONSTRAINT fk_metodos_pago_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias(
            id
        )

        ON UPDATE CASCADE
        ON DELETE CASCADE,


    INDEX idx_metodos_pago_agencia_activo (

        agencia_id,
        activo,
        orden

    )

);