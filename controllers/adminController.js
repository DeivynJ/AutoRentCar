const fs =
    require("fs/promises");

const path =
    require("path");

const bcrypt =
    require("bcrypt");

const {
    pool
} = require("../config/database");


/* =========================================================
   UTILIDADES
========================================================= */

function generarSlug(
    texto = ""
) {

    return texto
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );

}


async function generarSlugUnico(
    conexion,
    nombre
) {

    const slugBase =
        generarSlug(
            nombre
        ) ||
        "agencia";


    let slug =
        slugBase;


    let contador =
        2;


    while (true) {

        const existente =
            await conexion.query(
                `
                    SELECT
                        id
                    FROM agencias
                    WHERE slug = ?
                    LIMIT 1
                `,
                [
                    slug
                ]
            );


        if (
            existente.length ===
            0
        ) {

            return slug;

        }


        slug =
            `${slugBase}-${contador}`;


        contador += 1;

    }

}


async function obtenerPlanesActivos(
    conexion
) {

    return conexion.query(`
        SELECT
            id,
            nombre,
            descripcion,
            precio_mensual,
            limite_vehiculos,
            limite_sucursales,
            limite_empleados
        FROM planes
        WHERE activo = 1
        ORDER BY id ASC
    `);

}


async function obtenerTotalAgencias(
    conexion
) {

    const resultado =
        await conexion.query(`
            SELECT
                COUNT(*) AS total
            FROM agencias
        `);


    return Number(
        resultado[0].total ||
        0
    );

}

async function esRolAgenciaValido(
    conexion,
    rolId
) {

    const resultado =
        await conexion.query(
            `
                SELECT
                    id
                FROM roles
                WHERE id = ?
                AND codigo IN (
                    'admin_agencia',
                    'empleado'
                )
                AND activo = 1
                LIMIT 1
            `,
            [
                rolId
            ]
        );


    return (
        resultado.length >
        0
    );

}

/* =========================================================
   OBTENER SUSCRIPCIÓN Y PLAN ACTUAL DE AGENCIA
========================================================= */

async function obtenerSuscripcionActualAgencia(
    conexion,
    agenciaId
) {

    const resultado =
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

                p.limite_vehiculos,

                p.limite_sucursales,

                p.limite_empleados

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


    return resultado.length
        ? resultado[0]
        : null;

}

/* =========================================================
   VALIDAR FECHA YYYY-MM-DD
========================================================= */

function esFechaISOValida(
    valor
) {

    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
            valor
        )
    ) {

        return false;

    }


    const [
        anio,
        mes,
        dia
    ] = valor
        .split("-")
        .map(Number);


    const fecha =
        new Date(
            Date.UTC(
                anio,
                mes - 1,
                dia
            )
        );


    return (

        fecha.getUTCFullYear() ===
            anio &&

        fecha.getUTCMonth() ===
            mes - 1 &&

        fecha.getUTCDate() ===
            dia

    );

}

/* =========================================================
   VALIDAR COLOR HEXADECIMAL
========================================================= */

function validarColorHex(
    color,
    valorPredeterminado
) {

    const expresion =
        /^#[0-9A-Fa-f]{6}$/;


    if (
        expresion.test(
            String(
                color ||
                ""
            )
        )
    ) {

        return color;

    }


    return valorPredeterminado;

}


/* =========================================================
   EXTENSIÓN SEGURA SEGÚN MIME
========================================================= */

function obtenerExtensionLogo(
    mimetype
) {

    const extensiones = {

        "image/png":
            ".png",

        "image/jpeg":
            ".jpg",

        "image/webp":
            ".webp"

    };


    return extensiones[
        mimetype
    ] || null;

}


/* =========================================================
   GUARDAR LOGO DE LA AGENCIA
========================================================= */

async function guardarLogoAgencia(
    archivo,
    agenciaId
) {

    if (!archivo) {

        return null;

    }


    const extension =
        obtenerExtensionLogo(
            archivo.mimetype
        );


    if (!extension) {

        throw new Error(
            "Formato de logo no permitido."
        );

    }


    const carpetaRelativa =
        path.join(
            "img",
            "agencias",
            String(
                agenciaId
            )
        );


    const carpetaAbsoluta =
        path.join(
            __dirname,
            "..",
            carpetaRelativa
        );


    await fs.mkdir(
        carpetaAbsoluta,
        {
            recursive: true
        }
    );


    /*
     * Primero guardamos la nueva imagen de forma temporal.
     * Así evitamos borrar el logo anterior antes de saber
     * que la nueva imagen pudo escribirse correctamente.
     */

    const nombreTemporal =
        `logo-temporal-${Date.now()}${extension}`;


    const rutaTemporal =
        path.join(
            carpetaAbsoluta,
            nombreTemporal
        );


    await fs.writeFile(
        rutaTemporal,
        archivo.buffer
    );


    /*
     * Eliminamos cualquier formato anterior del logo.
     * Esto evita tener logo.jpg + logo.png + logo.webp.
     */

    const logosAnteriores = [
        "logo.jpg",
        "logo.jpeg",
        "logo.png",
        "logo.webp"
    ];


    for (
        const nombreAnterior
        of logosAnteriores
    ) {

        await fs.rm(
            path.join(
                carpetaAbsoluta,
                nombreAnterior
            ),
            {
                force: true
            }
        );

    }


    const nombreArchivo =
        `logo${extension}`;


    const rutaAbsoluta =
        path.join(
            carpetaAbsoluta,
            nombreArchivo
        );


    await fs.rename(
        rutaTemporal,
        rutaAbsoluta
    );


    return (
        "/" +
        path
            .join(
                carpetaRelativa,
                nombreArchivo
            )
            .replace(
                /\\/g,
                "/"
            )
    );

}


/* =========================================================
   ELIMINAR CARPETA DE AGENCIA SI FALLA
========================================================= */

