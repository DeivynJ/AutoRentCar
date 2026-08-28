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