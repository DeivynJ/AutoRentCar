/* =========================================================
   AVYNEXO
   CONFIGURACIÓN DEL PERFIL DEL ADMINISTRADOR DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


const {
    guardarNuevaFotoPerfil,
    eliminarFotoPerfil
} = require(
    "../services/fotoPerfilStorageService"
);


/* =========================================================
   OBTENER USUARIO AUTENTICADO
========================================================= */

function obtenerUsuarioId(
    req
) {

    const usuarioId =
        Number(
            req.usuarioAgencia?.id
        );


    if (
        !Number.isInteger(
            usuarioId
        ) ||
        usuarioId <= 0
    ) {

        const error =
            new Error(
                "No fue posible determinar el usuario autenticado."
            );


        error.status =
            401;


        throw error;

    }


    return usuarioId;

}


/* =========================================================
   OBTENER AGENCIA AUTENTICADA
========================================================= */

function obtenerAgenciaId(
    req
) {

    const agenciaId =
        Number(
            req.agencia?.id
        );


    if (
        !Number.isInteger(
            agenciaId
        ) ||
        agenciaId <= 0
    ) {

        const error =
            new Error(
                "No fue posible determinar la agencia autenticada."
            );


        error.status =
            403;


        throw error;

    }


    return agenciaId;

}


/* =========================================================
   CONSULTAR PERFIL
========================================================= */

async function consultarPerfil(
    conexion,
    usuarioId,
    agenciaId
) {

    const resultado =
        await conexion.query(
            `
            SELECT
                u.id,
                u.nombre,
                u.apellido,
                u.correo,
                u.foto_perfil,
                u.estado,

                r.nombre AS rol_nombre,
                r.codigo AS rol_codigo

            FROM usuarios u

            INNER JOIN roles r
                ON r.id = u.rol_id

            WHERE
                u.id = ?
                AND u.agencia_id = ?

            LIMIT 1
            `,
            [
                usuarioId,
                agenciaId
            ]
        );


    return resultado[0] ||
        null;

}


/* =========================================================
   RENDERIZAR PERFIL
========================================================= */

function renderizarPerfil(
    req,
    res,
    {
        perfil,
        resultado = "",
        mensaje = "",
        error = null,
        status = 200
    }
) {

    return res
        .status(
            status
        )
        .render(
            "panel/configuracion/perfil",
            {

                titulo:
                    "Mi perfil",

                subtituloPagina:
                    "Configuración de cuenta",

                paginaActual:
                    "configuracion-perfil",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                perfil,

                resultado,

                mensaje,

                error

            }
        );

}


/* =========================================================
   MOSTRAR PERFIL
========================================================= */

