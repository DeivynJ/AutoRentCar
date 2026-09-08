const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   CONSTANTES
========================================================= */

const NIVELES_PERMITIDOS =
    new Set([
        "info",
        "exito",
        "advertencia",
        "critica"
    ]);


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorNotificacionAdmin(
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
   VALIDAR ID POSITIVO
========================================================= */

function validarIdPositivo(
    valor,
    nombreCampo
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            numero
        ) ||
        numero <= 0
    ) {

        throw crearErrorNotificacionAdmin(
            "ID_INVALIDO",
            `${nombreCampo} no es válido.`,
            400
        );

    }


    return numero;

}


/* =========================================================
   VALIDAR TEXTO
========================================================= */

function validarTextoObligatorio(
    valor,
    nombreCampo,
    maximo
) {

    const texto =
        String(
            valor ||
            ""
        ).trim();


    if (!texto) {

        throw crearErrorNotificacionAdmin(
            "CAMPO_OBLIGATORIO",
            `${nombreCampo} es obligatorio.`,
            400
        );

    }


    if (
        texto.length >
        maximo
    ) {

        throw crearErrorNotificacionAdmin(
            "CAMPO_DEMASIADO_LARGO",
            `${nombreCampo} no puede superar los ${maximo} caracteres.`,
            400
        );

    }


    return texto;

}


/* =========================================================
   VALIDAR TEXTO OPCIONAL
========================================================= */

function validarTextoOpcional(
    valor,
    nombreCampo,
    maximo
) {

    const texto =
        String(
            valor ||
            ""
        ).trim();


    if (!texto) {

        return null;

    }


    if (
        texto.length >
        maximo
    ) {

        throw crearErrorNotificacionAdmin(
            "CAMPO_DEMASIADO_LARGO",
            `${nombreCampo} no puede superar los ${maximo} caracteres.`,
            400
        );

    }


    return texto;

}


/* =========================================================
   VALIDAR DESTINO INTERNO DEL SUPERADMIN
========================================================= */

function validarDestinoAdmin(
    valor
) {

    const destino =
        String(
            valor ||
            ""
        ).trim();


    if (!destino) {

        return null;

    }


    if (
        destino.length >
        255
    ) {

        throw crearErrorNotificacionAdmin(
            "DESTINO_DEMASIADO_LARGO",
            "El destino de la notificación no puede superar los 255 caracteres.",
            400
        );

    }


    /*
     * No permitimos:
     *
     * https://sitio-externo.com
     * //sitio-externo.com
     * rutas con backslash
     * saltos de línea
     */

    if (
        destino.startsWith(
            "//"
        ) ||
        destino.includes(
            "\\"
        ) ||
        destino.includes(
            "\r"
        ) ||
        destino.includes(
            "\n"
        )
    ) {

        throw crearErrorNotificacionAdmin(
            "DESTINO_INVALIDO",
            "El destino de la notificación no es válido.",
            400
        );

    }


    let url;


    try {

        url =
            new URL(
                destino,
                "http://autorentcar.local"
            );

    } catch (error) {

        throw crearErrorNotificacionAdmin(
            "DESTINO_INVALIDO",
            "El destino de la notificación no es válido.",
            400
        );

    }


    if (
        url.origin !==
        "http://autorentcar.local"
    ) {

        throw crearErrorNotificacionAdmin(
            "DESTINO_EXTERNO",
            "Las notificaciones administrativas solo pueden dirigir a rutas internas.",
            400
        );

    }


    if (
        url.pathname !==
            "/admin" &&
        !url.pathname.startsWith(
            "/admin/"
        )
    ) {

        throw crearErrorNotificacionAdmin(
            "DESTINO_NO_ADMIN",
            "La notificación debe dirigir a una ruta del SuperAdministrador.",
            400
        );

    }


    return (
        url.pathname +
        url.search +
        url.hash
    );

}


/* =========================================================
   VALIDAR SUPERADMIN
========================================================= */

async function validarUsuarioSuperadmin(
    conexion,
    usuarioIdEntrada
) {

    const usuarioId =
        validarIdPositivo(
            usuarioIdEntrada,
            "El usuario"
        );


    const resultado =
        await conexion.query(
            `
            SELECT

                u.id,

                u.nombre,

                u.apellido,

                u.correo

            FROM usuarios u

            INNER JOIN roles r
                ON r.id = u.rol_id

            WHERE
                u.id = ?
                AND u.estado = 'activo'
                AND r.codigo = 'superadmin'
                AND r.activo = 1

            LIMIT 1
            `,
            [
                usuarioId
            ]
        );


    if (
        !resultado.length
    ) {

        throw crearErrorNotificacionAdmin(
            "SUPERADMIN_NO_VALIDO",
            "El usuario no tiene acceso a las notificaciones administrativas.",
            403
        );

    }


    return resultado[0];

}


