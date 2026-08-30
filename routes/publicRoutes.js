const express =
    require(
        "express"
    );

const path =
    require(
        "path"
    );


const {

    obtenerCatalogoAgencia

} = require(
    "../controllers/publicCatalogController"
);


const router =
    express.Router();


/* =========================================================
   FUNCIÓN PARA MOSTRAR PÁGINAS PÚBLICAS
========================================================= */

function mostrarPaginaPublica(
    nombreArchivo
) {

    return (
        req,
        res
    ) => {

        return res.sendFile(
            path.join(
                __dirname,
                "..",
                nombreArchivo
            )
        );

    };

}


/* =========================================================
   PÁGINAS PÚBLICAS - FASE 1
========================================================= */

router.get(
    "/index.html",
    mostrarPaginaPublica(
        "index.html"
    )
);


router.get(
    "/vehiculos.html",
    mostrarPaginaPublica(
        "vehiculos.html"
    )
);


router.get(
    "/reserva.html",
    mostrarPaginaPublica(
        "reserva.html"
    )
);


router.get(
    "/confirmacion.html",
    mostrarPaginaPublica(
        "confirmacion.html"
    )
);


router.get(
    "/mis-reservas.html",
    mostrarPaginaPublica(
        "mis-reservas.html"
    )
);


router.get(
    "/nosotros.html",
    mostrarPaginaPublica(
        "nosotros.html"
    )
);


router.get(
    "/contacto.html",
    mostrarPaginaPublica(
        "contacto.html"
    )
);


/* =========================================================
   API PÚBLICA
========================================================= */

router.get(
    "/api/agencias/:slug/catalogo",
    obtenerCatalogoAgencia
);


/* =========================================================
   EXPORTACIÓN
========================================================= */

module.exports =
    router;