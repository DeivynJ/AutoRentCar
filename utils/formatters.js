/* =========================================================
   UTILIDADES DE FORMATO
========================================================= */

/**
 * Formatea valores monetarios
 */
function formatoMoneda(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "USD $0.00";

    }


    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }

    ).format(
        Number(valor)
    );

}

/**
 * Formatea fechas para mostrar
 */
function formatoFecha(fecha) {


    if (!fecha) {

        return "No disponible";

    }


    return new Date(fecha)
        .toLocaleDateString(
            "es-DO",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

}

/* =========================================================
   FORMATO DE FECHA Y HORA
========================================================= */

function formatoFechaHora(
    valor,
    textoVacio = "Nunca"
) {

    if (!valor) {
        return textoVacio;
    }


    const fecha =
        valor instanceof Date
            ? valor
            : new Date(valor);


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {
        return textoVacio;
    }


    return fecha.toLocaleString(
        "es-DO",
        {
            timeZone:
                "America/Santo_Domingo",

            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit",

            hour12:
                true
        }
    );
}

module.exports = {

    formatoMoneda,

    formatoFecha,

    formatoFechaHora

};