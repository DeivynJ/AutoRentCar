const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   OBTENER TEXTO DE CATEGORÍA
========================================================= */

function obtenerCategoriaTexto(
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


    return categorias[categoria] ||
        "Sin categoría";

}


/* =========================================================
   OBTENER CATÁLOGO PÚBLICO DE UNA AGENCIA
========================================================= */

async function obtenerCatalogoAgencia(
    req,
    res
) {

    let conexion;


    try {

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
                .json(
                    {

                        ok:
                            false,

                        mensaje:
                            "La agencia indicada no es válida."

                    }
                );

        }


        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           AGENCIA
        ------------------------------------------------- */

        const agenciaResultado =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    slug,
                    correo,
                    telefono,
                    whatsapp,
                    direccion,
                    ciudad,
                    provincia,
                    pais,
                    logo,
                    color_primario,
                    color_secundario,
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
            agenciaResultado.length === 0
        ) {

            return res
                .status(404)
                .json(
                    {

                        ok:
                            false,

                        mensaje:
                            "Agencia no encontrada."

                    }
                );

        }


        const agencia =
            agenciaResultado[0];


        /* -------------------------------------------------
           ESTADO DE LA AGENCIA
        ------------------------------------------------- */

        const estadosAgenciaPermitidos =
        [
            "prueba",
            "activa"
        ];


        if (
            !estadosAgenciaPermitidos.includes(
                agencia.estado
            )
        ) {

            return res
                .status(403)
                .json(
                    {

                        ok:
                            false,

                        mensaje:
                            "El catálogo de esta agencia no está disponible actualmente."

                    }
                );

        }


        /* -------------------------------------------------
           SUSCRIPCIÓN ACTUAL
        ------------------------------------------------- */

        const suscripcionResultado =
            await conexion.query(
                `
                SELECT

                    s.id,

                    s.estado,

                    s.fecha_inicio,

                    s.fecha_fin,

                    p.id
                        AS plan_id,

                    p.nombre
                        AS plan_nombre

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
                    agencia.id
                ]
            );


        if (
            suscripcionResultado.length === 0
        ) {

            return res
                .status(403)
                .json(
                    {

                        ok:
                            false,

                        mensaje:
                            "El catálogo de esta agencia no está disponible actualmente."

                    }
                );

        }


        const suscripcion =
            suscripcionResultado[0];


        const estadosSuscripcionPermitidos =
        [
            "prueba",
            "activa"
        ];


        if (
            !estadosSuscripcionPermitidos.includes(
                suscripcion.estado
            )
        ) {

            return res
                .status(403)
                .json(
                    {

                        ok:
                            false,

                        mensaje:
                            "El catálogo de esta agencia no está disponible actualmente."

                    }
                );

        }


        /* -------------------------------------------------
           MODELOS Y UNIDADES
        ------------------------------------------------- */

        const modelosResultado =
            await conexion.query(
                `
                SELECT

                    m.id,

                    m.nombre,

                    m.marca,

                    m.anio,

                    m.categoria,

                    m.precio_diario,

                    m.transmision,

                    m.combustible,

                    m.pasajeros,

                    m.puertas,

                    m.equipaje,

                    m.aire_acondicionado,

                    m.destacado,

                    m.etiqueta,

                    m.descripcion,

                    m.imagen,

                    COUNT(
    CASE

        WHEN v.estado NOT IN (
            'mantenimiento',
            'inactivo'
        )
            THEN 1

        ELSE NULL

    END
) AS unidades_activas,
                    COUNT(
                        CASE

                            WHEN v.estado = 'disponible'
                                THEN 1

                            ELSE NULL

                        END
                    ) AS unidades_disponibles

                FROM modelos_vehiculos m

                LEFT JOIN vehiculos v

                    ON v.modelo_id =
                        m.id

                    AND v.agencia_id =
                        m.agencia_id

                WHERE
                    m.agencia_id = ?

                    AND m.estado = 'activo'

                GROUP BY

                    m.id,
                    m.nombre,
                    m.marca,
                    m.anio,
                    m.categoria,
                    m.precio_diario,
                    m.transmision,
                    m.combustible,
                    m.pasajeros,
                    m.puertas,
                    m.equipaje,
                    m.aire_acondicionado,
                    m.destacado,
                    m.etiqueta,
                    m.descripcion,
                    m.imagen

                HAVING
                unidades_disponibles > 0

                ORDER BY

                    m.destacado DESC,

                    m.marca ASC,

                    m.nombre ASC
                `,
                [
                    agencia.id
                ]
            );


        /* -------------------------------------------------
           ADAPTAR DATOS A LA FASE 1
        ------------------------------------------------- */

        const vehiculos =
            modelosResultado.map(
                modelo =>
                {

                    const categoriaTexto =
                        obtenerCategoriaTexto(
                            modelo.categoria
                        );


                    return {

                        id:
                            Number(
                                modelo.id
                            ),

                        nombre:
                            `${modelo.marca} ${modelo.nombre}`.trim(),

                        modelo:
                            modelo.nombre,

                        marca:
                            modelo.marca,

                        anio:
                            modelo.anio
                                ? Number(
                                    modelo.anio
                                )
                                : null,

                        categoria:
                            categoriaTexto,

                        categoriaTexto,

                        precio:
                            Number(
                                modelo.precio_diario ||
                                0
                            ),

                        cantidadTotal:
                            Number(
                                modelo.unidades_activas ||
                                0
                            ),

                        disponibles:
                            Number(
                                modelo.unidades_disponibles ||
                                0
                            ),

                        transmision:
                            modelo.transmision ||
                            "",

                        combustible:
                            modelo.combustible ||
                            "",

                        pasajeros:
                            Number(
                                modelo.pasajeros ||
                                0
                            ),

                        puertas:
                            Number(
                                modelo.puertas ||
                                0
                            ),

                        equipaje:
                            Number(
                                modelo.equipaje ||
                                0
                            ),

                        aire:
                            Number(
                                modelo.aire_acondicionado
                            ) === 1,

                        destacado:
                            Number(
                                modelo.destacado
                            ) === 1,

                        etiqueta:
                            modelo.etiqueta ||
                            "",

                        descripcion:
                            modelo.descripcion ||
                            "",

                        imagen:
                            modelo.imagen ||
                            ""

                    };

                }
            );


        /*
         * Durante el desarrollo evitamos que el navegador
         * conserve una respuesta antigua de la API.
         */

        res.set(
            "Cache-Control",
            "no-store"
        );


        return res.json(
            {

                ok:
                    true,

                agencia:
                {

                    id:
                        Number(
                            agencia.id
                        ),

                    nombre:
                        agencia.nombre,

                    slug:
                        agencia.slug,

                    logo:
                        agencia.logo ||
                        "",

                    colores:
                    {

                        primario:
                            agencia.color_primario ||
                            "",

                        secundario:
                            agencia.color_secundario ||
                            ""

                    },

                    contacto:
                    {

                        correo:
                            agencia.correo ||
                            "",

                        telefono:
                            agencia.telefono ||
                            "",

                        whatsapp:
                            agencia.whatsapp ||
                            "",

                        direccion:
                            agencia.direccion ||
                            "",

                        ciudad:
                            agencia.ciudad ||
                            "",

                        provincia:
                            agencia.provincia ||
                            "",

                        pais:
                            agencia.pais ||
                            ""

                    }

                },

                catalogo:
                {

                    totalModelos:
                        vehiculos.length,

                    vehiculos

                }

            }
        );


    } catch (error) {

        console.error(
            "Error obteniendo catálogo público:",
            error
        );


        return res
            .status(500)
            .json(
                {

                    ok:
                        false,

                    mensaje:
                        "No fue posible cargar el catálogo de vehículos."

                }
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

module.exports =
{

    obtenerCatalogoAgencia

};