async function eliminarRecursosAgencia(
    agenciaId
) {

    if (!agenciaId) {

        return;

    }


    const carpeta =
        path.join(
            __dirname,
            "..",
            "img",
            "agencias",
            String(
                agenciaId
            )
        );


    try {

        await fs.rm(
            carpeta,
            {
                recursive: true,
                force: true
            }
        );

    } catch (error) {

        console.error(
            "No fue posible eliminar los recursos temporales de la agencia:",
            error.message
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

async function mostrarDashboard(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const agenciasResultado =
            await conexion.query(`
                SELECT
                    COUNT(*) AS total
                FROM agencias
            `);


        const agenciasActivasResultado =
            await conexion.query(`
                SELECT
                    COUNT(*) AS total
                FROM agencias
                WHERE estado = 'activa'
            `);


        const suscripcionesResultado =
            await conexion.query(`
                SELECT
                    COUNT(*) AS total
                FROM suscripciones
                WHERE estado = 'activa'
            `);


        const usuariosResultado =
            await conexion.query(`
                SELECT
                    COUNT(*) AS total
                FROM usuarios
                WHERE estado = 'activo'
            `);


        const agenciasRecientes =
            await conexion.query(`
                SELECT
                    a.id,
                    a.nombre,
                    a.ciudad,
                    a.provincia,
                    a.estado,
                    a.fecha_creacion
                FROM agencias a
                ORDER BY
                    a.fecha_creacion DESC
                LIMIT 5
            `);

        const estadisticas = {

            agencias:
                Number(
                    agenciasResultado[0].total
                ),

            agenciasActivas:
                Number(
                    agenciasActivasResultado[0].total
                ),

            suscripciones:
                Number(
                    suscripcionesResultado[0].total
                ),

            usuarios:
                Number(
                    usuariosResultado[0].total
                )

        };


        return res.render(
            "admin/dashboard",
            {

                titulo:
                    "Dashboard",

                subtituloPagina:
                    "Resumen general",

                paginaActual:
                    "dashboard",

                usuario:
                    req.session.usuario,

                estadisticas,

                agenciasRecientes,

                totalAgencias:
                    estadisticas.agencias

            }
        );

    } catch (error) {

        console.error(
            "Error cargando el dashboard:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el panel administrativo."
            );

    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   LISTADO DE AGENCIAS
========================================================= */

async function mostrarAgencias(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const estadisticasResultado =
            await conexion.query(`
                SELECT

                    COUNT(*)
                        AS total,

                    SUM(
                        CASE
                            WHEN estado = 'activa'
                            THEN 1
                            ELSE 0
                        END
                    )
                        AS activas,

                    SUM(
                        CASE
                            WHEN estado = 'prueba'
                            THEN 1
                            ELSE 0
                        END
                    )
                        AS prueba,

                    SUM(
                        CASE
                            WHEN estado = 'suspendida'
                            THEN 1
                            ELSE 0
                        END
                    )
                        AS suspendidas

                FROM agencias
            `);


        const agencias =
            await conexion.query(`
                SELECT
                    a.id,
                    a.nombre,
                    a.slug,
                    a.correo,
                    a.telefono,
                    a.whatsapp,
                    a.ciudad,
                    a.provincia,
                    a.pais,
                    a.estado,
                    a.logo,
                    a.color_primario,
                    a.color_secundario,
                    a.fecha_creacion,

                    s.id
                        AS suscripcion_id,

                    s.estado
                        AS suscripcion_estado,

                    s.fecha_inicio
                        AS suscripcion_inicio,

                    s.fecha_fin
                        AS suscripcion_fin,

                    p.id
                        AS plan_id,

                    p.nombre
                        AS plan_nombre

                FROM agencias a

                LEFT JOIN suscripciones s
                    ON s.id = (

                        SELECT
                            s2.id

                        FROM suscripciones s2

                        WHERE
                            s2.agencia_id =
                            a.id

                        ORDER BY

                            CASE

                                WHEN
                                    s2.estado = 'activa'
                                    THEN 1

                                WHEN
                                    s2.estado = 'prueba'
                                    THEN 2

                                ELSE 3

                            END,

                            s2.fecha_inicio DESC,
                            s2.id DESC

                        LIMIT 1

                    )

                LEFT JOIN planes p
                    ON p.id =
                    s.plan_id

                ORDER BY
                    a.fecha_creacion DESC,
                    a.id DESC
            `);


        const fila =
            estadisticasResultado[0];


        const estadisticasAgencias = {

            total:
                Number(
                    fila.total ||
                    0
                ),

            activas:
                Number(
                    fila.activas ||
                    0
                ),

            prueba:
                Number(
                    fila.prueba ||
                    0
                ),

            suspendidas:
                Number(
                    fila.suspendidas ||
                    0
                )

        };


        return res.render(
            "admin/agencias/index",
            {

                titulo:
                    "Agencias",

                subtituloPagina:
                    "Gestión de agencias",

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencias,

                estadisticasAgencias,

                totalAgencias:
                    estadisticasAgencias.total,

                mensajeExito:
                    req.query.creada ===
                    "1"
                        ? "La agencia fue registrada correctamente."
                        : null

            }
        );

    } catch (error) {

        console.error(
            "Error cargando agencias:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el listado de agencias."
            );

    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   FORMULARIO NUEVA AGENCIA
========================================================= */

async function mostrarNuevaAgencia(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const planes =
            await obtenerPlanesActivos(
                conexion
            );


        const totalAgencias =
            await obtenerTotalAgencias(
                conexion
            );


        return res.render(
            "admin/agencias/nueva",
            {

                titulo:
                    "Nueva agencia",

                subtituloPagina:
                    "Registrar agencia",

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                totalAgencias,

                planes,

                error:
                    null,

                datos:
                    {}

            }
        );

    } catch (error) {

        console.error(
            "Error cargando formulario de agencia:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el formulario."
            );

    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   CREAR AGENCIA
========================================================= */

async function crearAgencia(
    req,
    res
) {

    let conexion;

    let transaccionIniciada =
        false;

    let agenciaId =
        null;

    let logoGuardado =
        false;


    const datos = {

        nombre:
            String(
                req.body.nombre ||
                ""
            ).trim(),

        nombre_legal:
            String(
                req.body.nombre_legal ||
                ""
            ).trim(),

        identificacion_fiscal:
            String(
                req.body.identificacion_fiscal ||
                ""
            ).trim(),

        correo:
            String(
                req.body.correo ||
                ""
            )
                .trim()
                .toLowerCase(),

        telefono:
            String(
                req.body.telefono ||
                ""
            ).trim(),

        whatsapp:
            String(
                req.body.whatsapp ||
                ""
            ).trim(),

        direccion:
            String(
                req.body.direccion ||
                ""
            ).trim(),

        ciudad:
            String(
                req.body.ciudad ||
                ""
            ).trim(),

        provincia:
            String(
                req.body.provincia ||
                ""
            ).trim(),

        pais:
            String(
                req.body.pais ||
                "República Dominicana"
            ).trim(),

        estado:
            String(
                req.body.estado ||
                "prueba"
            ).trim(),

        plan_id:
            Number(
                req.body.plan_id ||
                0
            ),

        color_primario:
            validarColorHex(
                req.body.color_primario,
                "#0b1f3a"
            ),

        color_secundario:
            validarColorHex(
                req.body.color_secundario,
                "#ff8a00"
            )

    };


    try {

        conexion =
            await pool.getConnection();


        const planes =
            await obtenerPlanesActivos(
                conexion
            );


        const totalAgencias =
            await obtenerTotalAgencias(
                conexion
            );


        /* -------------------------------------------------
           VALIDACIÓN GENERAL
        ------------------------------------------------- */

        if (
            !datos.nombre ||
            !datos.correo ||
            !datos.plan_id
        ) {

            return res
                .status(400)
                .render(
                    "admin/agencias/nueva",
                    {

                        titulo:
                            "Nueva agencia",

                        subtituloPagina:
                            "Registrar agencia",

                        paginaActual:
                            "agencias",

                        usuario:
                            req.session.usuario,

                        totalAgencias,

                        planes,

                        datos,

                        error:
                            "Completa los campos obligatorios: nombre, correo y plan."

                    }
                );

        }


        const expresionCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !expresionCorreo.test(
                datos.correo
            )
        ) {

            return res
                .status(400)
                .render(
                    "admin/agencias/nueva",
                    {

                        titulo:
                            "Nueva agencia",

                        subtituloPagina:
                            "Registrar agencia",

                        paginaActual:
                            "agencias",

                        usuario:
                            req.session.usuario,

                        totalAgencias,

                        planes,

                        datos,

                        error:
                            "Introduce un correo electrónico válido."

                    }
                );

        }


        const estadosPermitidos = [
            "prueba",
            "activa",
            "suspendida"
        ];


        if (
            !estadosPermitidos.includes(
                datos.estado
            )
        ) {

            datos.estado =
                "prueba";

        }


        const plan =
            planes.find(
                (item) =>
                    Number(
                        item.id
                    ) ===
                    datos.plan_id
            );


        if (!plan) {

            return res
                .status(400)
                .render(
                    "admin/agencias/nueva",
                    {

                        titulo:
                            "Nueva agencia",

                        subtituloPagina:
                            "Registrar agencia",

                        paginaActual:
                            "agencias",

                        usuario:
                            req.session.usuario,

                        totalAgencias,

                        planes,

                        datos,

                        error:
                            "El plan seleccionado no es válido."

                    }
                );

        }


        const correoExistente =
            await conexion.query(
                `
                    SELECT
                        id
                    FROM agencias
                    WHERE correo = ?
                    LIMIT 1
                `,
                [
                    datos.correo
                ]
            );


        if (
            correoExistente.length >
            0
        ) {

            return res
                .status(409)
                .render(
                    "admin/agencias/nueva",
                    {

                        titulo:
                            "Nueva agencia",

                        subtituloPagina:
                            "Registrar agencia",

                        paginaActual:
                            "agencias",

                        usuario:
                            req.session.usuario,

                        totalAgencias,

                        planes,

                        datos,

                        error:
                            "Ya existe una agencia registrada con ese correo electrónico."

                    }
                );

        }


        const slug =
            await generarSlugUnico(
                conexion,
                datos.nombre
            );


        /* -------------------------------------------------
           INICIAR TRANSACCIÓN
        ------------------------------------------------- */

        await conexion.beginTransaction();


        transaccionIniciada =
            true;


        /* -------------------------------------------------
           CREAR AGENCIA
        ------------------------------------------------- */

        const agenciaResultado =
            await conexion.query(
                `
                    INSERT INTO agencias (
                        nombre,
                        slug,
                        nombre_legal,
                        identificacion_fiscal,
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
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        NULL,
                        ?,
                        ?,
                        ?
                    )
                `,
                [

                    datos.nombre,

                    slug,

                    datos.nombre_legal ||
                        null,

                    datos.identificacion_fiscal ||
                        null,

                    datos.correo,

                    datos.telefono ||
                        null,

                    datos.whatsapp ||
                        null,

                    datos.direccion ||
                        null,

                    datos.ciudad ||
                        null,

                    datos.provincia ||
                        null,

                    datos.pais,

                    datos.color_primario,

                    datos.color_secundario,

                    datos.estado

                ]
            );


        agenciaId =
            Number(
                agenciaResultado.insertId
            );


        /* -------------------------------------------------
           GUARDAR LOGO
        ------------------------------------------------- */

        let rutaLogo =
            null;


        if (req.file) {

            rutaLogo =
                await guardarLogoAgencia(
                    req.file,
                    agenciaId
                );


            logoGuardado =
                Boolean(
                    rutaLogo
                );


            await conexion.query(
                `
                    UPDATE agencias
                    SET logo = ?
                    WHERE id = ?
                `,
                [
                    rutaLogo,
                    agenciaId
                ]
            );

        }


        /* -------------------------------------------------
           CREAR SUSCRIPCIÓN
        ------------------------------------------------- */

        await conexion.query(
            `
                INSERT INTO suscripciones (
                    agencia_id,
                    plan_id,
                    fecha_inicio,
                    fecha_fin,
                    estado,
                    precio_acordado,
                    renovacion_automatica
                )
                VALUES (
                    ?,
                    ?,
                    CURDATE(),
                    NULL,
                    ?,
                    ?,
                    0
                )
            `,
            [

                agenciaId,

                datos.plan_id,

                datos.estado,

                Number(
                    plan.precio_mensual ||
                    0
                )

            ]
        );


        /* -------------------------------------------------
           CONFIRMAR
        ------------------------------------------------- */

        await conexion.commit();


        transaccionIniciada =
            false;


        return res.redirect(
            "/admin/agencias?creada=1"
        );

    } catch (error) {


        if (
            conexion &&
            transaccionIniciada
        ) {

            try {

                await conexion.rollback();

            } catch (
                rollbackError
            ) {

                console.error(
                    "Error haciendo rollback:",
                    rollbackError
                );

            }

        }


        if (
            agenciaId &&
            logoGuardado
        ) {

            await eliminarRecursosAgencia(
                agenciaId
            );

        }


        console.error(
            "Error creando agencia:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible registrar la agencia."
            );

    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   DETALLE DE AGENCIA
========================================================= */

async function mostrarDetalleAgencia(
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


        if (!agenciaId) {

            return res
                .status(400)
                .send(
                    "ID de agencia inválido."
                );

        }


        const agenciaResultado =
            await conexion.query(
                `
                SELECT

                    a.*,

                    p.nombre
                        AS plan_nombre,

                    p.precio_mensual,

                    s.estado
                        AS suscripcion_estado,

                    s.fecha_inicio,

                    s.fecha_fin,

                    s.precio_acordado

                FROM agencias a


                LEFT JOIN suscripciones s

                    ON s.id = (

                        SELECT
                            s2.id

                        FROM suscripciones s2

                        WHERE
                            s2.agencia_id = a.id

                        ORDER BY
                            s2.id DESC

                        LIMIT 1

                    )


                LEFT JOIN planes p

                    ON p.id = s.plan_id


                WHERE
                    a.id = ?

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


        const usuarios =
            await conexion.query(
                `
                SELECT
                    COUNT(*) AS total

                FROM usuarios

                WHERE
                    agencia_id = ?
                `,
                [
                    agenciaId
                ]
            );


        return res.render(
            "admin/agencias/detalle",
            {

                titulo:
                    "Detalle de agencia",

                subtituloPagina:
                    agencia.nombre,

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia,

                resumen:
                {

                    usuarios:
                        Number(
                            usuarios[0].total ||
                            0
                        ),

                    vehiculos:
                        0,

                    reservas:
                        0,

                    clientes:
                        0

                }

            }
        );


    } catch(error) {

        console.error(
            "Error mostrando detalle de agencia:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar la agencia."
            );


    } finally {

        if(conexion){

            conexion.release();

        }

    }

}

// =========================================================
// MOSTRAR EDITAR AGENCIA
// =========================================================

async function mostrarEditarAgencia(
    req,
    res
){

    let conexion;


    try {


        conexion =
            await pool.getConnection();



        const agenciaId =
            Number(req.params.id);




        const agencia =
    await conexion.query(
        `
        SELECT

            id,

            nombre,

            nombre_legal,

            identificacion_fiscal,

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

        WHERE id = ?

        LIMIT 1
        `,
        [
            agenciaId
        ]
    );



        if(
            agencia.length === 0
        ){

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }

        return res.render(
    "admin/agencias/editarAgencia",
    {

        titulo:
            "Editar agencia",

        subtituloPagina:
            "Modificar agencia",

        paginaActual:
            "agencias",

        usuario:
            req.session.usuario,

        agencia:
            agencia[0],

        error:
            null

    }
);



    } catch(error){


        console.error(
            "Error cargando editar agencia:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar la agencia."
            );


    } finally {


        if(conexion){

            conexion.release();

        }

    }

}

// =========================================================
// ACTUALIZAR AGENCIA
// =========================================================

async function actualizarAgencia(
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


        const datos = {

            nombre:
                String(
                    req.body.nombre ||
                    ""
                ).trim(),

            nombre_legal:
                String(
                    req.body.nombre_legal ||
                    ""
                ).trim(),

            identificacion_fiscal:
                String(
                    req.body.identificacion_fiscal ||
                    ""
                ).trim(),

            correo:
                String(
                    req.body.correo ||
                    ""
                )
                    .trim()
                    .toLowerCase(),

            telefono:
                String(
                    req.body.telefono ||
                    ""
                ).trim(),

            whatsapp:
                String(
                    req.body.whatsapp ||
                    ""
                ).trim(),

            direccion:
                String(
                    req.body.direccion ||
                    ""
                ).trim(),

            ciudad:
                String(
                    req.body.ciudad ||
                    ""
                ).trim(),

            provincia:
                String(
                    req.body.provincia ||
                    ""
                ).trim(),

            pais:
                String(
                    req.body.pais ||
                    "República Dominicana"
                ).trim(),

            color_primario:
                validarColorHex(
                    req.body.color_primario,
                    "#0b1f3a"
                ),

            color_secundario:
                validarColorHex(
                    req.body.color_secundario,
                    "#ff8a00"
                )

        };


        if (
            !datos.nombre ||
            !datos.correo
        ) {

            return res
                .status(400)
                .send(
                    "El nombre y el correo son obligatorios."
                );

        }


        const expresionCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !expresionCorreo.test(
                datos.correo
            )
        ) {

            return res
                .status(400)
                .send(
                    "Introduce un correo electrónico válido."
                );

        }


        const agencia =
            await conexion.query(
                `
                    SELECT
                        id,
                        logo
                    FROM agencias
                    WHERE id = ?
                    LIMIT 1
                `,
                [
                    agenciaId
                ]
            );


        if (
            agencia.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        const correoExistente =
            await conexion.query(
                `
                    SELECT
                        id
                    FROM agencias
                    WHERE correo = ?
                    AND id <> ?
                    LIMIT 1
                `,
                [
                    datos.correo,
                    agenciaId
                ]
            );


        if (
            correoExistente.length >
            0
        ) {

            return res
                .status(409)
                .send(
                    "Ya existe otra agencia registrada con ese correo."
                );

        }


        let logoActual =
            agencia[0].logo;


        if (req.file) {

            logoActual =
                await guardarLogoAgencia(
                    req.file,
                    agenciaId
                );

        }


        await conexion.query(
            `
                UPDATE agencias
                SET
                    nombre = ?,
                    nombre_legal = ?,
                    identificacion_fiscal = ?,
                    correo = ?,
                    telefono = ?,
                    whatsapp = ?,
                    direccion = ?,
                    ciudad = ?,
                    provincia = ?,
                    pais = ?,
                    logo = ?,
                    color_primario = ?,
                    color_secundario = ?
                WHERE id = ?
            `,
            [

                datos.nombre,

                datos.nombre_legal ||
                    null,

                datos.identificacion_fiscal ||
                    null,

                datos.correo,

                datos.telefono ||
                    null,

                datos.whatsapp ||
                    null,

                datos.direccion ||
                    null,

                datos.ciudad ||
                    null,

                datos.provincia ||
                    null,

                datos.pais,

                logoActual,

                datos.color_primario,

                datos.color_secundario,

                agenciaId

            ]
        );


        return res.redirect(
            `/admin/agencias/${agenciaId}`
        );


    } catch (error) {

        console.error(
            "Error actualizando agencia:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible actualizar la agencia."
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

async function mostrarUsuariosAgencia(
    req,
    res
) {

    let conexion;

    try {

        conexion =
            await pool.getConnection();


        const agenciaId =
            Number(req.params.id);


        const agencia =
            await conexion.query(
                `
                SELECT
                    id,
                    nombre,
                    logo,
                    color_primario,
                    color_secundario
                FROM agencias
                WHERE id = ?
                LIMIT 1
                `,
                [
                    agenciaId
                ]
            );


        if (
            agencia.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        const usuarios =
            await conexion.query(
                `
                SELECT

                    u.id,

                    u.nombre,

                    u.apellido,

                    u.correo,

                    u.telefono,

                    u.estado,

                    u.ultimo_acceso,

                    r.nombre AS rol

                FROM usuarios u

                INNER JOIN roles r
                    ON r.id = u.rol_id

                WHERE
                    u.agencia_id = ?

                ORDER BY
                    u.fecha_creacion DESC
                `,
                [
                    agenciaId
                ]
            );


        return res.render(
            "admin/agencias/usuarios",
            {

                titulo:
                    "Usuarios de agencia",

                subtituloPagina:
                    "Gestión de usuarios",

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia:
                    agencia[0],

                usuarios

            }
        );


    } catch(error) {


        console.error(
            "Error cargando usuarios:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar usuarios."
            );


    } finally {


        if(conexion){

            conexion.release();

        }

    }

}


// =========================================================
// TEMPORAL - NUEVO USUARIO
// =========================================================

async function mostrarNuevoUsuario(
    req,
    res
){

    let conexion;


    try {


        conexion =
            await pool.getConnection();



        const agenciaId =
            Number(req.params.id);



        const agencia =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    logo

                FROM agencias

                WHERE id = ?

                LIMIT 1
                `,
                [
                    agenciaId
                ]
            );



        if (
            agencia.length === 0
        ){

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }




        const roles =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre

                FROM roles

                WHERE id IN (2,3)

                AND activo = 1

                ORDER BY nivel ASC
                `
            );


        return res.render(
    "admin/agencias/nuevoUsuario",
    {

        titulo:
            "Nuevo usuario",

        subtituloPagina:
            "Crear usuario de agencia",

        paginaActual:
            "agencias",

        usuario:
            req.session.usuario,

        agencia:
            agencia[0],

        roles,

        error:
            null,

        datos:
            {}

    }
);


    } catch(error){


        console.error(
            "Error cargando formulario usuario:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar formulario."
            );



    } finally {


        if(conexion){

            conexion.release();

        }

    }

}

// =========================================================
// TEMPORAL - CREAR USUARIO
// =========================================================

async function crearUsuarioAgencia(
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


        const datos = {

            nombre:
                String(
                    req.body.nombre ||
                    ""
                ).trim(),

            apellido:
                String(
                    req.body.apellido ||
                    ""
                ).trim(),

            correo:
                String(
                    req.body.correo ||
                    ""
                )
                    .trim()
                    .toLowerCase(),

            telefono:
                String(
                    req.body.telefono ||
                    ""
                ).trim(),

            password:
                String(
                    req.body.password ||
                    ""
                ),

            rolId:
                Number(
                    req.body.rol_id
                ),

            estado:
                String(
                    req.body.estado ||
                    "activo"
                )

        };


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Agencia inválida."
                );

        }


        if (
            !datos.nombre ||
            !datos.correo ||
            !datos.password
        ) {

            return res
                .status(400)
                .send(
                    "Nombre, correo y contraseña son obligatorios."
                );

        }

        const expresionCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !expresionCorreo.test(
                datos.correo
            )
        ) {

            return res
                .status(400)
                .send(
                    "Introduce un correo electrónico válido."
                );

        }


        if (
            datos.password.length <
            8
        ) {

            return res
                .status(400)
                .send(
                    "La contraseña debe tener al menos 8 caracteres."
                );

        }


        const estadosPermitidos = [
            "activo",
            "inactivo"
        ];


        if (
            !estadosPermitidos.includes(
                datos.estado
            )
        ) {

            return res
                .status(400)
                .send(
                    "El estado seleccionado no es válido."
                );

        }


        const agencia =
    await conexion.query(
        `
            SELECT

                id,
                nombre,
                logo

            FROM agencias

            WHERE id = ?

            LIMIT 1
        `,
        [
            agenciaId
        ]
    );


        if (
            agencia.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        const rolValido =
            await esRolAgenciaValido(
                conexion,
                datos.rolId
            );


        if (!rolValido) {

            return res
                .status(400)
                .send(
                    "El rol seleccionado no está permitido para una agencia."
                );

        }

        /* -------------------------------------------------
   VALIDAR SUSCRIPCIÓN Y LÍMITE DE USUARIOS
------------------------------------------------- */

const suscripcionActual =
    await obtenerSuscripcionActualAgencia(
        conexion,
        agenciaId
    );


if (!suscripcionActual) {

    return res
        .status(409)
        .send(
            "La agencia no tiene una suscripción asociada."
        );

}


const estadosConAcceso = [
    "prueba",
    "activa"
];


if (
    !estadosConAcceso.includes(
        suscripcionActual.suscripcion_estado
    )
) {

    return res
        .status(409)
        .send(
            "No se pueden activar nuevos usuarios porque la suscripción de la agencia no está activa."
        );

}


/*
 * Solamente una cuenta activa consume
 * capacidad del plan.
 */

if (
    datos.estado === "activo" &&
    suscripcionActual.limite_empleados !== null
) {

    const usuariosActivos =
        await conexion.query(
            `
            SELECT
                COUNT(*) AS total
            FROM usuarios
            WHERE
                agencia_id = ?
                AND estado = 'activo'
            `,
            [
                agenciaId
            ]
        );


    const totalUsuariosActivos =
        Number(
            usuariosActivos[0].total ||
            0
        );


    const limiteUsuarios =
        Number(
            suscripcionActual.limite_empleados
        );


    if (
    totalUsuariosActivos >=
    limiteUsuarios
) {

    const roles =
        await conexion.query(
            `
            SELECT

                id,
                nombre

            FROM roles

            WHERE id IN (2,3)

            AND activo = 1

            ORDER BY nivel ASC
            `
        );


    const textoLimite =
        limiteUsuarios === 1

            ? "1 usuario activo"

            : `${limiteUsuarios} usuarios activos`;


    return res
        .status(409)
        .render(
            "admin/agencias/nuevoUsuario",
            {

                titulo:
                    "Nuevo usuario",

                subtituloPagina:
                    "Crear usuario de agencia",

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia:
                    agencia[0],

                roles,

                error:
                    `La agencia alcanzó el límite de ${textoLimite} permitido por el plan ${suscripcionActual.plan_nombre}.`,

                datos:
                {

                    nombre:
                        datos.nombre,

                    apellido:
                        datos.apellido,

                    correo:
                        datos.correo,

                    telefono:
                        datos.telefono,

                    rol_id:
                        datos.rolId,

                    estado:
                        datos.estado

                }

            }
        );
    }

}

        const usuarioExistente =
            await conexion.query(
                `
                    SELECT
                        id
                    FROM usuarios
                    WHERE correo = ?
                    LIMIT 1
                `,
                [
                    datos.correo
                ]
            );


        if (
    usuarioExistente.length >
    0
) {

    const roles =
        await conexion.query(
            `
            SELECT

                id,
                nombre

            FROM roles

            WHERE id IN (2,3)

            AND activo = 1

            ORDER BY nivel ASC
            `
        );


    return res
        .status(409)
        .render(
            "admin/agencias/nuevoUsuario",
            {

                titulo:
                    "Nuevo usuario",

                subtituloPagina:
                    "Crear usuario de agencia",

                paginaActual:
                    "agencias",

                usuario:
                    req.session.usuario,

                agencia:
                    agencia[0],

                roles,

                error:
                    "El correo electrónico ya está registrado.",

                datos:
                {

                    nombre:
                        datos.nombre,

                    apellido:
                        datos.apellido,

                    correo:
                        datos.correo,

                    telefono:
                        datos.telefono,

                    rol_id:
                        datos.rolId,

                    estado:
                        datos.estado

                }

            }
        );

}

        const passwordHash =
            await bcrypt.hash(
                datos.password,
                12
            );


        await conexion.query(
            `
                INSERT INTO usuarios (
                    agencia_id,
                    rol_id,
                    nombre,
                    apellido,
                    correo,
                    password_hash,
                    telefono,
                    estado
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
            `,
            [

                agenciaId,

                datos.rolId,

                datos.nombre,

                datos.apellido ||
                    null,

                datos.correo,

                passwordHash,

                datos.telefono ||
                    null,

                datos.estado

            ]
        );


        return res.redirect(
            `/admin/agencias/${agenciaId}/usuarios`
        );


    } catch (error) {

        console.error(
            "Error creando usuario:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible crear el usuario."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


// =========================================================
// MOSTRAR EDITAR USUARIO
// =========================================================

async function mostrarEditarUsuario(
    req,
    res
){

    let conexion;


    try {


        conexion =
            await pool.getConnection();



        const agenciaId =
            Number(req.params.id);



        const usuarioId =
            Number(req.params.usuarioId);





        const agencia =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    logo

                FROM agencias

                WHERE id = ?

                LIMIT 1
                `,
                [
                    agenciaId
                ]
            );



        if(
            agencia.length === 0
        ){

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }





        const usuario =
            await conexion.query(
                `
                SELECT

                    id,

                    nombre,

                    apellido,

                    correo,

                    telefono,

                    estado,

                    rol_id

                FROM usuarios

                WHERE id = ?

                AND agencia_id = ?

                LIMIT 1
                `,
                [

                    usuarioId,

                    agenciaId

                ]
            );



        if(
            usuario.length === 0
        ){

            return res
                .status(404)
                .send(
                    "Usuario no encontrado."
                );

        }






        const roles =
            await conexion.query(
                `
                SELECT

                    id,

                    nombre

                FROM roles

                WHERE id IN (2,3)

                AND activo = 1

                ORDER BY nivel ASC
                `
            );






        return res.render(
            "admin/agencias/editarUsuario",
            {

                titulo:
                    "Editar usuario",


                subtituloPagina:
                    "Modificar usuario",


                paginaActual:
                    "agencias",


                usuario:
                    req.session.usuario,


                agencia:
                    agencia[0],


                usuarioEditar:
                usuario[0],
                
                roles,
            
                error: null

            }
        );



    } catch(error){


        console.error(
            "Error cargando editar usuario:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar usuario."
            );



    } finally {


        if(conexion){

            conexion.release();

        }

    }

}


// =========================================================
// ACTUALIZAR USUARIO
// =========================================================

async function actualizarUsuario(
    req,
    res
){

    let conexion;


    try {


        conexion =
            await pool.getConnection();



        const agenciaId =
            Number(req.params.id);



        const usuarioId =
            Number(req.params.usuarioId);



        const {

            nombre,

            apellido,

            correo,

            telefono,

            rol_id,

            estado


        } = req.body;



        const rolId =
            Number(
                rol_id
            );



        const estadosPermitidos = [
            "activo",
            "inactivo"
        ];



        /* -------------------------------------------------
           MOSTRAR ERRORES DENTRO DEL FORMULARIO
        ------------------------------------------------- */

        async function renderizarErrorEdicion(
            mensaje,
            estadoHttp = 400
        ) {


            const agenciaResultado =
                await conexion.query(
                    `
                    SELECT

                        id,
                        nombre,
                        logo

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



            const roles =
                await conexion.query(
                    `
                    SELECT

                        id,
                        nombre

                    FROM roles

                    WHERE id IN (2,3)

                    AND activo = 1

                    ORDER BY nivel ASC
                    `
                );



            return res
                .status(
                    estadoHttp
                )
                .render(
                    "admin/agencias/editarUsuario",
                    {

                        titulo:
                            "Editar usuario",


                        subtituloPagina:
                            "Modificar usuario",


                        paginaActual:
                            "agencias",


                        usuario:
                            req.session.usuario,


                        agencia:
                            agenciaResultado[0],


                        usuarioEditar:
                        {

                            id:
                                usuarioId,


                            nombre:
                                String(
                                    nombre ||
                                    ""
                                ).trim(),


                            apellido:
                                String(
                                    apellido ||
                                    ""
                                ).trim(),


                            correo:
                                String(
                                    correo ||
                                    ""
                                ).trim(),


                            telefono:
                                String(
                                    telefono ||
                                    ""
                                ).trim(),


                            rol_id:
                                rolId,


                            estado:
                                estado

                        },


                        roles,


                        error:
                            mensaje

                    }
                );

        }



        /* -------------------------------------------------
           VALIDACIONES BÁSICAS
        ------------------------------------------------- */

        if (
            !nombre ||
            !String(nombre).trim() ||
            !correo ||
            !String(correo).trim()
        ) {

            return await renderizarErrorEdicion(
                "Nombre y correo son obligatorios."
            );

        }



        if (
            !estadosPermitidos.includes(
                estado
            )
        ) {

            return await renderizarErrorEdicion(
                "El estado seleccionado no es válido."
            );

        }



        const rolValido =
            await esRolAgenciaValido(
                conexion,
                rolId
            );



        if (!rolValido) {

            return await renderizarErrorEdicion(
                "El rol seleccionado no está permitido."
            );

        }



        /* -------------------------------------------------
           VALIDAR QUE EL USUARIO PERTENEZCA A LA AGENCIA
        ------------------------------------------------- */

        const usuario =
            await conexion.query(
                `
                SELECT

                    id,
                    estado

                FROM usuarios

                WHERE id = ?

                AND agencia_id = ?

                LIMIT 1
                `,
                [

                    usuarioId,

                    agenciaId

                ]
            );



        if (
            usuario.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Usuario no encontrado."
                );

        }



        /* -------------------------------------------------
           VALIDAR ACTIVACIÓN SEGÚN EL PLAN
        ------------------------------------------------- */

        const seEstaActivando =
            usuario[0].estado !== "activo" &&
            estado === "activo";



        if (seEstaActivando) {


            const suscripcionActual =
                await obtenerSuscripcionActualAgencia(
                    conexion,
                    agenciaId
                );



            if (!suscripcionActual) {

                return await renderizarErrorEdicion(
                    "La agencia no tiene una suscripción asociada.",
                    409
                );

            }



            const estadosConAcceso = [
                "prueba",
                "activa"
            ];



            if (
                !estadosConAcceso.includes(
                    suscripcionActual.suscripcion_estado
                )
            ) {

                return await renderizarErrorEdicion(
                    "No se puede activar este usuario porque la suscripción de la agencia no está activa.",
                    409
                );

            }



            if (
                suscripcionActual.limite_empleados !== null
            ) {


                const usuariosActivos =
                    await conexion.query(
                        `
                        SELECT

                            COUNT(*) AS total

                        FROM usuarios

                        WHERE agencia_id = ?

                        AND estado = 'activo'
                        `,
                        [
                            agenciaId
                        ]
                    );



                const totalUsuariosActivos =
                    Number(
                        usuariosActivos[0].total ||
                        0
                    );



                const limiteUsuarios =
                    Number(
                        suscripcionActual.limite_empleados
                    );



                if (
                    totalUsuariosActivos >=
                    limiteUsuarios
                ) {


                    const textoLimite =
                        limiteUsuarios === 1

                            ? "1 usuario activo"

                            : `${limiteUsuarios} usuarios activos`;



                    return await renderizarErrorEdicion(
                        `No es posible activar este usuario. El plan ${suscripcionActual.plan_nombre} permite un máximo de ${textoLimite}.`,
                        409
                    );

                }

            }

        }



        /* -------------------------------------------------
           VALIDAR CORREO DUPLICADO
        ------------------------------------------------- */

        const correoExiste =
            await conexion.query(
                `
                SELECT

                    id

                FROM usuarios

                WHERE correo = ?

                AND id <> ?

                LIMIT 1
                `,
                [

                    correo,

                    usuarioId

                ]
            );



        if (
            correoExiste.length > 0
        ) {

            return await renderizarErrorEdicion(
                "El correo ya está registrado.",
                409
            );

        }



        /* -------------------------------------------------
           ACTUALIZAR USUARIO
        ------------------------------------------------- */

        await conexion.query(
            `
            UPDATE usuarios

            SET

                nombre = ?,

                apellido = ?,

                correo = ?,

                telefono = ?,

                rol_id = ?,

                estado = ?

            WHERE id = ?

            AND agencia_id = ?
            `,
            [

                nombre,

                apellido,

                correo,

                telefono,

                rolId,

                estado,

                usuarioId,

                agenciaId

            ]
        );



        return res.redirect(
            `/admin/agencias/${agenciaId}/usuarios`
        );



    } catch(error){


        console.error(
            "Error actualizando usuario:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible actualizar usuario."
            );



    } finally {


        if(conexion){

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR SUSCRIPCIONES
========================================================= */

async function mostrarSuscripciones(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const suscripciones =
            await conexion.query(
                `
                SELECT

                    a.id
                        AS agencia_id,

                    a.nombre
                        AS agencia_nombre,

                    a.correo
                        AS agencia_correo,

                    a.estado
                        AS agencia_estado,

                    s.id
                        AS suscripcion_id,

                    s.estado
                        AS suscripcion_estado,

                    s.fecha_inicio,

                    s.fecha_fin,

                    s.precio_acordado,

                    s.renovacion_automatica,

                    p.id
                        AS plan_id,

                    p.nombre
                        AS plan_nombre,

                    p.precio_mensual

                FROM agencias a


                LEFT JOIN suscripciones s

                    ON s.id = (

                        SELECT
                            s2.id

                        FROM suscripciones s2

                        WHERE
                            s2.agencia_id = a.id

                        ORDER BY
                            s2.id DESC

                        LIMIT 1

                    )


                LEFT JOIN planes p

                    ON p.id = s.plan_id


                ORDER BY
                    a.nombre ASC
                `
            );


        const estadisticas = {

            total:
                suscripciones.filter(
                    item =>
                        item.suscripcion_id
                ).length,

            activas:
                suscripciones.filter(
                    item =>
                        item.suscripcion_estado ===
                        "activa"
                ).length,

            prueba:
                suscripciones.filter(
                    item =>
                        item.suscripcion_estado ===
                        "prueba"
                ).length,

            suspendidas:
                suscripciones.filter(
                    item =>
                        item.suscripcion_estado ===
                        "suspendida"
                ).length

        };


       return res.render(
    "admin/suscripciones/index",
    {

        titulo:
            "Suscripciones",

        subtituloPagina:
            "Gestión de suscripciones",

        paginaActual:
            "suscripciones",

        usuario:
            req.session.usuario,

        suscripciones,

        estadisticas,

        mensajeExito:
            req.query.actualizada === "1"
                ? "La suscripción fue actualizada correctamente."
                : null

    }
);


    } catch (error) {

        console.error(
            "Error mostrando suscripciones:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar las suscripciones."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR SUSCRIPCIÓN DE AGENCIA
========================================================= */

async function mostrarSuscripcionAgencia(
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


        const agencias =
            await conexion.query(
                `
                SELECT

                    id,
                    nombre,
                    correo,
                    estado,
                    logo

                FROM agencias

                WHERE id = ?

                LIMIT 1
                `,
                [
                    agenciaId
                ]
            );


        if (
            agencias.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }


        const agencia =
            agencias[0];


        const planes =
    await conexion.query(
        `
        SELECT

            id,
            nombre,
            descripcion,
            precio_mensual,
            limite_vehiculos,
            limite_sucursales,
            limite_empleados,
            activo

        FROM planes

        WHERE

            activo = 1

            OR id = (

                SELECT
                    plan_id

                FROM suscripciones

                WHERE agencia_id = ?

                ORDER BY id DESC

                LIMIT 1

            )

        ORDER BY

            activo DESC,

            id ASC
        `,
        [
            agenciaId
        ]
    );


        const suscripciones =
            await conexion.query(
                `
                SELECT

                    s.id,
                    s.plan_id,

                    DATE_FORMAT(
                        s.fecha_inicio,
                        '%Y-%m-%d'
                    ) AS fecha_inicio,

                    DATE_FORMAT(
                        s.fecha_fin,
                        '%Y-%m-%d'
                    ) AS fecha_fin,

                    s.estado,
                    s.precio_acordado,
                    s.renovacion_automatica,

                    p.nombre
                        AS plan_nombre

                FROM suscripciones s

                INNER JOIN planes p
                    ON p.id = s.plan_id

                WHERE s.agencia_id = ?

                ORDER BY
                    s.id DESC

                LIMIT 1
                `,
                [
                    agenciaId
                ]
            );


        const resultadoHoy =
            await conexion.query(
                `
                SELECT
                    DATE_FORMAT(
                        CURDATE(),
                        '%Y-%m-%d'
                    ) AS hoy
                `
            );


        const hoy =
            resultadoHoy[0].hoy;


        const suscripcion =
            suscripciones.length
                ? suscripciones[0]
                : null;


        return res.render(
            "admin/suscripciones/editar",
            {

                titulo:
                    `Suscripción - ${agencia.nombre}`,

                subtituloPagina:
                    "Administrar suscripción",

                paginaActual:
                    "suscripciones",

                usuario:
                    req.session.usuario,

                agencia,

                planes,

                suscripcion,

                hoy

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando suscripción:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar la suscripción."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   ACTUALIZAR SUSCRIPCIÓN DE AGENCIA
========================================================= */

async function actualizarSuscripcionAgencia(
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


        const planId =
            Number(
                req.body.plan_id
            );


        const estado =
            String(
                req.body.estado ||
                ""
            ).trim();


        const fechaInicio =
            String(
                req.body.fecha_inicio ||
                ""
            ).trim();


        const fechaFin =
            String(
                req.body.fecha_fin ||
                ""
            ).trim();


        const precioTexto =
            String(
                req.body.precio_acordado ??
                ""
            ).trim();


        const precioAcordado =
            Number(
                precioTexto
            );


        const renovacionAutomatica =
            req.body.renovacion_automatica ===
            "1";


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Agencia inválida."
                );

        }


        if (
            !Number.isInteger(
                planId
            ) ||
            planId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Selecciona un plan válido."
                );

        }


        const estadosPermitidos = [

            "prueba",

            "activa",

            "vencida",

            "suspendida",

            "cancelada"

        ];


        if (
            !estadosPermitidos.includes(
                estado
            )
        ) {

            return res
                .status(400)
                .send(
                    "El estado de la suscripción no es válido."
                );

        }


        if (
            !esFechaISOValida(
                fechaInicio
            )
        ) {

            return res
                .status(400)
                .send(
                    "La fecha de inicio no es válida."
                );

        }


        if (
            fechaFin &&
            !esFechaISOValida(
                fechaFin
            )
        ) {

            return res
                .status(400)
                .send(
                    "La fecha de vencimiento no es válida."
                );

        }


        if (
            fechaFin &&
            fechaFin < fechaInicio
        ) {

            return res
                .status(400)
                .send(
                    "La fecha de vencimiento no puede ser anterior a la fecha de inicio."
                );

        }


        if (
            precioTexto === "" ||
            !Number.isFinite(
                precioAcordado
            ) ||
            precioAcordado < 0
        ) {

            return res
                .status(400)
                .send(
                    "Introduce un precio acordado válido."
                );

        }


        await conexion.beginTransaction();


        const agencias =
            await conexion.query(
                `
                SELECT
                    id
                FROM agencias
                WHERE id = ?
                LIMIT 1
                FOR UPDATE
                `,
                [
                    agenciaId
                ]
            );


        if (
            agencias.length === 0
        ) {

            await conexion.rollback();


            return res
                .status(404)
                .send(
                    "Agencia no encontrada."
                );

        }

       const planes =
    await conexion.query(
        `
        SELECT

            id,
            precio_mensual,
            activo

        FROM planes

        WHERE id = ?

        AND (

            activo = 1

            OR id = (

                SELECT
                    plan_id

                FROM suscripciones

                WHERE agencia_id = ?

                ORDER BY id DESC

                LIMIT 1

            )

        )

        LIMIT 1
        `,
        [

            planId,

            agenciaId

        ]
    );

        if (
            planes.length === 0
        ) {

            await conexion.rollback();


            return res
                .status(400)
                .send(
                    "El plan seleccionado no está disponible."
                );

        }


        const suscripciones =
            await conexion.query(
                `
                SELECT
                    id
                FROM suscripciones
                WHERE agencia_id = ?
                ORDER BY id DESC
                LIMIT 1
                FOR UPDATE
                `,
                [
                    agenciaId
                ]
            );


        if (
            suscripciones.length > 0
        ) {

            await conexion.query(
                `
                UPDATE suscripciones

                SET

                    plan_id = ?,

                    fecha_inicio = ?,

                    fecha_fin = ?,

                    estado = ?,

                    precio_acordado = ?,

                    renovacion_automatica = ?

                WHERE id = ?
                `,
                [

                    planId,

                    fechaInicio,

                    fechaFin ||
                        null,

                    estado,

                    precioAcordado,

                    renovacionAutomatica,

                    suscripciones[0].id

                ]
            );

        } else {

            await conexion.query(
                `
                INSERT INTO suscripciones (

                    agencia_id,

                    plan_id,

                    fecha_inicio,

                    fecha_fin,

                    estado,

                    precio_acordado,

                    renovacion_automatica

                )

                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                `,
                [

                    agenciaId,

                    planId,

                    fechaInicio,

                    fechaFin ||
                        null,

                    estado,

                    precioAcordado,

                    renovacionAutomatica

                ]
            );

        }


        /*
         * El estado de la agencia queda sincronizado
         * con su suscripción actual.
         */

        await conexion.query(
            `
            UPDATE agencias

            SET
                estado = ?

            WHERE id = ?
            `,
            [

                estado,

                agenciaId

            ]
        );


        await conexion.commit();


return res.redirect(
    "/admin/suscripciones?actualizada=1"
);


    } catch (error) {

        if (conexion) {

            try {

                await conexion.rollback();

            } catch {

                // La conexión puede no tener
                // una transacción activa.

            }

        }


        console.error(
            "Error actualizando suscripción:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible actualizar la suscripción."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR PLANES
========================================================= */

async function mostrarPlanes(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const planes =
            await conexion.query(
                `
                SELECT

                    id,

                    nombre,

                    descripcion,

                    precio_mensual,

                    limite_vehiculos,

                    limite_sucursales,

                    limite_empleados,

                    activo

                FROM planes

                ORDER BY
                    id ASC
                `
            );


        const estadisticas = {

            total:
                planes.length,

            activos:
                planes.filter(
                    plan =>
                        Number(plan.activo) === 1
                ).length,

            inactivos:
                planes.filter(
                    plan =>
                        Number(plan.activo) === 0
                ).length

        };


        return res.render(
            "admin/planes/index",
            {

                titulo:
                    "Planes",

                subtituloPagina:
                    "Gestión de planes",

                paginaActual:
                    "planes",

                usuario:
                    req.session.usuario,

                planes,

                estadisticas,

               mensajeExito:

    req.query.creado === "1"

        ? "El plan fue creado correctamente."

        : req.query.actualizado === "1"

            ? "El plan fue actualizado correctamente."

            : null

            }
        );


    } catch (error) {

        console.error(
            "Error mostrando planes:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar los planes."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR NUEVO PLAN
========================================================= */

async function mostrarNuevoPlan(
    req,
    res
) {

    return res.render(
        "admin/planes/nuevo",
        {

            titulo:
                "Nuevo plan",

            subtituloPagina:
                "Crear plan",

            paginaActual:
                "planes",

            usuario:
                req.session.usuario,

            error:
                null,

            datos:
                {}

        }
    );

}

/* =========================================================
   CREAR PLAN
========================================================= */

async function crearPlan(
    req,
    res
) {

    let conexion;


    const datos = {

        nombre:
            String(
                req.body.nombre ||
                ""
            ).trim(),

        descripcion:
            String(
                req.body.descripcion ||
                ""
            ).trim(),

        precio_mensual:
            String(
                req.body.precio_mensual ??
                ""
            ).trim(),

        limite_vehiculos:
            String(
                req.body.limite_vehiculos ??
                ""
            ).trim(),

        limite_sucursales:
            String(
                req.body.limite_sucursales ??
                ""
            ).trim(),

        limite_empleados:
            String(
                req.body.limite_empleados ??
                ""
            ).trim(),

        activo:
            req.body.activo === "0"
                ? 0
                : 1

    };


    try {

        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           VALIDAR NOMBRE
        ------------------------------------------------- */

        if (!datos.nombre) {

            return res
                .status(400)
                .render(
                    "admin/planes/nuevo",
                    {

                        titulo:
                            "Nuevo plan",

                        subtituloPagina:
                            "Crear plan",

                        paginaActual:
                            "planes",

                        usuario:
                            req.session.usuario,

                        datos,

                        error:
                            "El nombre del plan es obligatorio."

                    }
                );

        }

/* -------------------------------------------------
   VALIDAR LONGITUD DE CAMPOS
------------------------------------------------- */

if (
    datos.nombre.length > 80
) {

    return res
        .status(400)
        .render(
            "admin/planes/nuevo",
            {

                titulo:
                    "Nuevo plan",

                subtituloPagina:
                    "Crear plan",

                paginaActual:
                    "planes",

                usuario:
                    req.session.usuario,

                datos,

                error:
                    "El nombre del plan no puede superar los 80 caracteres."

            }
        );

}


if (
    datos.descripcion.length > 255
) {

    return res
        .status(400)
        .render(
            "admin/planes/nuevo",
            {

                titulo:
                    "Nuevo plan",

                subtituloPagina:
                    "Crear plan",

                paginaActual:
                    "planes",

                usuario:
                    req.session.usuario,

                datos,

                error:
                    "La descripción no puede superar los 255 caracteres."

            }
        );

}


        /* -------------------------------------------------
           VALIDAR PRECIO
        ------------------------------------------------- */

        const precioMensual =
            Number(
                datos.precio_mensual
            );


        if (
            datos.precio_mensual === "" ||
            !Number.isFinite(
                precioMensual
            ) ||
            precioMensual < 0
        ) {

            return res
                .status(400)
                .render(
                    "admin/planes/nuevo",
                    {

                        titulo:
                            "Nuevo plan",

                        subtituloPagina:
                            "Crear plan",

                        paginaActual:
                            "planes",

                        usuario:
                            req.session.usuario,

                        datos,

                        error:
                            "Introduce un precio mensual válido."

                    }
                );

        }


        /* -------------------------------------------------
           CONVERTIR Y VALIDAR LÍMITES
        ------------------------------------------------- */

        function convertirLimite(
            valor
        ) {

            if (
                valor === ""
            ) {

                return null;

            }


            const numero =
                Number(
                    valor
                );


            if (
                !Number.isInteger(
                    numero
                ) ||
                numero < 1
            ) {

                return false;

            }


            return numero;

        }


        const limiteVehiculos =
            convertirLimite(
                datos.limite_vehiculos
            );


        const limiteSucursales =
            convertirLimite(
                datos.limite_sucursales
            );


        const limiteEmpleados =
            convertirLimite(
                datos.limite_empleados
            );


        if (
            limiteVehiculos === false ||
            limiteSucursales === false ||
            limiteEmpleados === false
        ) {

            return res
                .status(400)
                .render(
                    "admin/planes/nuevo",
                    {

                        titulo:
                            "Nuevo plan",

                        subtituloPagina:
                            "Crear plan",

                        paginaActual:
                            "planes",

                        usuario:
                            req.session.usuario,

                        datos,

                        error:
                            "Los límites deben ser números enteros mayores que cero o dejarse vacíos para indicar que son ilimitados."

                    }
                );

        }


        /* -------------------------------------------------
           VALIDAR NOMBRE DUPLICADO
        ------------------------------------------------- */

        const planExistente =
            await conexion.query(
                `
                SELECT
                    id
                FROM planes
                WHERE LOWER(nombre) = LOWER(?)
                LIMIT 1
                `,
                [
                    datos.nombre
                ]
            );


        if (
            planExistente.length >
            0
        ) {

            return res
                .status(409)
                .render(
                    "admin/planes/nuevo",
                    {

                        titulo:
                            "Nuevo plan",

                        subtituloPagina:
                            "Crear plan",

                        paginaActual:
                            "planes",

                        usuario:
                            req.session.usuario,

                        datos,

                        error:
                            "Ya existe un plan registrado con ese nombre."

                    }
                );

        }


        /* -------------------------------------------------
           CREAR PLAN
        ------------------------------------------------- */

        await conexion.query(
            `
            INSERT INTO planes (

                nombre,

                descripcion,

                precio_mensual,

                limite_vehiculos,

                limite_sucursales,

                limite_empleados,

                activo

            )

            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
            `,
            [

                datos.nombre,

                datos.descripcion ||
                    null,

                precioMensual,

                limiteVehiculos,

                limiteSucursales,

                limiteEmpleados,

                datos.activo

            ]
        );


        return res.redirect(
            "/admin/planes?creado=1"
        );


    } catch (error) {

        console.error(
            "Error creando plan:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible crear el plan."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR EDITAR PLAN
========================================================= */

async function mostrarEditarPlan(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const planId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                planId
            ) ||
            planId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de plan inválido."
                );

        }


        const resultado =
            await conexion.query(
                `
                SELECT

                    id,

                    nombre,

                    descripcion,

                    precio_mensual,

                    limite_vehiculos,

                    limite_sucursales,

                    limite_empleados,

                    activo

                FROM planes

                WHERE id = ?

                LIMIT 1
                `,
                [
                    planId
                ]
            );


        if (
            resultado.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Plan no encontrado."
                );

        }


        return res.render(
            "admin/planes/editar",
            {

                titulo:
                    "Editar plan",

                subtituloPagina:
                    "Modificar plan",

                paginaActual:
                    "planes",

                usuario:
                    req.session.usuario,

                plan:
                    resultado[0],

                error:
                    null

            }
        );


    } catch (error) {

        console.error(
            "Error cargando plan:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el plan."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   ACTUALIZAR PLAN
========================================================= */

async function actualizarPlan(
    req,
    res
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const planId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                planId
            ) ||
            planId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "ID de plan inválido."
                );

        }


        const datos = {

            nombre:
                String(
                    req.body.nombre ||
                    ""
                ).trim(),

            descripcion:
                String(
                    req.body.descripcion ||
                    ""
                ).trim(),

            precio_mensual:
                String(
                    req.body.precio_mensual ??
                    ""
                ).trim(),

            limite_vehiculos:
                String(
                    req.body.limite_vehiculos ??
                    ""
                ).trim(),

            limite_sucursales:
                String(
                    req.body.limite_sucursales ??
                    ""
                ).trim(),

            limite_empleados:
                String(
                    req.body.limite_empleados ??
                    ""
                ).trim(),

            activo:
                req.body.activo === "0"
                    ? 0
                    : 1

        };


        function renderizarError(
            mensaje,
            estadoHttp = 400
        ) {

            return res
                .status(
                    estadoHttp
                )
                .render(
                    "admin/planes/editar",
                    {

                        titulo:
                            "Editar plan",

                        subtituloPagina:
                            "Modificar plan",

                        paginaActual:
                            "planes",

                        usuario:
                            req.session.usuario,

                        plan:
                        {

                            id:
                                planId,

                            nombre:
                                datos.nombre,

                            descripcion:
                                datos.descripcion,

                            precio_mensual:
                                datos.precio_mensual,

                            limite_vehiculos:
                                datos.limite_vehiculos,

                            limite_sucursales:
                                datos.limite_sucursales,

                            limite_empleados:
                                datos.limite_empleados,

                            activo:
                                datos.activo

                        },

                        error:
                            mensaje

                    }
                );

        }


        if (!datos.nombre) {

            return renderizarError(
                "El nombre del plan es obligatorio."
            );

        }

        if (
    datos.nombre.length > 80
) {

    return renderizarError(
        "El nombre del plan no puede superar los 80 caracteres."
    );

}


if (
    datos.descripcion.length > 255
) {

    return renderizarError(
        "La descripción no puede superar los 255 caracteres."
    );

}


        const precioMensual =
            Number(
                datos.precio_mensual
            );


        if (
            datos.precio_mensual === "" ||
            !Number.isFinite(
                precioMensual
            ) ||
            precioMensual < 0
        ) {

            return renderizarError(
                "Introduce un precio mensual válido."
            );

        }


        function convertirLimite(
            valor
        ) {

            if (valor === "") {

                return null;

            }


            const numero =
                Number(
                    valor
                );


            if (
                !Number.isInteger(
                    numero
                ) ||
                numero < 1
            ) {

                return false;

            }


            return numero;

        }


        const limiteVehiculos =
            convertirLimite(
                datos.limite_vehiculos
            );


        const limiteSucursales =
            convertirLimite(
                datos.limite_sucursales
            );


        const limiteEmpleados =
            convertirLimite(
                datos.limite_empleados
            );


        if (
            limiteVehiculos === false ||
            limiteSucursales === false ||
            limiteEmpleados === false
        ) {

            return renderizarError(
                "Los límites deben ser números enteros mayores que cero o dejarse vacíos para indicar que son ilimitados."
            );

        }


        const planActual =
            await conexion.query(
                `
                SELECT
                    id
                FROM planes
                WHERE id = ?
                LIMIT 1
                `,
                [
                    planId
                ]
            );


        if (
            planActual.length === 0
        ) {

            return res
                .status(404)
                .send(
                    "Plan no encontrado."
                );

        }


        const nombreDuplicado =
            await conexion.query(
                `
                SELECT
                    id
                FROM planes
                WHERE LOWER(nombre) = LOWER(?)
                AND id <> ?
                LIMIT 1
                `,
                [
                    datos.nombre,
                    planId
                ]
            );


        if (
            nombreDuplicado.length >
            0
        ) {

            return renderizarError(
                "Ya existe otro plan registrado con ese nombre.",
                409
            );

        }


        await conexion.query(
            `
            UPDATE planes

            SET

                nombre = ?,

                descripcion = ?,

                precio_mensual = ?,

                limite_vehiculos = ?,

                limite_sucursales = ?,

                limite_empleados = ?,

                activo = ?

            WHERE id = ?
            `,
            [

                datos.nombre,

                datos.descripcion ||
                    null,

                precioMensual,

                limiteVehiculos,

                limiteSucursales,

                limiteEmpleados,

                datos.activo,

                planId

            ]
        );


        return res.redirect(
            "/admin/planes?actualizado=1"
        );


    } catch (error) {

        console.error(
            "Error actualizando plan:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible actualizar el plan."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

module.exports = {

    mostrarDashboard,

    mostrarAgencias,

    mostrarNuevaAgencia,

    crearAgencia,

    mostrarDetalleAgencia,

    mostrarEditarAgencia,

   actualizarAgencia,

    mostrarUsuariosAgencia,

    mostrarNuevoUsuario,

    crearUsuarioAgencia,

    mostrarEditarUsuario,

    actualizarUsuario,

    mostrarSuscripciones,

    mostrarSuscripcionAgencia,

    actualizarSuscripcionAgencia,

    mostrarPlanes,

    mostrarNuevoPlan,

    crearPlan,

    mostrarEditarPlan,

    actualizarPlan

};