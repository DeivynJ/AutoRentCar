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

module.exports = {
    requerirAutenticacion,
    requerirSuperadmin
};