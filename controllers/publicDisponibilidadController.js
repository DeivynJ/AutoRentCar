const {
    pool
} = require(
    "../config/database"
);


const {
    validarCantidadDisponible
} = require(
    "../services/disponibilidadService"
);


/* =========================================================
   CONSULTAR DISPONIBILIDAD PÚBLICA
========================================================= */

async function consultarDisponibilidadAgencia(
    req,
    res
) {

    let conexion;


    try {

        /* -------------------------------------------------
           SLUG DE LA AGENCIA
        ------------------------------------------------- */

        const slug =
            String(
                req.params.slug ||
                ""
            )
                .trim()
                .toLowerCase();


        if (!slug) {

            return res
                .status(400)
                .json({
                    ok:
                        false,

                    mensaje:
                        "La agencia indicada no es válida."
                });

        }


        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           AGENCIA
        ------------------------------------------------- */

        const agencias =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    slug,
                    estado

                FROM agencias

                WHERE
                    slug = ?

                LIMIT 1
                `,
                [
                    slug
                ]
            );


        if (
            agencias.length ===
            0
        ) {

            return res
                .status(404)
                .json({
                    ok:
                        false,

                    mensaje:
                        "Agencia no encontrada."
                });

        }


        const agencia =
            agencias[0];


        const estadosAgenciaPermitidos =
            new Set([
                "prueba",
                "activa"
            ]);


        if (
            !estadosAgenciaPermitidos.has(
                agencia.estado
            )
        ) {

            return res
                .status(403)
                .json({
                    ok:
                        false,

                    mensaje:
                        "Esta agencia no está disponible actualmente."
                });

        }


        /* -------------------------------------------------
           ÚLTIMA SUSCRIPCIÓN DE LA AGENCIA

           Debe estar:
           - activa o en prueba
           - dentro de su período de vigencia
        ------------------------------------------------- */

        const suscripciones =
            await conexion.query(
                `
                SELECT

                    s.id,

                    s.estado,

                    s.fecha_inicio,

                    s.fecha_fin,

                    CASE

                        WHEN

                            s.fecha_inicio <=
                                CURDATE()

                            AND

                            (
                                s.fecha_fin IS NULL

                                OR

                                s.fecha_fin >=
                                    CURDATE()
                            )

                        THEN 1

                        ELSE 0

                    END AS fecha_vigente

                FROM suscripciones s

                WHERE
                    s.agencia_id = ?

                ORDER BY
                    s.id DESC

                LIMIT 1
                `,
                [
                    agencia.id
                ]
            );


        if (
            suscripciones.length ===
            0
        ) {

            return res
                .status(403)
                .json({
                    ok:
                        false,

                    mensaje:
                        "Esta agencia no tiene una suscripción disponible."
                });

        }


        const suscripcion =
            suscripciones[0];


        const estadosSuscripcionPermitidos =
            new Set([
                "prueba",
                "activa"
            ]);


        if (
            !estadosSuscripcionPermitidos.has(
                suscripcion.estado
            ) ||
            Number(
                suscripcion.fecha_vigente
            ) !== 1
        ) {

            return res
                .status(403)
                .json({
                    ok:
                        false,

                    mensaje:
                        "Esta agencia no está disponible actualmente."
                });

        }


        /* -------------------------------------------------
           CONSULTAR MOTOR DE DISPONIBILIDAD

           IMPORTANTE:
           agenciaId sale de MariaDB utilizando el slug.

           No se acepta agenciaId desde query/body.
        ------------------------------------------------- */

        const resultado =
            await validarCantidadDisponible({

                agenciaId:
                    agencia.id,

                modeloId:
                    req.query.modeloId,

                cantidad:
                   req.query.cantidad,

                fechaRecogida:
                    req.query.fechaRecogida,

                horaRecogida:
                    req.query.horaRecogida,

                fechaEntrega:
                    req.query.fechaEntrega,

                horaEntrega:
                    req.query.horaEntrega,

                conexion

            });


        /* -------------------------------------------------
           RESPUESTA PÚBLICA

           No exponemos:
           - IDs de unidades físicas
           - códigos internos
           - placas
           - VIN
           - reservas existentes
           - cantidad comprometida interna
        ------------------------------------------------- */

        return res.json({

            ok:
                true,


            agencia: {

                nombre:
                    agencia.nombre,

                slug:
                    agencia.slug

            },


            modelo: {

                id:
                    resultado.modelo.id,

                nombre:
                    resultado.modelo.nombre,

                marca:
                    resultado.modelo.marca

            },


            periodo: {

                fechaRecogida:
                    resultado.periodo
                        .fechaRecogida,

                horaRecogida:
                    resultado.periodo
                        .horaRecogida,

                fechaEntrega:
                    resultado.periodo
                        .fechaEntrega,

                horaEntrega:
                    resultado.periodo
                        .horaEntrega

            },


            cantidadSolicitada:
                resultado
                    .cantidadSolicitada,


            cantidadDisponible:
                resultado
                    .cantidadDisponible,


            suficiente:
                resultado
                    .suficiente

        });


    } catch (error) {

        /* -------------------------------------------------
           ERRORES CONTROLADOS DEL MOTOR
        ------------------------------------------------- */

        if (
            error.codigo
        ) {

            return res
                .status(
                    error.status ||
                    400
                )
                .json({

                    ok:
                        false,

                    codigo:
                        error.codigo,

                    mensaje:
                        error.message

                });

        }


        console.error(
            "Error consultando disponibilidad pública:",
            error
        );


        return res
            .status(500)
            .json({

                ok:
                    false,

                mensaje:
                    "No fue posible consultar la disponibilidad."

            });


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

    consultarDisponibilidadAgencia

};