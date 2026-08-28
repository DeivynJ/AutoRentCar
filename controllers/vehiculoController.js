const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   MOSTRAR VEHÍCULOS DE UNA AGENCIA
========================================================= */

async function mostrarVehiculosAgencia(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const agenciaId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de agencia inválido."
                );

        }


        /* -------------------------------------------------
           AGENCIA
        ------------------------------------------------- */

        const agenciaResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    logo,
                    estado

                FROM agencias

                WHERE id = ?

                LIMIT 1
                `,
                [
                    agenciaId
                ]
            );


        if (
            agenciaResultado.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        const agencia =
            agenciaResultado[0];


        /* -------------------------------------------------
           SUSCRIPCIÓN Y PLAN
        ------------------------------------------------- */

        const suscripcionResultado =
            await conexion.query(
                `
                SELECT

                    s.id
                        AS suscripcion_id,

                    s.estado
                        AS suscripcion_estado,

                    p.id
                        AS plan_id,

                    p.nombre
                        AS plan_nombre,

                    p.limite_vehiculos

                FROM suscripciones s

                INNER JOIN planes p
                    ON p.id = s.plan_id

                WHERE
                    s.agencia_id = ?

                ORDER BY
                    s.id DESC

                LIMIT 1
                `,
                [
                    agenciaId
                ]
            );


        const suscripcion =
            suscripcionResultado.length
                ? suscripcionResultado[0]
                : null;


        /* -------------------------------------------------
           MODELOS
        ------------------------------------------------- */

        const modelos =
            await conexion.query(
                `
                SELECT

                    m.id,

                    m.nombre,

                    m.marca,

                    m.anio,

                    m.categoria,

                    m.precio_diario,

                    m.imagen,

                    m.estado,

                    COUNT(v.id)
                        AS total_unidades,

                    SUM(
                        CASE
                            WHEN v.estado <> 'inactivo'
                                THEN 1
                            ELSE 0
                        END
                    )
                        AS unidades_activas,

                    SUM(
                        CASE
                            WHEN v.estado = 'disponible'
                                THEN 1
                            ELSE 0
                        END
                    )
                        AS disponibles

                FROM modelos_vehiculos m

                LEFT JOIN vehiculos v

                    ON v.modelo_id = m.id

                    AND v.agencia_id =
                        m.agencia_id

                WHERE
                    m.agencia_id = ?

                GROUP BY

                    m.id,

                    m.nombre,

                    m.marca,

                    m.anio,

                    m.categoria,

                    m.precio_diario,

                    m.imagen,

                    m.estado

                ORDER BY

                    CASE
                        WHEN m.estado = 'activo'
                            THEN 0
                        ELSE 1
                    END,

                    m.marca ASC,

                    m.nombre ASC
                `,
                [
                    agenciaId
                ]
            );


        /* -------------------------------------------------
           RESUMEN DE FLOTA
        ------------------------------------------------- */

        const resumenVehiculos =
            await conexion.query(
                `
                SELECT

                    COUNT(*) AS total,

                    SUM(
                        CASE
                            WHEN estado <> 'inactivo'
                                THEN 1
                            ELSE 0
                        END
                    ) AS activos,

                    SUM(
                        CASE
                            WHEN estado = 'disponible'
                                THEN 1
                            ELSE 0
                        END
                    ) AS disponibles

                FROM vehiculos

                WHERE
                    agencia_id = ?
                `,
                [
                    agenciaId
                ]
            );


        const resumenModelos =
            await conexion.query(
                `
                SELECT
                    COUNT(*) AS total

                FROM modelos_vehiculos

                WHERE
                    agencia_id = ?
                `,
                [
                    agenciaId
                ]
            );


        const totalModelos =
            Number(
                resumenModelos[0].total ||
                0
            );


        const totalUnidades =
            Number(
                resumenVehiculos[0].total ||
                0
            );


        const unidadesActivas =
            Number(
                resumenVehiculos[0].activos ||
                0
            );


        const disponibles =
            Number(
                resumenVehiculos[0].disponibles ||
                0
            );


        return res.render(
            "admin/vehiculos/index",
            {

                titulo:
                    "Vehículos",

                subtituloPagina:
                    agencia.nombre,

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia,

                suscripcion,

                modelos,

                resumen:
                {

                    modelos:
                        totalModelos,

                    unidades:
                        totalUnidades,

                    activas:
                        unidadesActivas,

                    disponibles

                }

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando vehículos:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar los vehículos."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    mostrarVehiculosAgencia

};