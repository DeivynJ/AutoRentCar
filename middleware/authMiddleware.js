function requerirAutenticacion(
    req,
    res,
    next
) {
    if (!req.session?.usuario) {
        return res.redirect("/login");
    }

    next();
}

function requerirSuperadmin(
    req,
    res,
    next
) {
    if (!req.session?.usuario) {
        return res.redirect("/login");
    }

    if (
        req.session.usuario.rolCodigo !==
        "superadmin"
    ) {
        return res.status(403).send(
            "Acceso no autorizado."
        );
    }

    next();
}

/* =========================================================
   REQUERIR USUARIO DE AGENCIA
========================================================= */

function requerirUsuarioAgencia(
    req,
    res,
    next
) {

    const usuario =
        req.session?.usuario;


    if (!usuario) {

        return res.redirect(
            "/login"
        );

    }


    /*
     * El SuperAdministrador utiliza
     * exclusivamente su panel global.
     */

    if (
        usuario.rolCodigo ===
        "superadmin"
    ) {

        return res.redirect(
            "/admin"
        );

    }


    /*
     * Todo usuario operativo debe
     * pertenecer a una agencia.
     */

    if (
        !usuario.agenciaId ||
        Number(usuario.agenciaId) <= 0
    ) {

        return res.status(403).send(
            "Tu usuario no está asociado a una agencia."
        );

    }


    next();
}

module.exports = {
    requerirAutenticacion,
    requerirSuperadmin,
    requerirUsuarioAgencia
};