/* =========================================================
   AUTORENTCAR
   CORREOS AUTOMÁTICOS DE RESERVACIONES
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


const {
    enviarCorreoAgencia
} = require(
    "./correoService"
);

const {
    generarTokenPagoReservacion
} = require(
    "./tokenPagoReservacionService"
);


/* =========================================================
   UTILIDADES
========================================================= */

function validarId(
    valor,
    nombre
) {

    const id =
        Number(
            valor
        );


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        const error =
            new Error(
                `${nombre} no válido.`
            );


        error.codigo =
            "ID_INVALIDO";


        throw error;

    }


    return id;

}


function escaparHtml(
    valor
) {

    return String(
        valor ??
        ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function moneda(
    valor
) {

    return new Intl.NumberFormat(
        "en-US",
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    ).format(
        Number(
            valor ||
            0
        )
    );

}

function obtenerMarcaAgencia(
    agencia
) {

    const baseUrl =
        process.env.PUBLIC_URL ||
        process.env.APP_URL ||
        "http://localhost:3000";


    return {

        logo:
            agencia?.agencia_logo
                ? `${baseUrl}${agencia.agencia_logo}`
                : "",


        colorPrimario:
            agencia?.agencia_color_primario ||
            "#111827",


        colorSecundario:
            agencia?.agencia_color_secundario ||
            "#ffffff"

    };

}

function formatearFecha(
    valor
) {

    if (
        !valor
    ) {

        return "";
    }

    const texto =
        String(valor).trim();

    const partes =
        texto.split("-");

    if (
        partes.length !== 3
    ) {

        return texto;
    }

    const [
        anio,
        mes,
        dia
    ] = partes;

    return `${dia}/${mes}/${anio}`;

}


function formatearHora(
    valor
) {

    if (
        !valor
    ) {

        return "";
    }


    const texto =
        String(valor)
            .trim()
            .slice(0,5);


    const partes =
        texto.split(":");


    if (
        partes.length !== 2
    ) {

        return texto;

    }


    let hora =
        Number(
            partes[0]
        );


    const minutos =
        partes[1];


    const periodo =
        hora >= 12
            ? "p.m."
            : "a.m.";


    hora =
        hora % 12;


    if (
        hora === 0
    ) {

        hora = 12;

    }


    return `${hora}:${minutos} ${periodo}`;

}


function formatearFechaHora(
    fecha,
    hora
) {

    const fechaFormateada =
        formatearFecha(
            fecha
        );

    const horaFormateada =
        formatearHora(
            hora
        );

    if (
        fechaFormateada &&
        horaFormateada
    ) {

        return `${fechaFormateada} · ${horaFormateada}`;

    }

    return (
        fechaFormateada ||
        horaFormateada ||
        ""
    );

}


/* =========================================================
   OBTENER RESERVACIÓN PARA CORREO
========================================================= */

async function obtenerReservacionParaCorreo({

    agenciaId,

    reservacionId

}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const reservacionIdSeguro =
        validarId(
            reservacionId,
            "La reservación"
        );


    const conexion =
        await pool.getConnection();


    try {

        const filas =
            await conexion.query(
                `
                SELECT

                    r.id,
                    r.agencia_id,
                    r.codigo,

                    r.estado,
                    r.origen,

                    r.cantidad_vehiculos,

                    r.cliente_nombre,
                    r.cliente_correo,

                    r.lugar_recogida,
                    r.lugar_entrega,

                    DATE_FORMAT(
                        r.fecha_recogida,
                        '%d/%m/%Y'
                    ) AS fecha_recogida,

                    TIME_FORMAT(
                        r.hora_recogida,
                        '%H:%i'
                    ) AS hora_recogida,

                    DATE_FORMAT(
                        r.fecha_entrega,
                        '%d/%m/%Y'
                    ) AS fecha_entrega,

                    TIME_FORMAT(
                        r.hora_entrega,
                        '%H:%i'
                    ) AS hora_entrega,

                    r.total,

r.monto_anticipo_requerido,

DATE_FORMAT(
    r.fecha_limite_pago,
    '%d/%m/%Y'
) AS fecha_limite_pago,

TIME_FORMAT(
    r.fecha_limite_pago,
    '%H:%i'
) AS hora_limite_pago,

m.marca
    AS modelo_marca,

                    m.nombre
                        AS modelo_nombre,

                    a.nombre
    AS agencia_nombre,

a.logo
    AS agencia_logo,

a.color_primario
    AS agencia_color_primario,

a.color_secundario
    AS agencia_color_secundario

                FROM reservaciones r

                INNER JOIN modelos_vehiculos m
                    ON m.id = r.modelo_id
                    AND m.agencia_id = r.agencia_id

                INNER JOIN agencias a
                    ON a.id = r.agencia_id

                WHERE
                    r.id = ?
                    AND r.agencia_id = ?

                LIMIT 1
                `,
                [
                    reservacionIdSeguro,
                    agenciaIdSeguro
                ]
            );


        if (
            !filas.length
        ) {

            const error =
                new Error(
                    "La reservación no fue encontrada."
                );


            error.codigo =
                "RESERVACION_NO_ENCONTRADA";


            throw error;

        }


        return filas[0];


    } finally {

        conexion.release();

    }

}


/* =========================================================
   SOLICITUD DE RESERVACIÓN RECIBIDA
========================================================= */

async function enviarCorreoSolicitudReservacionRecibida({

    agenciaId,

    reservacionId

}) {

    const reservacion =
        await obtenerReservacionParaCorreo({

            agenciaId,

            reservacionId

        });


    /*
     * Este correo corresponde únicamente a una solicitud
     * nueva creada desde el sitio público.
     */

    if (
        reservacion.origen !==
        "web"
    ) {

        return {

            enviado:
                false,

            omitido:
                true,

            motivo:
                "ORIGEN_NO_WEB"

        };

    }


    if (
        reservacion.estado !==
        "pendiente"
    ) {

        return {

            enviado:
                false,

            omitido:
                true,

            motivo:
                "ESTADO_NO_PENDIENTE"

        };

    }


    const correoCliente =
        String(
            reservacion.cliente_correo ||
            ""
        ).trim();


    if (
        !correoCliente
    ) {

        return {

            enviado:
                false,

            omitido:
                true,

            motivo:
                "CLIENTE_SIN_CORREO"

        };

    }


    const nombreCliente =
        String(
            reservacion.cliente_nombre ||
            "Cliente"
        ).trim();


    const nombreAgencia =
        String(
            reservacion.agencia_nombre ||
            "AutoRentCar"
        ).trim();

    const marca =
    obtenerMarcaAgencia(
        reservacion
    );

    const fechaRecogida =
    formatearFechaHora(
        reservacion.fecha_recogida,
        reservacion.hora_recogida
    );


const fechaEntrega =
    formatearFechaHora(
        reservacion.fecha_entrega,
        reservacion.hora_entrega
    );


    const vehiculo =
        [
            reservacion.modelo_marca,
            reservacion.modelo_nombre
        ]
            .filter(Boolean)
            .join(" ");


    const asunto =
        `Solicitud recibida - ${reservacion.codigo}`;


    const texto =
`Hola ${nombreCliente},

Hemos recibido correctamente tu solicitud de reservación en ${nombreAgencia}.

Código de reservación: ${reservacion.codigo}
Vehículo: ${vehiculo}
Cantidad: ${reservacion.cantidad_vehiculos}

Recogida:
${reservacion.fecha_recogida} a las ${reservacion.hora_recogida}
${reservacion.lugar_recogida}

Devolución:
${reservacion.fecha_entrega} a las ${reservacion.hora_entrega}
${reservacion.lugar_entrega}

Total de la reservación: US$${moneda(reservacion.total)}

Tu solicitud está pendiente de revisión por parte de la agencia. Recibirás otro correo cuando sea aprobada o rechazada.

Gracias por utilizar ${nombreAgencia}.`;


    const html =
`

<!DOCTYPE html>
<html lang="es">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
margin:0;
padding:0;
background:#f4f6f8;
font-family:Arial, Helvetica, sans-serif;
color:#202124;
">

<table
width="100%"
cellspacing="0"
cellpadding="0"
style="background:#f4f6f8;padding:30px 15px;"
>

<tr>
<td align="center">


<table
width="100%"
style="
max-width:620px;
background:#ffffff;
border-radius:12px;
overflow:hidden;
"
>


<tr>
<td style="
padding:28px 32px;
background:${marca.colorPrimario};
color:#ffffff;
border-bottom:4px solid ${marca.colorSecundario};
">


${
marca.logo
?
`
<img
src="${escaparHtml(marca.logo)}"
alt="${escaparHtml(nombreAgencia)}"
style="
max-height:55px;
max-width:180px;
margin-bottom:15px;
object-fit:contain;
"
>
`
:
""
}


<div style="
font-size:13px;
opacity:.85;
margin-bottom:6px;
">
${escaparHtml(nombreAgencia)}
</div>


<div style="
font-size:24px;
font-weight:700;
">
Solicitud de reservación recibida
</div>


</td>
</tr>


<tr>
<td style="padding:32px;">


<p style="
font-size:16px;
line-height:1.6;
">

Hola
<strong>
${escaparHtml(nombreCliente)}
</strong>

</p>


<p style="
font-size:15px;
line-height:1.7;
color:#4b5563;
">

Hemos recibido correctamente tu solicitud de reservación.
La agencia revisará los datos y te informará la confirmación.

</p>



<div style="
background:#fff7ed;
border:1px solid #fed7aa;
border-radius:10px;
padding:18px;
margin:24px 0;
">


<div style="
font-size:13px;
color:#c2410c;
">
Estado
</div>


<div style="
font-size:18px;
font-weight:700;
color:#9a3412;
">

Pendiente de revisión

</div>


</div>



<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
font-size:14px;
line-height:1.7;
"
>

<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Código de reservación
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(reservacion.codigo)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Vehículo
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(vehiculo)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Recogida
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(fechaRecogida)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
color:#6b7280;
">
Devolución
</td>

<td
align="right"
style="
padding:10px 0;
font-weight:600;
"
>
${escaparHtml(fechaEntrega)}
</td>
</tr>

</table>



<div style="
margin-top:26px;
padding:16px;
background:#f9fafb;
border-left:4px solid ${marca.colorSecundario};
border-radius:8px;
font-size:14px;
color:#4b5563;
">

Te notificaremos cualquier actualización relacionada con tu reservación.

</div>


</td>
</tr>


<tr>
<td style="
padding:20px 32px;
background:#f9fafb;
text-align:center;
font-size:12px;
color:#6b7280;
">

${escaparHtml(nombreAgencia)}
· AutoRentCar

</td>
</tr>


</table>


</td>
</tr>

</table>


</body>
</html>

`;


    return enviarCorreoAgencia({

        agenciaId:
            reservacion.agencia_id,

        para:
            correoCliente,

        asunto,

        texto,

        html

    });

}

/* =========================================================
   RESERVACIÓN CONFIRMADA POR LA AGENCIA
========================================================= */

async function enviarCorreoReservacionConfirmada({

    agenciaId,

    reservacionId

}) {

    const reservacion =
        await obtenerReservacionParaCorreo({

            agenciaId,

            reservacionId

        });


    /*
     * Después de que el administrador confirma:
     *
     * - pendiente_pago:
     *   requiere anticipo.
     *
     * - confirmada:
     *   no requiere anticipo en ese momento.
     */

    if (
        ![
            "pendiente_pago",
            "confirmada"
        ].includes(
            reservacion.estado
        )
    ) {

        return {

            enviado:
                false,

            omitido:
                true,

            motivo:
                "ESTADO_NO_CONFIRMADO"

        };

    }


    const correoCliente =
        String(
            reservacion.cliente_correo ||
            ""
        ).trim();


    if (
        !correoCliente
    ) {

        return {

            enviado:
                false,

            omitido:
                true,

            motivo:
                "CLIENTE_SIN_CORREO"

        };

    }

    const nombreCliente =
        String(
            reservacion.cliente_nombre ||
            "Cliente"
        ).trim();


    const nombreAgencia =
        String(
            reservacion.agencia_nombre ||
            "AutoRentCar"
        ).trim();


    const marca =
    obtenerMarcaAgencia(
        reservacion
    );


const fechaRecogida =
    formatearFechaHora(
        reservacion.fecha_recogida,
        reservacion.hora_recogida
    );


const fechaEntrega =
    formatearFechaHora(
        reservacion.fecha_entrega,
        reservacion.hora_entrega
    );
    
    const fechaLimitePago =
    reservacion.fecha_limite_pago
        ? formatearFechaHora(
            reservacion.fecha_limite_pago,
            reservacion.hora_limite_pago
        )
        : "";

    const vehiculo =
        [
            reservacion.modelo_marca,
            reservacion.modelo_nombre
        ]
            .filter(Boolean)
            .join(" ");


    const requierePago =
        reservacion.estado ===
        "pendiente_pago";


    const montoAnticipo =
        Number(
            reservacion.monto_anticipo_requerido ||
            0
        );


    let enlacePago =
    "";

let botonPagoHtml =
    "";


if (
    requierePago
) {

    const resultadoToken =
        await generarTokenPagoReservacion(
            agenciaId,
            reservacionId
        );


    const baseUrl =
        process.env.PUBLIC_URL ||
        process.env.APP_URL ||
        "http://localhost:3000";


    enlacePago =
        `${baseUrl}/pago/${resultadoToken.token}`;


    botonPagoHtml =
`
<div style="
    margin-top:24px;
    text-align:center;
">

    <a href="${escaparHtml(enlacePago)}"
       style="
        display:inline-block;
        background:${marca.colorPrimario};
        color:#ffffff;
        padding:14px 24px;
        border-radius:8px;
        border-bottom:4px solid ${marca.colorSecundario};
        text-decoration:none;
        font-weight:700;
       "
    >
        Subir comprobante de pago
    </a>

</div>
`;

}


    const asunto =
        requierePago
            ? `Reservación confirmada · Pendiente de pago - ${reservacion.codigo}`
            : `Reservación confirmada - ${reservacion.codigo}`;


    const estadoTexto =
        requierePago
            ? "Reservación confirmada · Pendiente de pago"
            : "Reservación confirmada";


    let detallePagoTexto =
        "";


    if (
        requierePago
    ) {

        detallePagoTexto =
`
Anticipo requerido: US$${moneda(montoAnticipo)}

${fechaLimitePago
    ? `Fecha límite de pago: ${fechaLimitePago}`
    : ""}

Tu reservación permanecerá pendiente de pago hasta que la agencia valide el comprobante correspondiente.

Puedes subir tu comprobante de pago desde este enlace:

${enlacePago}
`;

    }


    const texto =
`Hola ${nombreCliente},

Tu solicitud de reservación en ${nombreAgencia} ha sido aprobada.

Estado: ${estadoTexto}

Código de reservación: ${reservacion.codigo}
Vehículo: ${vehiculo}
Cantidad: ${reservacion.cantidad_vehiculos}

Recogida:
${reservacion.fecha_recogida} a las ${reservacion.hora_recogida}
${reservacion.lugar_recogida}

Devolución:
${reservacion.fecha_entrega} a las ${reservacion.hora_entrega}
${reservacion.lugar_entrega}

Total de la reservación: US$${moneda(reservacion.total)}
${detallePagoTexto}

Gracias por utilizar ${nombreAgencia}.`;


    const bloquePagoHtml =
    requierePago
        ? `
            <div style="
                margin-top:24px;
                padding:18px;
                background:#fff7ed;
                border:1px solid #fed7aa;
                border-radius:10px;
            ">

                <div style="
                    font-size:15px;
                    font-weight:700;
                    color:#9a3412;
                    margin-bottom:14px;
                ">
                    Datos del pago
                </div>


                <table
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="
                    font-size:14px;
                    line-height:1.7;
                "
                >

                    <tr>
                        <td style="
                            padding:8px 0;
                            border-bottom:1px solid #fed7aa;
                            color:#9a3412;
                        ">
                            Anticipo requerido
                        </td>

                        <td
                        align="right"
                        style="
                            padding:8px 0;
                            border-bottom:1px solid #fed7aa;
                            font-weight:700;
                            color:#7c2d12;
                        "
                        >
                            US$${moneda(montoAnticipo)}
                        </td>
                    </tr>


                    ${
                        reservacion.fecha_limite_pago
                            ? `
                                <tr>
                                    <td style="
                                        padding:8px 0;
                                        color:#9a3412;
                                    ">
                                        Fecha límite
                                    </td>

                                    <td
                                    align="right"
                                    style="
                                        padding:8px 0;
                                        font-weight:700;
                                        color:#7c2d12;
                                    "
                                    >
                                        ${escaparHtml(fechaLimitePago)}

                                    </td>
                                </tr>
                            `
                            : ""
                    }

                </table>


                <div style="
                    margin-top:14px;
                    font-size:13px;
                    line-height:1.6;
                    color:#9a3412;
                ">
                    La reservación permanecerá pendiente
                    de pago hasta que la agencia valide
                    el comprobante correspondiente.
                </div>

            </div>
        `
        : "";

    const html =
`
<!DOCTYPE html>
<html lang="es">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
margin:0;
padding:0;
background:#f4f6f8;
font-family:Arial, Helvetica, sans-serif;
color:#202124;
">

<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
background:#f4f6f8;
padding:30px 15px;
"
>

<tr>
<td align="center">


<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
max-width:620px;
background:#ffffff;
border-radius:12px;
overflow:hidden;
"
>


<tr>
<td style="
padding:28px 32px;
background:${marca.colorPrimario};
color:#ffffff;
border-bottom:4px solid ${marca.colorSecundario};
">


${
marca.logo
?
`
<img
src="${escaparHtml(marca.logo)}"
alt="${escaparHtml(nombreAgencia)}"
style="
max-height:55px;
max-width:180px;
margin-bottom:15px;
object-fit:contain;
"
>
`
:
""
}


<div style="
font-size:13px;
opacity:.85;
margin-bottom:6px;
">
${escaparHtml(nombreAgencia)}
</div>


<div style="
font-size:24px;
font-weight:700;
">
${escaparHtml(estadoTexto)}
</div>


</td>
</tr>


<tr>
<td style="
padding:32px;
">


<p style="
font-size:16px;
line-height:1.6;
">

Hola
<strong>
${escaparHtml(nombreCliente)}
</strong>,

</p>


<p style="
font-size:15px;
line-height:1.7;
color:#4b5563;
">

Tu reservación ha sido confirmada correctamente.
La agencia ha aprobado tu solicitud de reservación.

</p>



<div style="
background:#ecfdf5;
border:1px solid #a7f3d0;
border-radius:10px;
padding:18px;
margin:24px 0;
">


<div style="
font-size:13px;
color:#047857;
">
Estado
</div>


<div style="
font-size:18px;
font-weight:700;
color:#065f46;
">

${escaparHtml(estadoTexto)}

</div>


</div>



<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
font-size:14px;
line-height:1.7;
"
>

<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Código
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(reservacion.codigo)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Vehículo
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(vehiculo)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Recogida
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(fechaRecogida)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
color:#6b7280;
">
Devolución
</td>

<td
align="right"
style="
padding:10px 0;
font-weight:600;
"
>
${escaparHtml(fechaEntrega)}
</td>
</tr>

</table>

${bloquePagoHtml}


${botonPagoHtml}

<div style="
margin-top:26px;
padding:16px;
background:#f9fafb;
border-left:4px solid ${marca.colorSecundario};
border-radius:8px;
font-size:14px;
color:#4b5563;
line-height:1.6;
">

Conserva el código de reservación para cualquier consulta relacionada con tu solicitud.

</div>


</td>
</tr>



<tr>

<td style="
padding:20px 32px;
background:#f9fafb;
text-align:center;
font-size:12px;
color:#6b7280;
">

${escaparHtml(nombreAgencia)}
· AutoRentCar

</td>

</tr>


</table>


</td>
</tr>

</table>


</body>

</html>
`;


    return enviarCorreoAgencia({

        agenciaId:
            reservacion.agencia_id,

        para:
            correoCliente,

        asunto,

        texto,

        html

    });

}

/* =========================================================
   PAGO CONFIRMADO
========================================================= */

async function enviarCorreoPagoConfirmado({

    agenciaId,

    reservacionId,

    pagoId

}) {

    const conexion =
        await pool.getConnection();


    try {

        const datos =
            await conexion.query(
                `
                SELECT

                    r.codigo,
                    r.agencia_id,

                    r.cliente_nombre,
                    r.cliente_correo,

                    a.nombre AS agencia_nombre,
                    a.logo AS agencia_logo,
                    a.color_primario AS agencia_color_primario,
                    a.color_secundario AS agencia_color_secundario,
                    
                    p.monto,
                    p.moneda,

                    p.metodo_nombre,
                    p.metodo_tipo,

                   DATE_FORMAT(
    p.fecha_validacion,
    '%d/%m/%Y'
) AS fecha_validacion,

TIME_FORMAT(
    p.fecha_validacion,
    '%H:%i'
) AS hora_validacion

                FROM reservaciones r

                INNER JOIN agencias a
                    ON a.id = r.agencia_id

                INNER JOIN pagos_reservacion p
                    ON p.reservacion_id = r.id
                    AND p.id = ?

                WHERE
                    r.id = ?
                    AND r.agencia_id = ?

                LIMIT 1
                `,
                [
                    pagoId,
                    reservacionId,
                    agenciaId
                ]
            );


        if (
            !datos.length
        ) {

            return {

                enviado:
                    false,

                motivo:
                    "DATOS_NO_ENCONTRADOS"

            };

        }


        const pago =
            datos[0];


        const fechaValidacion =
    pago.fecha_validacion
        ? formatearFechaHora(
            pago.fecha_validacion,
            pago.hora_validacion
        )
        : "";


        const marca =
    obtenerMarcaAgencia(
        pago
    );


        if (
            !pago.cliente_correo
        ) {

            return {

                enviado:
                    false,

                motivo:
                    "CLIENTE_SIN_CORREO"

            };

        }


        const asunto =
            `Pago confirmado · Pendiente de entrega - ${pago.codigo}`;


        const texto =
`Hola ${pago.cliente_nombre},

Tu pago ha sido confirmado correctamente por ${pago.agencia_nombre}.

Detalles del pago:

Código de reservación:
${pago.codigo}

Monto recibido:
${pago.moneda} ${Number(pago.monto).toFixed(2)}

Método de pago:
${pago.metodo_nombre}

Fecha de validación:
${pago.fecha_validacion}

Estado actual:
Pago confirmado · Pendiente de entrega

La agencia continuará con la preparación y coordinación de la entrega del vehículo.

Gracias por utilizar ${pago.agencia_nombre}.`;


        const html =
`
<!DOCTYPE html>
<html lang="es">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
margin:0;
padding:0;
background:#f4f6f8;
font-family:Arial, Helvetica, sans-serif;
color:#202124;
">

<table width="100%" cellspacing="0" cellpadding="0"
style="
background:#f4f6f8;
padding:30px 15px;
">

<tr>
<td align="center">


<table width="100%" cellspacing="0" cellpadding="0"
style="
max-width:620px;
background:#ffffff;
border-radius:12px;
overflow:hidden;
">


<tr>
<td style="
padding:28px 32px;
background:${marca.colorPrimario};
color:#ffffff;
border-bottom:4px solid ${marca.colorSecundario};
">


${
marca.logo
?
`
<img
src="${escaparHtml(marca.logo)}"
alt="${escaparHtml(pago.agencia_nombre)}"
style="
max-height:55px;
max-width:180px;
margin-bottom:15px;
object-fit:contain;
"
>
`
:
""
}


<div style="
font-size:13px;
opacity:.85;
margin-bottom:6px;
">
${escaparHtml(pago.agencia_nombre)}
</div>


<div style="
font-size:24px;
font-weight:700;
">
Pago confirmado
</div>


</td>
</tr>



<tr>
<td style="
padding:32px;
">


<p style="
font-size:16px;
line-height:1.6;
">

Hola
<strong>
${escaparHtml(pago.cliente_nombre)}
</strong>

</p>


<p style="
font-size:15px;
line-height:1.7;
color:#4b5563;
">

Tu pago ha sido validado correctamente.
La agencia continuará con la preparación
y coordinación de entrega del vehículo.

</p>



<div style="
background:#ecfdf5;
border:1px solid #a7f3d0;
border-radius:10px;
padding:18px;
margin:24px 0;
">


<div style="
font-size:13px;
color:#047857;
">
Estado actual
</div>


<div style="
font-size:18px;
font-weight:700;
color:#065f46;
">

Pago confirmado · Pendiente de entrega

</div>


</div>



<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
font-size:14px;
line-height:1.7;
"
>

<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Código
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(pago.codigo)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Monto recibido
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(pago.moneda)}
${Number(pago.monto).toFixed(2)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Método de pago
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(pago.metodo_nombre)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
color:#6b7280;
">
Fecha de validación
</td>

<td
align="right"
style="
padding:10px 0;
font-weight:600;
"
>
${escaparHtml(fechaValidacion)}
</td>
</tr>

</table>



<div style="
margin-top:26px;
padding:16px;
background:#f9fafb;
border-left:4px solid ${marca.colorSecundario};
border-radius:8px;
font-size:14px;
color:#4b5563;
line-height:1.6;
">

Tu vehículo será preparado para la fecha
de entrega establecida en la reservación.

</div>



</td>
</tr>



<tr>
<td style="
padding:20px 32px;
background:#f9fafb;
text-align:center;
font-size:12px;
color:#6b7280;
">

${escaparHtml(pago.agencia_nombre)}
· AutoRentCar

</td>
</tr>



</table>


</td>
</tr>

</table>

</body>

</html>
`;

        return enviarCorreoAgencia({

            agenciaId,

            para:
                pago.cliente_correo,

            asunto,

            texto,

            html

        });


    } finally {

        conexion.release();

    }

}

/* =========================================================
   VEHÍCULO ENTREGADO · ALQUILER INICIADO
========================================================= */

async function enviarCorreoVehiculoEntregado({

    agenciaId,

    reservacionId

}) {

    const reservacion =
        await obtenerReservacionParaCorreo({

            agenciaId,

            reservacionId

        });


    if (
        reservacion.estado !==
        "en_curso"
    ) {

        return {

            enviado:
                false,

            omitido:
                true,

            motivo:
                "ESTADO_NO_EN_CURSO"

        };

    }


    const correoCliente =
        String(
            reservacion.cliente_correo ||
            ""
        ).trim();


    if (
        !correoCliente
    ) {

        return {

            enviado:
                false,

            omitido:
                true,

            motivo:
                "CLIENTE_SIN_CORREO"

        };

    }


    const nombreCliente =
        String(
            reservacion.cliente_nombre ||
            "Cliente"
        ).trim();


    const nombreAgencia =
        String(
            reservacion.agencia_nombre ||
            "AutoRentCar"
        ).trim();


    const marca =
        obtenerMarcaAgencia(
            reservacion
        );


    const vehiculo =
        [
            reservacion.modelo_marca,
            reservacion.modelo_nombre
        ]
            .filter(Boolean)
            .join(" ");


    
        const fechaRecogida =
    formatearFechaHora(
        reservacion.fecha_recogida,
        reservacion.hora_recogida
    );


const fechaEntrega =
    formatearFechaHora(
        reservacion.fecha_entrega,
        reservacion.hora_entrega
    );


    const conexion =
        await pool.getConnection();


    let unidades =
        [];


    try {

        unidades =
            await conexion.query(
                `
                SELECT

                    v.codigo_interno,
                    v.placa

                FROM reservacion_vehiculos rv

                INNER JOIN vehiculos v
                    ON v.id = rv.vehiculo_id

                WHERE
                    rv.reservacion_id = ?
                    AND rv.estado = 'asignado'
                    AND v.agencia_id = ?

                ORDER BY
                    v.codigo_interno ASC
                `,
                [
                    reservacionId,
                    agenciaId
                ]
            );

    } finally {

        conexion.release();

    }


    const unidadesTexto =
        unidades.length
            ? unidades
                .map(
                    unidad =>
                        unidad.placa
                            ? `${unidad.codigo_interno} (${unidad.placa})`
                            : unidad.codigo_interno
                )
                .join(", ")
            : "Unidad asignada";


    const asunto =
        `Vehículo entregado · Alquiler iniciado - ${reservacion.codigo}`;


    const texto =
`Hola ${nombreCliente},

Tu vehículo ha sido entregado correctamente por ${nombreAgencia} y el alquiler ya se encuentra en curso.

Código de reservación: ${reservacion.codigo}
Vehículo: ${vehiculo}
Unidad(es): ${unidadesTexto}

Fecha y hora de entrega:
${reservacion.fecha_recogida} a las ${reservacion.hora_recogida}
${reservacion.lugar_recogida}

Fecha y hora programada de devolución:
${reservacion.fecha_entrega} a las ${reservacion.hora_entrega}
${reservacion.lugar_entrega}

Estado actual:
Alquiler en curso

Recuerda realizar la devolución en la fecha y hora acordadas.

Gracias por utilizar ${nombreAgencia}.`;


    const html =
`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial, Helvetica, sans-serif;
    color:#202124;
">

    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="background:#f4f6f8;padding:30px 15px;"
    >
        <tr>
            <td align="center">

                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                        max-width:620px;
                        background:#ffffff;
                        border-radius:12px;
                        overflow:hidden;
                        box-shadow:0 4px 18px rgba(0,0,0,.08);
                    "
                >

                    <tr>
                        <td style="
                            padding:28px 32px;
                            background:${marca.colorPrimario};
                            color:#ffffff;
                            border-bottom:4px solid ${marca.colorSecundario};
                        ">

                            ${
                                marca.logo
                                    ?
`
                            <img
                                src="${escaparHtml(marca.logo)}"
                                alt="${escaparHtml(nombreAgencia)}"
                                style="
                                    max-height:55px;
                                    max-width:180px;
                                    margin-bottom:15px;
                                    object-fit:contain;
                                "
                            >
`
                                    : ""
                            }

                            <div style="
                                font-size:13px;
                                opacity:.85;
                                margin-bottom:6px;
                            ">
                                ${escaparHtml(nombreAgencia)}
                            </div>

                            <div style="
                                font-size:24px;
                                font-weight:700;
                            ">
                                Vehículo entregado
                            </div>

                        </td>
                    </tr>


                    <tr>
                        <td style="padding:32px;">

                            <p style="
                                margin:0 0 18px;
                                font-size:16px;
                                line-height:1.6;
                            ">
                                Hola
                                <strong>
                                    ${escaparHtml(nombreCliente)}
                                </strong>,
                            </p>


                            <p style="
                                margin:0 0 24px;
                                font-size:15px;
                                line-height:1.7;
                                color:#4b5563;
                            ">
                                Tu vehículo ha sido entregado correctamente
                                y el alquiler ya se encuentra en curso.
                            </p>


                            <div style="
                                background:#ecfdf5;
                                border:1px solid #a7f3d0;
                                border-radius:10px;
                                padding:18px;
                                margin-bottom:24px;
                            ">

                                <div style="
                                    font-size:13px;
                                    color:#047857;
                                    margin-bottom:5px;
                                ">
                                    Estado actual
                                </div>

                                <div style="
                                    font-size:18px;
                                    font-weight:700;
                                    color:#065f46;
                                ">
                                    Alquiler en curso
                                </div>

                            </div>


                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                style="font-size:14px;line-height:1.6;"
                            >

                                <tr>
                                    <td style="
                                        padding:10px 0;
                                        border-bottom:1px solid #eeeeee;
                                        color:#6b7280;
                                    ">
                                        Código
                                    </td>

                                    <td
                                        align="right"
                                        style="
                                            padding:10px 0;
                                            border-bottom:1px solid #eeeeee;
                                            font-weight:600;
                                        "
                                    >
                                        ${escaparHtml(reservacion.codigo)}
                                    </td>
                                </tr>


                                <tr>
                                    <td style="
                                        padding:10px 0;
                                        border-bottom:1px solid #eeeeee;
                                        color:#6b7280;
                                    ">
                                        Vehículo
                                    </td>

                                    <td
                                        align="right"
                                        style="
                                            padding:10px 0;
                                            border-bottom:1px solid #eeeeee;
                                            font-weight:600;
                                        "
                                    >
                                        ${escaparHtml(vehiculo)}
                                    </td>
                                </tr>


                                <tr>
                                    <td style="
                                        padding:10px 0;
                                        border-bottom:1px solid #eeeeee;
                                        color:#6b7280;
                                    ">
                                        Unidad(es)
                                    </td>

                                    <td
                                        align="right"
                                        style="
                                            padding:10px 0;
                                            border-bottom:1px solid #eeeeee;
                                            font-weight:600;
                                        "
                                    >
                                        ${escaparHtml(unidadesTexto)}
                                    </td>
                                </tr>


                                <tr>
                                    <td style="
                                        padding:10px 0;
                                        border-bottom:1px solid #eeeeee;
                                        color:#6b7280;
                                    ">
                                        Entrega
                                    </td>

                                    <td
                                        align="right"
                                        style="
                                            padding:10px 0;
                                            border-bottom:1px solid #eeeeee;
                                            font-weight:600;
                                        "
                                    >
                                        ${escaparHtml(fechaRecogida)}

                                    </td>
                                </tr>


                                <tr>
                                    <td style="
                                        padding:10px 0;
                                        color:#6b7280;
                                    ">
                                        Devolución
                                    </td>

                                    <td
                                        align="right"
                                        style="
                                            padding:10px 0;
                                            font-weight:600;
                                        "
                                    >
                                        ${escaparHtml(fechaEntrega)}
                                        
                                    </td>
                                </tr>

                            </table>

                            <div style="
                                margin-top:26px;
                                padding:16px 18px;
                                background:#f9fafb;
                                border-left:4px solid ${marca.colorSecundario};
                                border-radius:8px;
                                color:#4b5563;
                                font-size:14px;
                                line-height:1.6;
                            ">
                                Recuerda realizar la devolución del vehículo
                                en la fecha y hora acordadas.
                            </div>

                        </td>
                    </tr>


                    <tr>
                        <td style="
                            padding:20px 32px;
                            background:#f9fafb;
                            border-top:1px solid #eeeeee;
                            font-size:12px;
                            color:#6b7280;
                            text-align:center;
                        ">
                            ${escaparHtml(nombreAgencia)}
                            · AutoRentCar
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
`;


    return enviarCorreoAgencia({

        agenciaId:
            reservacion.agencia_id,

        para:
            correoCliente,

        asunto,

        texto,

        html

    });

}

/* =========================================================
   DEVOLUCIÓN CONFIRMADA
========================================================= */

async function enviarCorreoDevolucionConfirmada({

    agenciaId,

    reservacionId

}) {

    const conexion =
        await pool.getConnection();


    try {

        const datos =
            await conexion.query(
                `
                SELECT

                    r.codigo,

                    r.cliente_nombre,

                    r.cliente_correo,

                    a.nombre AS agencia_nombre,
                    a.logo AS agencia_logo,
                    a.color_primario AS agencia_color_primario,
                    a.color_secundario AS agencia_color_secundario,

                    DATE_FORMAT(
                        r.fecha_entrega,
                        '%d/%m/%Y'
                    ) AS fecha_devolucion,

                    TIME_FORMAT(
                        r.hora_entrega,
                        '%H:%i'
                    ) AS hora_devolucion

                FROM reservaciones r

                INNER JOIN agencias a
                    ON a.id = r.agencia_id

                WHERE
                    r.id = ?
                    AND r.agencia_id = ?

                LIMIT 1
                `,
                [
                    reservacionId,
                    agenciaId
                ]
            );


        if (
            !datos.length
        ) {

            return {

                enviado:
                    false,

                motivo:
                    "DATOS_NO_ENCONTRADOS"

            };

        }


        const reservacion =
            datos[0];

        const marca =
    obtenerMarcaAgencia(
        reservacion
    );


const fechaDevolucion =
    formatearFechaHora(
        reservacion.fecha_devolucion,
        reservacion.hora_devolucion
    );


        if (
            !reservacion.cliente_correo
        ) {

            return {

                enviado:
                    false,

                motivo:
                    "CLIENTE_SIN_CORREO"

            };

        }


        const vehiculos =
            await conexion.query(
                `
                SELECT

                    GROUP_CONCAT(
                        v.codigo_interno
                        ORDER BY v.codigo_interno
                        SEPARATOR ', '
                    ) AS unidades

                FROM reservacion_vehiculos rv

                INNER JOIN vehiculos v
                    ON v.id = rv.vehiculo_id

                WHERE
                    rv.reservacion_id = ?

                `,
                [
                    reservacionId
                ]
            );


        const unidades =
            vehiculos[0]?.unidades ||
            "Unidad asignada";


        const asunto =
            `Devolución completada - ${reservacion.codigo}`;


        const texto =
`Hola ${reservacion.cliente_nombre},

Tu devolución fue registrada correctamente por ${reservacion.agencia_nombre}.

Código de reservación:
${reservacion.codigo}

Vehículo(s):
${unidades}

Fecha de devolución:
${fechaDevolucion}

Estado actual:
Reservación finalizada

Gracias por utilizar ${reservacion.agencia_nombre}.`;


        const html =
`
<!DOCTYPE html>
<html lang="es">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
margin:0;
padding:0;
background:#f4f6f8;
font-family:Arial, Helvetica, sans-serif;
color:#202124;
">

<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
background:#f4f6f8;
padding:30px 15px;
"
>

<tr>
<td align="center">

<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
max-width:620px;
background:#ffffff;
border-radius:12px;
overflow:hidden;
"
>

<tr>
<td style="
padding:28px 32px;
background:${marca.colorPrimario};
color:#ffffff;
border-bottom:4px solid ${marca.colorSecundario};
">

${
marca.logo
?
`
<img
src="${escaparHtml(marca.logo)}"
alt="${escaparHtml(reservacion.agencia_nombre)}"
style="
max-height:55px;
max-width:180px;
margin-bottom:15px;
object-fit:contain;
"
>
`
:
""
}

<div style="
font-size:13px;
opacity:.85;
margin-bottom:6px;
">
${escaparHtml(reservacion.agencia_nombre)}
</div>

<div style="
font-size:24px;
font-weight:700;
">
Devolución completada
</div>

</td>
</tr>


<tr>
<td style="padding:32px;">

<p style="
font-size:16px;
line-height:1.6;
margin:0 0 18px;
">

Hola
<strong>
${escaparHtml(reservacion.cliente_nombre)}
</strong>,

</p>


<p style="
font-size:15px;
line-height:1.7;
color:#4b5563;
margin:0 0 24px;
">

La devolución del vehículo fue registrada correctamente.

</p>


<div style="
background:#ecfdf5;
border:1px solid #a7f3d0;
border-radius:10px;
padding:18px;
margin-bottom:24px;
">

<div style="
font-size:13px;
color:#047857;
margin-bottom:5px;
">
Estado actual
</div>

<div style="
font-size:18px;
font-weight:700;
color:#065f46;
">
Reservación finalizada
</div>

</div>


<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
font-size:14px;
line-height:1.7;
"
>

<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Código
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(reservacion.codigo)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Unidad(es)
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(unidades)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
color:#6b7280;
">
Devolución
</td>

<td
align="right"
style="
padding:10px 0;
font-weight:600;
"
>
${escaparHtml(fechaDevolucion)}
</td>
</tr>

</table>


<div style="
margin-top:26px;
padding:16px 18px;
background:#f9fafb;
border-left:4px solid ${marca.colorSecundario};
border-radius:8px;
font-size:14px;
line-height:1.6;
color:#4b5563;
">

Gracias por confiar en ${escaparHtml(reservacion.agencia_nombre)}.
Tu reservación ha sido completada correctamente.

</div>

</td>
</tr>


<tr>
<td style="
padding:20px 32px;
background:#f9fafb;
border-top:1px solid #eeeeee;
text-align:center;
font-size:12px;
color:#6b7280;
">

${escaparHtml(reservacion.agencia_nombre)}
· AutoRentCar

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
`;


        return enviarCorreoAgencia({

            agenciaId,

            para:
                reservacion.cliente_correo,

            asunto,

            texto,

            html

        });


    } finally {

        conexion.release();

    }

}

/* =========================================================
   DEVOLUCIÓN PENDIENTE
========================================================= */

async function enviarCorreoDevolucionPendiente({

    agenciaId,

    reservacionId

}) {

    const conexion =
        await pool.getConnection();


    try {

        const datos =
            await conexion.query(
                `
                SELECT

                    r.codigo,

                    r.cliente_nombre,

                    r.cliente_correo,

                    a.nombre AS agencia_nombre,
                    a.logo AS agencia_logo,
                    a.color_primario AS agencia_color_primario,
                    a.color_secundario AS agencia_color_secundario,

                    DATE_FORMAT(
                        r.fecha_entrega,
                        '%d/%m/%Y'
                    ) AS fecha_devolucion,

                    TIME_FORMAT(
                        r.hora_entrega,
                        '%H:%i'
                    ) AS hora_devolucion

                FROM reservaciones r

                INNER JOIN agencias a
                    ON a.id = r.agencia_id

                WHERE
                    r.id = ?
                    AND r.agencia_id = ?

                LIMIT 1
                `,
                [
                    reservacionId,
                    agenciaId
                ]
            );


        if (
            !datos.length
        ) {

            return {

                enviado:
                    false,

                motivo:
                    "DATOS_NO_ENCONTRADOS"

            };

        }


        const reservacion =
            datos[0];


        const marca =
    obtenerMarcaAgencia(
        reservacion
    );


const fechaDevolucion =
    formatearFechaHora(
        reservacion.fecha_devolucion,
        reservacion.hora_devolucion
    );


        if (
            !reservacion.cliente_correo
        ) {

            return {

                enviado:
                    false,

                motivo:
                    "CLIENTE_SIN_CORREO"

            };

        }


        const vehiculos =
            await conexion.query(
                `
                SELECT

                    GROUP_CONCAT(
                        v.codigo_interno
                        ORDER BY v.codigo_interno
                        SEPARATOR ', '
                    ) AS unidades

                FROM reservacion_vehiculos rv

                INNER JOIN vehiculos v
                    ON v.id = rv.vehiculo_id

                WHERE
                    rv.reservacion_id = ?

                    AND rv.estado = 'asignado'

                `,
                [
                    reservacionId
                ]
            );


        const unidades =
            vehiculos[0]?.unidades ||
            "Unidad asignada";


        const asunto =
            `Recordatorio de devolución - ${reservacion.codigo}`;


        const texto =
`Hola ${reservacion.cliente_nombre},

Te recordamos que la devolución del vehículo está programada para hoy.

Código de reservación:
${reservacion.codigo}

Vehículo(s):
${unidades}

Fecha de devolución:
${reservacion.fecha_devolucion}

Hora de devolución:
${reservacion.hora_devolucion}

Por favor realiza la entrega del vehículo según lo acordado.

Gracias por utilizar ${reservacion.agencia_nombre}.`;


        const html =
`
<!DOCTYPE html>
<html lang="es">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="
margin:0;
padding:0;
background:#f4f6f8;
font-family:Arial, Helvetica, sans-serif;
color:#202124;
">

<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
background:#f4f6f8;
padding:30px 15px;
"
>

<tr>
<td align="center">

<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
max-width:620px;
background:#ffffff;
border-radius:12px;
overflow:hidden;
"
>

<tr>
<td style="
padding:28px 32px;
background:${marca.colorPrimario};
color:#ffffff;
border-bottom:4px solid ${marca.colorSecundario};
">

${
marca.logo
?
`
<img
src="${escaparHtml(marca.logo)}"
alt="${escaparHtml(reservacion.agencia_nombre)}"
style="
max-height:55px;
max-width:180px;
margin-bottom:15px;
object-fit:contain;
"
>
`
:
""
}

<div style="
font-size:13px;
opacity:.85;
margin-bottom:6px;
">
${escaparHtml(reservacion.agencia_nombre)}
</div>

<div style="
font-size:24px;
font-weight:700;
">
Recordatorio de devolución
</div>

</td>
</tr>


<tr>
<td style="padding:32px;">

<p style="
font-size:16px;
line-height:1.6;
margin:0 0 18px;
">

Hola
<strong>
${escaparHtml(reservacion.cliente_nombre)}
</strong>,

</p>


<p style="
font-size:15px;
line-height:1.7;
color:#4b5563;
margin:0 0 24px;
">

Te recordamos que la devolución del vehículo
está programada para hoy.

</p>


<div style="
background:#fff7ed;
border:1px solid #fed7aa;
border-radius:10px;
padding:18px;
margin-bottom:24px;
">

<div style="
font-size:13px;
color:#c2410c;
margin-bottom:5px;
">
Estado actual
</div>

<div style="
font-size:18px;
font-weight:700;
color:#9a3412;
">
Devolución pendiente
</div>

</div>


<table
width="100%"
cellspacing="0"
cellpadding="0"
style="
font-size:14px;
line-height:1.7;
"
>

<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Código
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(reservacion.codigo)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
color:#6b7280;
">
Unidad(es)
</td>

<td
align="right"
style="
padding:10px 0;
border-bottom:1px solid #eeeeee;
font-weight:600;
"
>
${escaparHtml(unidades)}
</td>
</tr>


<tr>
<td style="
padding:10px 0;
color:#6b7280;
">
Devolución
</td>

<td
align="right"
style="
padding:10px 0;
font-weight:600;
"
>
${escaparHtml(fechaDevolucion)}
</td>
</tr>

</table>


<div style="
margin-top:26px;
padding:16px 18px;
background:#f9fafb;
border-left:4px solid ${marca.colorSecundario};
border-radius:8px;
font-size:14px;
line-height:1.6;
color:#4b5563;
">

Por favor realiza la entrega del vehículo
en la fecha y hora acordadas.

</div>

</td>
</tr>


<tr>
<td style="
padding:20px 32px;
background:#f9fafb;
border-top:1px solid #eeeeee;
text-align:center;
font-size:12px;
color:#6b7280;
">

${escaparHtml(reservacion.agencia_nombre)}
· AutoRentCar

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
`;


        return enviarCorreoAgencia({

            agenciaId,

            para:
                reservacion.cliente_correo,

            asunto,

            texto,

            html

        });


    } finally {

        conexion.release();

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    obtenerReservacionParaCorreo,

    enviarCorreoSolicitudReservacionRecibida,

    enviarCorreoReservacionConfirmada,

    enviarCorreoPagoConfirmado,

    enviarCorreoVehiculoEntregado,

    enviarCorreoDevolucionConfirmada,

    enviarCorreoDevolucionPendiente

};