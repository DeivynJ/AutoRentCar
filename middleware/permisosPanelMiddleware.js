/* =========================================================
   AUTORENTCAR - PERMISOS DEL PANEL DE AGENCIA
========================================================= */

/*
 * Esta protección es la base temporal
 * hasta implementar los permisos granulares.
 *
 * El empleado puede consultar el catálogo,
 * pero no modificarlo.
 */

function requerirGestionCatalogo(
    req,
    res,
    next
) {

    const usuario =
        req.usuarioAgencia;


    if (!usuario) {

        return res
            .status(403)
            .send(
                "No fue posible validar los permisos del usuario."
            );

    }


    const codigoRol =
        String(
            usuario.rolCodigo ||
            ""
        )
            .trim()
            .toLowerCase();


    const nombreRol =
        String(
            usuario.rolNombre ||
            ""
        )
            .trim()
            .toLowerCase();


    const esEmpleado =
        codigoRol ===
            "empleado" ||
        nombreRol ===
            "empleado";


    if (esEmpleado) {

        return res
            .status(403)
            .send(
                "Tu usuario no tiene permiso para modificar el catálogo."
            );

    }


    next();

}


module.exports = {
    requerirGestionCatalogo
};