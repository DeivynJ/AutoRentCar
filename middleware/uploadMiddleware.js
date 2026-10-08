const multer =
    require("multer");


/* =========================================================
   TIPOS DE IMAGEN PERMITIDOS
========================================================= */

const tiposPermitidos = [
    "image/png",
    "image/jpeg",
    "image/webp"
];


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

const upload = multer({

    /*
     * La imagen se recibe temporalmente en memoria.
     * El controlador decide en qué carpeta guardarla.
     */
    storage:
        multer.memoryStorage(),

    limits: {

        fileSize:
            3 * 1024 * 1024

    },

    fileFilter: (
        req,
        file,
        callback
    ) => {

        if (
            !tiposPermitidos.includes(
                file.mimetype
            )
        ) {

            return callback(
                new Error(
                    "El logo debe ser una imagen PNG, JPG, JPEG o WebP."
                )
            );

        }


        callback(
            null,
            true
        );

    }

});


/* =========================================================
   MIDDLEWARE LOGO DE AGENCIA
========================================================= */

function subirLogoAgencia(
    req,
    res,
    next
) {

    const middleware =
        upload.single(
            "logo"
        );


    middleware(
        req,
        res,
        (error) => {

            if (!error) {

    /*
     * El logo puede ser opcional al editar
     * una agencia.
     */

    if (!req.file) {

        return next();

    }


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


    if (
        tipoReal.mime !==
        req.file.mimetype
    ) {

        return res
            .status(400)
            .send(
                "El tipo declarado del logo no coincide con el contenido real del archivo."
            );

    }


    req.logoAgenciaSeguro = {

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

                return res
                    .status(400)
                    .send(
                        "El logo no puede superar los 3 MB."
                    );

            }


            return res
                .status(400)
                .send(
                    error.message ||
                    "No fue posible procesar el logo."
                );

        }
    );

}


module.exports = {

    subirLogoAgencia

};