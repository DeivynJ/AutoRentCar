const multer =
    require(
        "multer"
    );


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const MAXIMO_COMPROBANTE =
    5 *
    1024 *
    1024;


const tiposMimePermitidos =
    new Set(
        [
            "image/jpeg",
            "image/png",
            "application/pdf"
        ]
    );


/* =========================================================
   DETECTAR TIPO REAL DEL ARCHIVO
========================================================= */

function detectarTipoReal(
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
       PDF

       %PDF-
    ------------------------------------------------- */

    if (
        buffer.length >= 5 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46 &&
        buffer[4] === 0x2D
    ) {

        return {

            mime:
                "application/pdf",

            extension:
                ".pdf"

        };

    }


    return null;

}


/* =========================================================
   CONFIGURACIÓN DE MULTER
========================================================= */

const uploadComprobante =
    multer(
        {

            /*
             * El archivo permanece únicamente en memoria.
             *
             * Todavía NO se escribe en:
             * - public
             * - img
             * - uploads públicos
             */

            storage:
                multer.memoryStorage(),


            limits:
            {

                fileSize:
                    MAXIMO_COMPROBANTE,

                files:
                    1,

                fields:
                    10,

                fieldSize:
                    1024 *
                    1024

            },


            /*
             * Esta primera comprobación evita tipos
             * declarados evidentemente incorrectos.
             *
             * Más abajo verificamos también la firma
             * REAL del contenido.
             */

            fileFilter:
                (
                    req,
                    file,
                    callback
                ) =>
                {

                    if (
                        !tiposMimePermitidos.has(
                            file.mimetype
                        )
                    ) {

                        return callback(
                            new Error(
                                "El comprobante debe estar en formato JPG, JPEG, PNG o PDF."
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
   PROCESAR COMPROBANTE
========================================================= */

function subirComprobantePago(
    req,
    res,
    next
) {

    uploadComprobante.single(
        "comprobante"
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
                                "El comprobante no puede superar los 5 MB."
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
                                "Solo puedes enviar un comprobante."
                            );

                    }

                }


                return res
                    .status(400)
                    .send(
                        error.message ||
                        "No fue posible procesar el comprobante."
                    );

            }


            /*
             * Puede no existir archivo.
             *
             * No lo rechazamos aquí porque la exigencia
             * del comprobante depende del método de pago
             * configurado por la agencia.
             *
             * Esa decisión la tomará el servicio.
             */

            if (!req.file) {

                return next();

            }


            /* -------------------------------------------------
               VALIDACIÓN DEL CONTENIDO REAL
            ------------------------------------------------- */

            const tipoReal =
                detectarTipoReal(
                    req.file.buffer
                );


            if (!tipoReal) {

                return res
                    .status(400)
                    .send(
                        "El contenido del comprobante no corresponde a un archivo JPG, JPEG, PNG o PDF válido."
                    );

            }


            /*
             * También exigimos coincidencia entre:
             *
             * tipo declarado
             * +
             * tipo detectado en el contenido.
             */

            if (
                tipoReal.mime !==
                req.file.mimetype
            ) {

                return res
                    .status(400)
                    .send(
                        "El tipo declarado del comprobante no coincide con el contenido real del archivo."
                    );

            }


            /*
             * Guardamos información segura detectada
             * por el servidor para utilizarla más adelante.
             *
             * NO confiaremos en la extensión original.
             */

            req.comprobantePagoSeguro =
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

    subirComprobantePago

};