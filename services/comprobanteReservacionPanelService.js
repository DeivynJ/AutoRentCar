/* =========================================================
   AUTORENTCAR
   DATOS DE COMPROBANTE DE RESERVACIÓN PARA EL PANEL
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorComprobanteReservacion(
    codigo,
    mensaje,
    status = 400
) {

    const error =
        new Error(
            mensaje
        );


    error.codigo =
        codigo;


    error.status =
        status;


    return error;

}


/* =========================================================
   VALIDAR IDENTIFICADOR
========================================================= */

function validarId(
    valor,
    nombre
) {

    const id =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            id
        ) ||
        id <= 0
    ) {

        throw crearErrorComprobanteReservacion(
            "ID_INVALIDO",
            `${nombre} no es válido.`,
            400
        );

    }


    return id;

}


/* =========================================================
   TEXTO DE ESTADO PARA EL COMPROBANTE
========================================================= */

function obtenerTextoEstadoComprobante(
    estado
) {

    const estados =
    {

        pendiente:
            "Pendiente de confirmación",

        pendiente_pago:
            "Pendiente de pago",

        confirmada:
            "Confirmada",

        en_curso:
            "Alquiler en curso",

        finalizada:
            "Finalizada",

        rechazada:
            "Rechazada",

        cancelada:
            "Cancelada"

    };


    return estados[
        estado
    ] ||
    estado ||
    "Sin estado";

}

/* =========================================================
   TEXTO DE CATEGORÍA PARA EL COMPROBANTE
========================================================= */

function obtenerTextoCategoriaComprobante(
    categoria
) {

    const categorias =
    {

        economico:
            "Económico",

        gama_media:
            "Gama media",

        lujo:
            "Vehículo de lujo"

    };


    return categorias[
        categoria
    ] ||
    categoria ||
    "Sin categoría";

}


/* =========================================================
   OBTENER DATOS DEL COMPROBANTE

   IMPORTANTE:
   La reservación siempre se busca utilizando:

   reservacion_id
   +
   agencia_id

   Por tanto, una agencia no puede generar comprobantes
   pertenecientes a otra agencia.
========================================================= */

