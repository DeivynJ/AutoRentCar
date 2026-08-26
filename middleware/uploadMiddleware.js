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