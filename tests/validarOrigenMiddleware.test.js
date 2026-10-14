const test =
    require("node:test");

const assert =
    require("node:assert/strict");

const {
    validarOrigenMismaAplicacion
} = require(
    "../middleware/validarOrigenMiddleware"
);


/* =========================================================
   CREAR REQUEST FICTICIO
========================================================= */

function crearRequest({
    method = "POST",
    origin = null,
    referer = null
} = {}) {

    return {

        method,

        get(nombre) {

            const encabezado =
                String(nombre)
                    .toLowerCase();


            if (
                encabezado ===
                "origin"
            ) {

                return origin;

            }


            if (
                encabezado ===
                "referer"
            ) {

                return referer;

            }


            return undefined;

        }

    };

}


/* =========================================================
   CREAR RESPONSE FICTICIO
========================================================= */

function crearResponse() {

    return {

        statusCode:
            200,

        contenido:
            null,

        status(codigo) {

            this.statusCode =
                codigo;

            return this;

        },

        send(contenido) {

            this.contenido =
                contenido;

            return this;

        }

    };

}


/* =========================================================
   GET DEBE PASAR
========================================================= */

test(
    "permite métodos seguros sin validar origen",
    () => {

        const req =
            crearRequest({
                method:
                    "GET"
            });

        const res =
            crearResponse();

        let siguiente =
            false;


        validarOrigenMismaAplicacion(
            req,
            res,
            () => {

                siguiente =
                    true;

            }
        );


        assert.equal(
            siguiente,
            true
        );

        assert.equal(
            res.statusCode,
            200
        );

    }
);


/* =========================================================
   LOCALHOST DEBE PASAR
========================================================= */

test(
    "permite POST desde localhost",
    () => {

        const req =
            crearRequest({
                method:
                    "POST",

                origin:
                    "http://localhost:3000"
            });

        const res =
            crearResponse();

        let siguiente =
            false;


        validarOrigenMismaAplicacion(
            req,
            res,
            () => {

                siguiente =
                    true;

            }
        );


        assert.equal(
            siguiente,
            true
        );

        assert.equal(
            res.statusCode,
            200
        );

    }
);


/* =========================================================
   REFERER LOCAL DEBE PASAR
========================================================= */

test(
    "utiliza Referer cuando Origin no está disponible",
    () => {

        const req =
            crearRequest({
                method:
                    "POST",

                referer:
                    "http://localhost:3000/panel"
            });

        const res =
            crearResponse();

        let siguiente =
            false;


        validarOrigenMismaAplicacion(
            req,
            res,
            () => {

                siguiente =
                    true;

            }
        );


        assert.equal(
            siguiente,
            true
        );

        assert.equal(
            res.statusCode,
            200
        );

    }
);


/* =========================================================
   ORIGEN EXTERNO DEBE BLOQUEARSE
========================================================= */

test(
    "rechaza POST desde un origen externo",
    () => {

        const req =
            crearRequest({
                method:
                    "POST",

                origin:
                    "https://sitio-malicioso.example"
            });

        const res =
            crearResponse();

        let siguiente =
            false;


        validarOrigenMismaAplicacion(
            req,
            res,
            () => {

                siguiente =
                    true;

            }
        );


        assert.equal(
            siguiente,
            false
        );

        assert.equal(
            res.statusCode,
            403
        );

        assert.equal(
            res.contenido,
            "La solicitud fue rechazada por seguridad."
        );

    }
);


/* =========================================================
   SIN ORIGIN NI REFERER DEBE BLOQUEARSE
========================================================= */

test(
    "rechaza POST sin Origin ni Referer",
    () => {

        const req =
            crearRequest({
                method:
                    "POST"
            });

        const res =
            crearResponse();

        let siguiente =
            false;


        validarOrigenMismaAplicacion(
            req,
            res,
            () => {

                siguiente =
                    true;

            }
        );


        assert.equal(
            siguiente,
            false
        );

        assert.equal(
            res.statusCode,
            403
        );

    }
);