async function obtenerDatosComprobanteReservacionPanel({
    agenciaId,
    reservacionId
}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const reservacionIdSeguro =
        validarId(
            reservacionId,
            "La reservación"
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const reservaciones =
            await conexion.query(
                `
                SELECT

                    r.id,
                    r.codigo,

                    r.cantidad_vehiculos,

                    r.lugar_recogida,
                    r.lugar_entrega,

                    DATE_FORMAT(
                        r.fecha_recogida,
                        '%Y-%m-%d'
                    ) AS fecha_recogida,

                    TIME_FORMAT(
                        r.hora_recogida,
                        '%H:%i:%s'
                    ) AS hora_recogida,

                    DATE_FORMAT(
                        r.fecha_entrega,
                        '%Y-%m-%d'
                    ) AS fecha_entrega,

                    TIME_FORMAT(
                        r.hora_entrega,
                        '%H:%i:%s'
                    ) AS hora_entrega,

                    r.cliente_nombre,
                    r.cliente_documento,
                    r.cliente_correo,
                    r.cliente_telefono,
                    r.cliente_edad,
                    r.cliente_licencia,

                    r.precio_diario,
                    r.subtotal,
                    r.costo_adicionales,
                    r.descuento,
                    r.total,

                    r.codigo_promocional,
                    r.comentarios,

                    r.estado,
                    r.fecha_creacion,

                    GREATEST(
                        1,
                        DATEDIFF(
                            r.fecha_entrega,
                            r.fecha_recogida
                        )
                    ) AS dias,

                    a.id
    AS agencia_id,

a.nombre
    AS agencia_nombre,

a.slug
    AS agencia_slug,

a.logo
    AS agencia_logo,

a.color_primario
    AS agencia_color_primario,

a.color_secundario
    AS agencia_color_secundario,

a.correo
    AS agencia_correo,

a.telefono
    AS agencia_telefono,

a.whatsapp
    AS agencia_whatsapp,

a.direccion
    AS agencia_direccion,

a.ciudad
    AS agencia_ciudad,

a.provincia
    AS agencia_provincia,

a.pais
    AS agencia_pais,

                    m.id
                        AS modelo_id,

                    m.nombre
                        AS modelo_nombre,

                    m.marca
                        AS modelo_marca,

                    m.categoria
                        AS modelo_categoria,

                    m.transmision
                        AS modelo_transmision,

                    m.combustible
                        AS modelo_combustible,

                    m.pasajeros
                        AS modelo_pasajeros,

                    m.puertas
                        AS modelo_puertas,

                    m.equipaje
                        AS modelo_equipaje,

                    m.aire_acondicionado
                        AS modelo_aire,

                    m.imagen
                        AS modelo_imagen

                FROM reservaciones r

                INNER JOIN agencias a

                    ON a.id =
                        r.agencia_id

                INNER JOIN modelos_vehiculos m

                    ON m.id =
                        r.modelo_id

                    AND m.agencia_id =
                        r.agencia_id

                WHERE
                    r.id = ?

                    AND r.agencia_id = ?

                LIMIT 1
                `,
                [
                    reservacionIdSeguro,
                    agenciaIdSeguro
                ]
            );


        if (
            !reservaciones.length
        ) {

            throw crearErrorComprobanteReservacion(
                "RESERVACION_NO_ENCONTRADA",
                "La reservación no fue encontrada.",
                404
            );

        }


        const reservacion =
            reservaciones[0];


        /* -------------------------------------------------
           ADICIONALES DE LA RESERVACIÓN
        ------------------------------------------------- */

        const adicionalesFilas =
            await conexion.query(
                `
                SELECT

                    codigo,
                    nombre,

                    precio_diario,
                    cantidad_vehiculos,
                    dias,
                    costo_total

                FROM reservacion_adicionales

                WHERE
                    reservacion_id = ?

                ORDER BY
                    id ASC
                `,
                [
                    reservacion.id
                ]
            );


        const adicionales =
            adicionalesFilas.map(
                (adicional) => ({

                    codigo:
                        adicional.codigo,

                    nombre:
                        adicional.nombre,

                    precioDiario:
                        Number(
                            adicional.precio_diario ||
                            0
                        ),

                    cantidadVehiculos:
                        Number(
                            adicional.cantidad_vehiculos ||
                            0
                        ),

                    dias:
                        Number(
                            adicional.dias ||
                            0
                        ),

                    costoTotal:
                        Number(
                            adicional.costo_total ||
                            0
                        )

                })
            );


        /* -------------------------------------------------
           FORMATO COMPATIBLE CON EL COMPROBANTE PÚBLICO

           Esta estructura sigue el mismo formato que
           utiliza confirmacion.js.
        ------------------------------------------------- */

        return {

            id:
                Number(
                    reservacion.id
                ),

            codigo:
                reservacion.codigo,

            fechaRegistro:
                reservacion.fecha_creacion,

            estado:
                obtenerTextoEstadoComprobante(
                    reservacion.estado
                ),

              agencia:
            {

                id:
                    Number(
                        reservacion.agencia_id
                    ),

                nombre:
                    reservacion.agencia_nombre,

                slug:
                    reservacion.agencia_slug,

                logo:
                    reservacion.agencia_logo ||
                    "",

                colores:
                {

                    primario:
                        reservacion.agencia_color_primario ||
                        "",

                    secundario:
                        reservacion.agencia_color_secundario ||
                        ""

                },

                contacto:
                {

                    correo:
                        reservacion.agencia_correo ||
                        "",

                    telefono:
                        reservacion.agencia_telefono ||
                        "",

                    whatsapp:
                        reservacion.agencia_whatsapp ||
                        "",

                    direccion:
                        reservacion.agencia_direccion ||
                        "",

                    ciudad:
                        reservacion.agencia_ciudad ||
                        "",

                    provincia:
                        reservacion.agencia_provincia ||
                        "",

                    pais:
                        reservacion.agencia_pais ||
                        ""

                }

            },
            
            vehiculo:
            {

                id:
                    Number(
                        reservacion.modelo_id
                    ),

                nombre:
                    reservacion.modelo_nombre,

                marca:
                    reservacion.modelo_marca,

                categoria:
    reservacion.modelo_categoria,

categoriaTexto:
    obtenerTextoCategoriaComprobante(
        reservacion.modelo_categoria
    ),

                transmision:
                    reservacion.modelo_transmision,

                combustible:
                    reservacion.modelo_combustible,

                pasajeros:
                    Number(
                        reservacion.modelo_pasajeros ||
                        0
                    ),

                puertas:
                    Number(
                        reservacion.modelo_puertas ||
                        0
                    ),

                equipaje:
                    Number(
                        reservacion.modelo_equipaje ||
                        0
                    ),

                aire:
                    Boolean(
                        reservacion.modelo_aire
                    ),

                imagen:
                    reservacion.modelo_imagen ||
                    "",

                precio:
                    Number(
                        reservacion.precio_diario ||
                        0
                    )

            },

            cantidadVehiculos:
                Number(
                    reservacion.cantidad_vehiculos ||
                    1
                ),

            lugarRecogida:
                reservacion.lugar_recogida ||
                "",

            lugarEntrega:
                reservacion.lugar_entrega ||
                "",

            fechaRecogida:
                reservacion.fecha_recogida,

            horaRecogida:
                reservacion.hora_recogida,

            fechaEntrega:
                reservacion.fecha_entrega,

            horaEntrega:
                reservacion.hora_entrega,

            cliente:
            {

                nombre:
                    reservacion.cliente_nombre,

                documento:
                    reservacion.cliente_documento,

                correo:
                    reservacion.cliente_correo,

                telefono:
                    reservacion.cliente_telefono,

                edad:
                    Number(
                        reservacion.cliente_edad ||
                        0
                    ),

                licencia:
                    reservacion.cliente_licencia

            },

            comentarios:
                reservacion.comentarios ||
                "",

            adicionales,

            codigoPromocional:
                reservacion.codigo_promocional ||
                null,

            dias:
                Number(
                    reservacion.dias ||
                    1
                ),

            precioDiario:
                Number(
                    reservacion.precio_diario ||
                    0
                ),

            subtotal:
                Number(
                    reservacion.subtotal ||
                    0
                ),

            costoAdicionales:
                Number(
                    reservacion.costo_adicionales ||
                    0
                ),

            descuento:
                Number(
                    reservacion.descuento ||
                    0
                ),

            total:
                Number(
                    reservacion.total ||
                    0
                )

        };


    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    obtenerDatosComprobanteReservacionPanel

};