async function mostrarConfiguracionPerfilPanel(
    req,
    res
) {

    let conexion;


    try {

        const usuarioId =
            obtenerUsuarioId(
                req
            );


        const agenciaId =
            obtenerAgenciaId(
                req
            );


        conexion =
            await pool.getConnection();


        const perfil =
            await consultarPerfil(
                conexion,
                usuarioId,
                agenciaId
            );


        if (!perfil) {

            return res
                .status(404)
                .send(
                    "No fue posible localizar el perfil del usuario."
                );

        }


        return renderizarPerfil(
            req,
            res,
            {

                perfil,

                resultado:
                    String(
                        req.query?.resultado ||
                        ""
                    ).trim(),

                mensaje:
                    String(
                        req.query?.mensaje ||
                        ""
                    ).trim()

            }
        );


    } catch (error) {

        console.error(
            "Error cargando el perfil del administrador de agencia:",
            error
        );


        return res
            .status(
                error.status ||
                500
            )
            .send(
                error.status
                    ? error.message
                    : "No fue posible cargar el perfil."
            );

    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   ACTUALIZAR PERFIL
========================================================= */

async function actualizarConfiguracionPerfilPanel(
    req,
    res
) {

    let conexion;

    let usuarioId =
        null;

    let agenciaId =
        null;

    let perfilActual =
        null;

    let nuevaFotoGuardada =
        null;

    let fotoAnterior =
        null;

    let perfilActualizado =
        false;


    try {

        usuarioId =
            obtenerUsuarioId(
                req
            );


        agenciaId =
            obtenerAgenciaId(
                req
            );


        conexion =
            await pool.getConnection();


        perfilActual =
            await consultarPerfil(
                conexion,
                usuarioId,
                agenciaId
            );


        if (!perfilActual) {

            return res
                .status(404)
                .send(
                    "No fue posible localizar el perfil del usuario."
                );

        }


        fotoAnterior =
            perfilActual.foto_perfil ||
            null;


        /* -------------------------------------------------
           DATOS PERMITIDOS

           No recibimos:
           - usuarioId
           - agenciaId

           Ambos proceden exclusivamente
           del contexto autenticado.
        ------------------------------------------------- */

        const datos =
        {

            nombre:
                String(
                    req.body?.nombre ||
                    ""
                ).trim(),

            apellido:
                String(
                    req.body?.apellido ||
                    ""
                ).trim()

        };


        const perfilRender =
        {

            ...perfilActual,

            nombre:
                datos.nombre,

            apellido:
                datos.apellido

        };


        /* -------------------------------------------------
           VALIDACIONES
        ------------------------------------------------- */

        if (!datos.nombre) {

            return renderizarPerfil(
                req,
                res,
                {

                    perfil:
                        perfilRender,

                    error:
                        "El nombre es obligatorio.",

                    status:
                        400

                }
            );

        }


        if (
            datos.nombre.length >
            120
        ) {

            return renderizarPerfil(
                req,
                res,
                {

                    perfil:
                        perfilRender,

                    error:
                        "El nombre no puede superar los 120 caracteres.",

                    status:
                        400

                }
            );

        }


        if (
            datos.apellido.length >
            120
        ) {

            return renderizarPerfil(
                req,
                res,
                {

                    perfil:
                        perfilRender,

                    error:
                        "El apellido no puede superar los 120 caracteres.",

                    status:
                        400

                }
            );

        }


        /* -------------------------------------------------
           GUARDAR NUEVA FOTO

           La imagen ya fue validada por:
           uploadFotoPerfilMiddleware.js
        ------------------------------------------------- */

        if (
            req.file &&
            req.fotoPerfilSegura
        ) {

            nuevaFotoGuardada =
                await guardarNuevaFotoPerfil(
                    usuarioId,
                    req.file.buffer,
                    req.fotoPerfilSegura.extension
                );

        }


        /* -------------------------------------------------
           ACTUALIZAR USUARIO

           Seguridad multiagencia:
           ID de usuario + ID de agencia autenticada.
        ------------------------------------------------- */

        await conexion.query(
            `
            UPDATE usuarios

            SET
                nombre = ?,
                apellido = ?,
                foto_perfil = ?

            WHERE
                id = ?
                AND agencia_id = ?
            `,
            [

                datos.nombre,

                datos.apellido ||
                    null,

                nuevaFotoGuardada
                    ?.rutaPublica ||
                fotoAnterior,

                usuarioId,

                agenciaId

            ]
        );


        perfilActualizado =
            true;


        /* -------------------------------------------------
           ACTUALIZAR SESIÓN
        ------------------------------------------------- */

        if (
            req.session?.usuario
        ) {

            req.session.usuario.nombre =
                datos.nombre;


            req.session.usuario.apellido =
                datos.apellido ||
                null;


            req.session.usuario.foto_perfil =
                nuevaFotoGuardada
                    ?.rutaPublica ||
                fotoAnterior;

        }


        /* -------------------------------------------------
           ELIMINAR FOTO ANTERIOR

           Solo después de que la nueva foto
           haya quedado registrada en MariaDB.
        ------------------------------------------------- */

        if (
            nuevaFotoGuardada &&
            fotoAnterior &&
            fotoAnterior !==
                nuevaFotoGuardada.rutaPublica
        ) {

            try {

                await eliminarFotoPerfil(
                    usuarioId,
                    fotoAnterior
                );


            } catch (
                errorEliminandoFotoAnterior
            ) {

                console.error(
                    "El perfil se actualizó, pero no fue posible eliminar la fotografía anterior:",
                    errorEliminandoFotoAnterior
                );

            }

        }


        return res.redirect(
            "/panel/configuracion/perfil?resultado=guardado"
        );


    } catch (error) {

        /* -------------------------------------------------
           LIMPIAR FOTO NUEVA SI MARIA DB FALLÓ
        ------------------------------------------------- */

        if (
            nuevaFotoGuardada &&
            !perfilActualizado
        ) {

            try {

                await eliminarFotoPerfil(
                    usuarioId,
                    nuevaFotoGuardada.rutaPublica
                );


            } catch (
                errorLimpiandoFoto
            ) {

                console.error(
                    "No fue posible limpiar la nueva fotografía después del error:",
                    errorLimpiandoFoto
                );

            }

        }


        console.error(
            "Error actualizando el perfil del administrador de agencia:",
            error
        );


        if (
            perfilActual &&
            !res.headersSent
        ) {

            return renderizarPerfil(
                req,
                res,
                {

                    perfil:
                        perfilActual,

                    error:
                        error.message ||
                        "No fue posible actualizar el perfil.",

                    status:
                        error.status ||
                        500

                }
            );

        }


        if (
            !res.headersSent
        ) {

            return res
                .status(
                    error.status ||
                    500
                )
                .send(
                    "No fue posible actualizar el perfil."
                );

        }

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

    mostrarConfiguracionPerfilPanel,
    actualizarConfiguracionPerfilPanel

};