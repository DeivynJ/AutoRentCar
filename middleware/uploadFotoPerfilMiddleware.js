const multer =
    require(
        "multer"
    );


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const MAXIMO_FOTO_PERFIL =
    3 *
    1024 *
    1024;


const TIPOS_MIME_PERMITIDOS =
    new Set(
        [
            "image/png",
            "image/jpeg",
            "image/webp"
        ]
    );


/* =========================================================
   DETECTAR TIPO REAL
========================================================= */

function detectarTipoRealImagen(
    buffer
) {

    if (
        !Buffer.isBuffer(
            buffer
        ) ||
        !buffer.length
    ) {

        return null;

    }


    /* -------------------------------------------------
       PNG

       89 50 4E 47 0D 0A 1A 0A
    ------------------------------------------------- */

    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A
    ) {

        return {

            mime:
                "image/png",

            extension:
                ".png"

        };

    }


    /* -------------------------------------------------
       JPEG / JPG

       FF D8 FF
    ------------------------------------------------- */

    if (
        buffer.length >= 3 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF
    ) {

        return {

            mime:
                "image/jpeg",

            extension:
                ".jpg"

        };

    }


    /* -------------------------------------------------
       WEBP

       RIFF .... WEBP
    ------------------------------------------------- */

    if (
        buffer.length >= 12 &&

        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&

        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
    ) {

        return {

            mime:
                "image/webp",

            extension:
                ".webp"

        };

    }


    return null;

}


/* =========================================================
   CONFIGURAR MULTER
========================================================= */

const uploadFotoPerfil =
    multer(
        {

            /*
             * La imagen permanece temporalmente
             * en memoria.
             *
             * Todavía NO se escribe en disco.
             */

            storage:
                multer.memoryStorage(),


            limits:
            {

                fileSize:
                    MAXIMO_FOTO_PERFIL,

                files:
                    1,

                fields:
                    5

            },


            /*
             * Primera barrera:
             * comprobar el MIME declarado.
             *
             * Después comprobaremos el contenido real.
             */

            fileFilter:
                (
                    req,
                    file,
                    callback
                ) =>
                {

                    if (
                        !TIPOS_MIME_PERMITIDOS.has(
                            file.mimetype
                        )
                    ) {

                        return callback(
                            new Error(
                                "La imagen debe estar en formato PNG, JPG, JPEG o WebP."
                            )
                        );

                    }


                    return callback(
                        null,
                        true
                    );

                }

        }
    );


/* =========================================================
   SUBIR FOTO DE PERFIL
========================================================= */

function subirFotoPerfil(
    req,
    res,
    next
) {

    uploadFotoPerfil.single(
        "foto_perfil"
    )(
        req,
        res,
        error =>
        {

            /* -------------------------------------------------
               ERRORES DE MULTER
            ------------------------------------------------- */

            if (error) {

                if (
                    error instanceof
                    multer.MulterError
                ) {

                    if (
                        error.code ===
                        "LIMIT_FILE_SIZE"
                    ) {

                        return res
                            .status(400)
                            .send(
                                "La imagen de perfil no puede superar los 3 MB."
                            );

                    }


                    if (
                        error.code ===
                        "LIMIT_FILE_COUNT" ||
                        error.code ===
                        "LIMIT_UNEXPECTED_FILE"
                    ) {

                        return res
                            .status(400)
                            .send(
                                "Solo puedes enviar una imagen de perfil."
                            );

                    }

                }


                return res
                    .status(400)
                    .send(
                        error.message ||
                        "No fue posible procesar la imagen de perfil."
                    );

            }


            /*
 * La imagen es opcional.
 *
 * Si el usuario solo está actualizando
 * nombre, correo, teléfono, etc.,
 * permitimos continuar sin archivo.
 */

if (!req.file) {

    req.fotoPerfilSegura =
        null;


    return next();

}


            /* -------------------------------------------------
               VALIDAR CONTENIDO REAL
            ------------------------------------------------- */

            const tipoReal =
                detectarTipoRealImagen(
                    req.file.buffer
                );


            if (!tipoReal) {

                return res
                    .status(400)
                    .send(
                        "El contenido del archivo no corresponde a una imagen PNG, JPG, JPEG o WebP válida."
                    );

            }


            /*
             * El MIME declarado debe coincidir
             * con lo encontrado en los bytes reales.
             */

            if (
                tipoReal.mime !==
                req.file.mimetype
            ) {

                return res
                    .status(400)
                    .send(
                        "El tipo declarado de la imagen no coincide con su contenido real."
                    );

            }


            /*
             * Datos determinados por el servidor.
             *
             * Nunca utilizaremos la extensión
             * del nombre original para guardar la imagen.
             */

            req.fotoPerfilSegura =
            {

                mime:
                    tipoReal.mime,

                extension:
                    tipoReal.extension,

                tamano:
                    req.file.size

            };


            return next();

        }
    );

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    subirFotoPerfil

};