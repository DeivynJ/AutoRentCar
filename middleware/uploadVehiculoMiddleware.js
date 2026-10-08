const multer =
    require(
        "multer"
    );


/* =========================================================
   TIPOS DE IMAGEN PERMITIDOS
========================================================= */

const tiposPermitidos =
    new Set(
        [
            "image/jpeg",
            "image/png",
            "image/webp"
        ]
    );

/* =========================================================
   DETECTAR TIPO REAL DE IMAGEN
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


    /* PNG */
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


    /* JPEG / JPG */
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


    /* WEBP */
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
   CONFIGURACIÓN MULTER
========================================================= */

const uploadImagenModelo =
    multer(
        {

            storage:
                multer.memoryStorage(),

            limits:
            {

                fileSize:
                    5 *
                    1024 *
                    1024

            },

            fileFilter:
                (
                    req,
                    file,
                    callback
                ) =>
                {

                    if (
                        !tiposPermitidos.has(
                            file.mimetype
                        )
                    ) {

                        return callback(
                            new Error(
                                "La imagen debe estar en formato JPG, PNG o WEBP."
                            )
                        );

                    }


                    callback(
                        null,
                        true
                    );

                }

        }
    );


/* =========================================================
   SUBIR IMAGEN PRINCIPAL DEL MODELO
========================================================= */

function subirImagenModelo(
    req,
    res,
    next
) {

    uploadImagenModelo.single(
        "imagen"
    )(
        req,
        res,
        error =>
        {

            if (!error) {

    /*
     * La imagen puede ser opcional
     * al editar un modelo.
     */

    if (!req.file) {

        return next();

    }


    const tipoReal =
        detectarTipoRealImagen(
            req.file.buffer
        );


    if (!tipoReal) {

        req.errorSubidaImagen =
            "El contenido del archivo no corresponde a una imagen JPG, PNG o WEBP válida.";

        req.file =
            undefined;

        return next();

    }


    if (
        tipoReal.mime !==
        req.file.mimetype
    ) {

        req.errorSubidaImagen =
            "El tipo declarado de la imagen no coincide con el contenido real del archivo.";

        req.file =
            undefined;

        return next();

    }


    req.imagenModeloSegura = {

        mime:
            tipoReal.mime,

        extension:
            tipoReal.extension,

        tamano:
            req.file.size

    };


    return next();

}


            if (
                error instanceof
                    multer.MulterError &&
                error.code ===
                    "LIMIT_FILE_SIZE"
            ) {

                req.errorSubidaImagen =
                    "La imagen no puede superar los 5 MB.";

                return next();

            }


            req.errorSubidaImagen =
                error.message ||
                "No fue posible procesar la imagen seleccionada.";


            return next();

        }
    );

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    subirImagenModelo

};