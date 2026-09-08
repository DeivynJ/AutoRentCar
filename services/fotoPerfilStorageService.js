/* =========================================================
   AUTORENTCAR
   ALMACENAMIENTO DE FOTO DE PERFIL
========================================================= */

const fs =
    require(
        "fs"
    );


const path =
    require(
        "path"
    );


const crypto =
    require(
        "crypto"
    );


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const EXTENSIONES_PERMITIDAS =
    new Set(
        [
            ".png",
            ".jpg",
            ".webp"
        ]
    );


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorFotoPerfil(
    codigo,
    mensaje,
    status = 500
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
   VALIDAR ID
========================================================= */

function validarUsuarioId(
    valor
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

        throw crearErrorFotoPerfil(
            "USUARIO_INVALIDO",
            "El usuario no es válido.",
            400
        );

    }


    return numero;

}


/* =========================================================
   VALIDAR EXTENSIÓN
========================================================= */

function validarExtension(
    valor
) {

    const extension =
        String(
            valor ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        !EXTENSIONES_PERMITIDAS.has(
            extension
        )
    ) {

        throw crearErrorFotoPerfil(
            "EXTENSION_INVALIDA",
            "La extensión de la imagen no está permitida.",
            400
        );

    }


    return extension;

}


/* =========================================================
   OBTENER DIRECTORIO DEL USUARIO
========================================================= */

function obtenerDirectorioUsuario(
    usuarioId
) {

    return path.resolve(
        __dirname,
        "..",
        "img",
        "usuarios",
        String(
            usuarioId
        )
    );

}


/* =========================================================
   GUARDAR NUEVA FOTO
========================================================= */

async function guardarNuevaFotoPerfil(
    usuarioIdEntrada,
    bufferEntrada,
    extensionEntrada
) {

    const usuarioId =
        validarUsuarioId(
            usuarioIdEntrada
        );


    if (
        !Buffer.isBuffer(
            bufferEntrada
        ) ||
        bufferEntrada.length <= 0
    ) {

        throw crearErrorFotoPerfil(
            "IMAGEN_VACIA",
            "La imagen de perfil no contiene información válida.",
            400
        );

    }


    const extension =
        validarExtension(
            extensionEntrada
        );


    const directorio =
        obtenerDirectorioUsuario(
            usuarioId
        );


    await fs.promises.mkdir(
        directorio,
        {
            recursive:
                true
        }
    );


    /*
     * Cada nueva foto usa un nombre diferente.
     *
     * Así NO necesitamos borrar la foto anterior
     * antes de actualizar MariaDB.
     */

    for (
        let intento = 0;
        intento < 5;
        intento += 1
    ) {

        const identificador =
            crypto
                .randomBytes(
                    18
                )
                .toString(
                    "hex"
                );


        const nombreArchivo =
            `perfil-${identificador}${extension}`;


        const rutaAbsoluta =
            path.join(
                directorio,
                nombreArchivo
            );


        try {

            await fs.promises.writeFile(
                rutaAbsoluta,
                bufferEntrada,
                {
                    flag:
                        "wx"
                }
            );


            const rutaPublica =
                `/img/usuarios/${
                    usuarioId
                }/${
                    nombreArchivo
                }`;


            return {

                usuarioId,

                nombreArchivo,

                rutaAbsoluta,

                rutaPublica,

                extension,

                tamano:
                    bufferEntrada.length

            };

        } catch (error) {

            if (
                error.code ===
                "EEXIST"
            ) {

                continue;

            }


            throw crearErrorFotoPerfil(
                "ERROR_GUARDANDO_IMAGEN",
                "No fue posible guardar la nueva imagen de perfil.",
                500
            );

        }

    }


    throw crearErrorFotoPerfil(
        "ERROR_GENERANDO_NOMBRE",
        "No fue posible generar un nombre seguro para la imagen.",
        500
    );

}


/* =========================================================
   ELIMINAR FOTO
========================================================= */

async function eliminarFotoPerfil(
    usuarioIdEntrada,
    rutaPublicaEntrada
) {

    const usuarioId =
        validarUsuarioId(
            usuarioIdEntrada
        );


    const rutaPublica =
        String(
            rutaPublicaEntrada ||
            ""
        ).trim();


    if (!rutaPublica) {

        return false;

    }


    const prefijoEsperado =
        `/img/usuarios/${usuarioId}/`;


    /*
     * Nunca permitimos eliminar archivos pertenecientes
     * a otro usuario ni rutas fuera de img/usuarios.
     */

    if (
        !rutaPublica.startsWith(
            prefijoEsperado
        )
    ) {

        throw crearErrorFotoPerfil(
            "RUTA_IMAGEN_INVALIDA",
            "La imagen no pertenece al usuario indicado.",
            400
        );

    }


    const nombreArchivo =
        path.basename(
            rutaPublica
        );


    const directorio =
        obtenerDirectorioUsuario(
            usuarioId
        );


    const rutaAbsoluta =
        path.resolve(
            directorio,
            nombreArchivo
        );


    const rutaRelativa =
        path.relative(
            directorio,
            rutaAbsoluta
        );


    if (
        !rutaRelativa ||
        rutaRelativa.startsWith(
            ".."
        ) ||
        path.isAbsolute(
            rutaRelativa
        )
    ) {

        throw crearErrorFotoPerfil(
            "RUTA_IMAGEN_INVALIDA",
            "La ruta de la imagen no es válida.",
            400
        );

    }


    try {

        await fs.promises.unlink(
            rutaAbsoluta
        );


        return true;

    } catch (error) {

        if (
            error.code ===
            "ENOENT"
        ) {

            return false;

        }


        throw crearErrorFotoPerfil(
            "ERROR_ELIMINANDO_IMAGEN",
            "No fue posible eliminar la imagen de perfil.",
            500
        );

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    guardarNuevaFotoPerfil,
    eliminarFotoPerfil

};