/* =========================================================
   CREAR NOTIFICACIÓN
========================================================= */

async function crearNotificacionAdmin(
    datos,
    conexionExterna = null
) {

    let conexion =
        conexionExterna;

    let liberarConexion =
        false;


    try {

        if (!conexion) {

            conexion =
                await pool.getConnection();


            liberarConexion =
                true;

        }


        const categoria =
            validarTextoObligatorio(
                datos?.categoria,
                "La categoría",
                50
            );


        const tipo =
    validarTextoObligatorio(
        datos?.tipo,
        "El tipo",
        80
    );


const claveEvento =
    validarTextoOpcional(
        datos?.claveEvento,
        "La clave del evento",
        190
    );
    
    const titulo =
            validarTextoObligatorio(
                datos?.titulo,
                "El título",
                180
            );


        const mensaje =
            validarTextoObligatorio(
                datos?.mensaje,
                "El mensaje",
                500
            );


        const destinoUrl =
            validarDestinoAdmin(
                datos?.destinoUrl
            );


        const entidadTipo =
            validarTextoOpcional(
                datos?.entidadTipo,
                "El tipo de entidad",
                80
            );


        let entidadId =
            null;


        if (
            datos?.entidadId !== undefined &&
            datos?.entidadId !== null &&
            String(
                datos.entidadId
            ).trim() !== ""
        ) {

            entidadId =
                validarIdPositivo(
                    datos.entidadId,
                    "La entidad"
                );

        }


        const nivel =
            String(
                datos?.nivel ||
                "info"
            )
                .trim()
                .toLowerCase();


        if (
            !NIVELES_PERMITIDOS.has(
                nivel
            )
        ) {

            throw crearErrorNotificacionAdmin(
                "NIVEL_INVALIDO",
                "El nivel de la notificación no es válido.",
                400
            );

        }


        let resultado;


try {

    resultado =
        await conexion.query(
            `
            INSERT INTO notificaciones_admin
            (
                categoria,
                tipo,
                clave_evento,
                titulo,
                mensaje,
                destino_url,
                entidad_tipo,
                entidad_id,
                nivel
            )
            VALUES
            (
                ?,
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
                categoria,
                tipo,
                claveEvento,
                titulo,
                mensaje,
                destinoUrl,
                entidadTipo,
                entidadId,
                nivel
            ]
        );


} catch (error) {

    /*
     * Una clave de evento repetida significa
     * que esta alerta ya fue generada.
     *
     * No lo tratamos como fallo del sistema.
     */

    if (
        error?.code ===
            "ER_DUP_ENTRY" &&
        claveEvento
    ) {

        return {

            id:
                null,

            creada:
                false,

            duplicada:
                true,

            categoria,

            tipo,

            claveEvento,

            titulo,

            mensaje,

            destinoUrl,

            entidadTipo,

            entidadId,

            nivel

        };

    }


    throw error;

}

        return {

    id:
        Number(
            resultado.insertId
        ),

    creada:
        true,

    duplicada:
        false,

    categoria,

    tipo,

    claveEvento,

    titulo,

    mensaje,

    destinoUrl,

    entidadTipo,

    entidadId,

    nivel

};


    } finally {

        if (
            liberarConexion &&
            conexion
        ) {

            conexion.release();

        }

    }

}


/* =========================================================
   LISTAR NOTIFICACIONES DEL SUPERADMIN
========================================================= */

async function listarNotificacionesAdmin(
    usuarioIdEntrada,
    limiteEntrada = 8
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const usuario =
            await validarUsuarioSuperadmin(
                conexion,
                usuarioIdEntrada
            );


        let limite =
            Number(
                limiteEntrada
            );


        if (
            !Number.isInteger(
                limite
            ) ||
            limite < 1
        ) {

            limite =
                8;

        }


        limite =
            Math.min(
                limite,
                20
            );


        const notificaciones =
            await conexion.query(
                `
                SELECT

                    n.id,

                    n.categoria,

                    n.tipo,

                    n.titulo,

                    n.mensaje,

                    n.destino_url,

                    n.entidad_tipo,

                    n.entidad_id,

                    n.nivel,

                    n.fecha_creacion,

                    CASE

                        WHEN l.id IS NULL
                            THEN 0

                        ELSE 1

                    END AS leida

                FROM notificaciones_admin n

                LEFT JOIN notificacion_lecturas_admin l

                    ON l.notificacion_id = n.id
                    AND l.usuario_id = ?

                ORDER BY
                    n.fecha_creacion DESC,
                    n.id DESC

                LIMIT ${limite}
                `,
                [
                    usuario.id
                ]
            );


        return notificaciones.map(
            notificacion => ({
                ...notificacion,

                leida:
                    Boolean(
                        Number(
                            notificacion.leida
                        )
                    )
            })
        );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   CONTAR NO LEÍDAS
========================================================= */

async function contarNotificacionesAdminNoLeidas(
    usuarioIdEntrada
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const usuario =
            await validarUsuarioSuperadmin(
                conexion,
                usuarioIdEntrada
            );


        const resultado =
            await conexion.query(
                `
                SELECT

                    COUNT(*) AS total

                FROM notificaciones_admin n

                WHERE NOT EXISTS
                (
                    SELECT
                        1

                    FROM notificacion_lecturas_admin l

                    WHERE
                        l.notificacion_id = n.id
                        AND l.usuario_id = ?
                )
                `,
                [
                    usuario.id
                ]
            );


        return Number(
            resultado[0]
                ?.total ||
            0
        );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   OBTENER UNA NOTIFICACIÓN
========================================================= */

async function obtenerNotificacionAdmin(
    usuarioIdEntrada,
    notificacionIdEntrada
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const usuario =
            await validarUsuarioSuperadmin(
                conexion,
                usuarioIdEntrada
            );


        const notificacionId =
            validarIdPositivo(
                notificacionIdEntrada,
                "La notificación"
            );


        const resultado =
            await conexion.query(
                `
                SELECT

                    n.id,

                    n.categoria,

                    n.tipo,

                    n.titulo,

                    n.mensaje,

                    n.destino_url,

                    n.entidad_tipo,

                    n.entidad_id,

                    n.nivel,

                    n.fecha_creacion,

                    CASE

                        WHEN l.id IS NULL
                            THEN 0

                        ELSE 1

                    END AS leida

                FROM notificaciones_admin n

                LEFT JOIN notificacion_lecturas_admin l

                    ON l.notificacion_id = n.id
                    AND l.usuario_id = ?

                WHERE
                    n.id = ?

                LIMIT 1
                `,
                [
                    usuario.id,
                    notificacionId
                ]
            );


        if (
            !resultado.length
        ) {

            throw crearErrorNotificacionAdmin(
                "NOTIFICACION_NO_ENCONTRADA",
                "La notificación administrativa no existe.",
                404
            );

        }


        return {

            ...resultado[0],

            leida:
                Boolean(
                    Number(
                        resultado[0].leida
                    )
                )

        };


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   MARCAR COMO LEÍDA
========================================================= */

async function marcarNotificacionAdminLeida(
    usuarioIdEntrada,
    notificacionIdEntrada
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const usuario =
            await validarUsuarioSuperadmin(
                conexion,
                usuarioIdEntrada
            );


        const notificacionId =
            validarIdPositivo(
                notificacionIdEntrada,
                "La notificación"
            );


        const notificacion =
            await conexion.query(
                `
                SELECT

                    id,

                    destino_url

                FROM notificaciones_admin

                WHERE id = ?

                LIMIT 1
                `,
                [
                    notificacionId
                ]
            );


        if (
            !notificacion.length
        ) {

            throw crearErrorNotificacionAdmin(
                "NOTIFICACION_NO_ENCONTRADA",
                "La notificación administrativa no existe.",
                404
            );

        }


        /*
         * INSERT IGNORE hace la operación idempotente.
         *
         * Si ya fue leída por este SuperAdmin,
         * no se crea una segunda lectura.
         */

        await conexion.query(
            `
            INSERT IGNORE INTO notificacion_lecturas_admin
            (
                notificacion_id,
                usuario_id
            )
            VALUES
            (
                ?,
                ?
            )
            `,
            [
                notificacionId,
                usuario.id
            ]
        );


        const destinoSeguro =
    validarDestinoAdmin(
        notificacion[0]
            .destino_url
    ) ||
    "/admin";


return {

    ok:
        true,

    notificacionId,

    destinoUrl:
        destinoSeguro

};


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

    crearNotificacionAdmin,

    listarNotificacionesAdmin,

    contarNotificacionesAdminNoLeidas,

    obtenerNotificacionAdmin,

    marcarNotificacionAdminLeida

};