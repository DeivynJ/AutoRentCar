/* =========================================================
   AUTORENTCAR - SERVIDOR PRINCIPAL
========================================================= */

const path = require("path");

const express = require("express");

const session = require(
    "express-session"
);


/* =========================================================
   VARIABLES DE ENTORNO
========================================================= */

require("dotenv").config();


/* =========================================================
   VALIDACIÓN DE CONFIGURACIÓN
========================================================= */

const variablesRequeridas = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "SESSION_SECRET"
];

const variablesFaltantes =
    variablesRequeridas.filter(
        (variable) =>
            !process.env[variable]
    );

if (variablesFaltantes.length > 0) {

    console.error(
        "❌ Faltan variables de entorno obligatorias:"
    );

    variablesFaltantes.forEach(
        (variable) => {
            console.error(
                `   - ${variable}`
            );
        }
    );

    process.exit(1);
}


/* =========================================================
   BASE DE DATOS
========================================================= */

const {
    probarConexion
} = require(
    "./config/database"
);


/* =========================================================
   RUTAS
========================================================= */

const authRoutes = require(
    "./routes/authRoutes"
);

const adminRoutes = require(
    "./routes/adminRoutes"
);

const sucursalRoutes = require(
    "./routes/sucursalRoutes"
);

/* =========================================================
   APLICACIÓN
========================================================= */

const app = express();

const PORT =
    Number(
        process.env.PORT
    ) || 3000;


/* =========================================================
   EJS
========================================================= */

app.set(
    "view engine",
    "ejs"
);

app.set(
    "views",
    path.join(
        __dirname,
        "views"
    )
);


/* =========================================================
   ARCHIVOS PÚBLICOS
========================================================= */

app.use(
    "/css",
    express.static(
        path.join(
            __dirname,
            "css"
        )
    )
);

app.use(
    "/js",
    express.static(
        path.join(
            __dirname,
            "js"
        )
    )
);

app.use(
    "/img",
    express.static(
        path.join(
            __dirname,
            "img"
        )
    )
);


/* =========================================================
   PARSERS
========================================================= */

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.json()
);


/* =========================================================
   SESIONES
========================================================= */

app.use(
    session({
        name:
            "autorentcar.sid",

        secret:
            process.env.SESSION_SECRET,

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            httpOnly:
                true,

            sameSite:
                "lax",

            secure:
                process.env.NODE_ENV ===
                "production",

            maxAge:
                1000 *
                60 *
                60 *
                8
        }
    })
);


/* =========================================================
   RUTAS
========================================================= */

app.use(
    authRoutes
);

app.use(
    adminRoutes
);

app.use(
    sucursalRoutes
);

/* =========================================================
   RUTA PRINCIPAL TEMPORAL
========================================================= */

app.get(
    "/",
    (req, res) => {

        res.send(
            "AutoRentCar - Backend funcionando correctamente"
        );
    }
);


/* =========================================================
   INICIAR SERVIDOR
========================================================= */

async function iniciarServidor() {

    try {

        /*
         * Primero verificamos que MariaDB
         * esté disponible.
         */
        await probarConexion();

        /*
         * Solo iniciamos Express cuando
         * la base de datos respondió.
         */
        app.listen(
            PORT,
            () => {

                console.log(
                    `🚗 AutoRentCar ejecutándose en http://localhost:${PORT}`
                );

            }
        );

    } catch (error) {

        console.error(
            "❌ AutoRentCar no pudo iniciar."
        );

        console.error(
            "Verifica la conexión con MariaDB y las variables del archivo .env."
        );

        process.exit(1);
    }

}
/* =========================================================
   EJECUCIÓN
========================================================= */

iniciarServidor();