/* =========================================================
   AUTORENTCAR
   FASE 2 - DATOS INICIALES
========================================================= */

USE autorentcar;

/* =========================================================
   AGENCIA DE DEMOSTRACIÓN
========================================================= */

INSERT INTO agencias (
    nombre,
    slug,
    nombre_legal,
    correo,
    telefono,
    whatsapp,
    direccion,
    ciudad,
    provincia,
    pais,
    estado
)
VALUES (
    'AutoRentCar',
    'autorentcar',
    'AutoRentCar',
    'contacto@autorentcar.com',
    '+1 849-276-6030',
    '+1 849-276-6030',
    NULL,
    'Santiago',
    'Santiago',
    'República Dominicana',
    'activa'
)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    nombre_legal = VALUES(nombre_legal),
    correo = VALUES(correo),
    telefono = VALUES(telefono),
    whatsapp = VALUES(whatsapp),
    ciudad = VALUES(ciudad),
    provincia = VALUES(provincia),
    pais = VALUES(pais),
    estado = VALUES(estado);


/* =========================================================
   SUSCRIPCIÓN DE LA AGENCIA
========================================================= */

INSERT INTO suscripciones (
    agencia_id,
    plan_id,
    fecha_inicio,
    fecha_fin,
    estado,
    precio_acordado,
    renovacion_automatica
)
SELECT
    a.id,
    p.id,
    CURDATE(),
    NULL,
    'activa',
    p.precio_mensual,
    FALSE
FROM agencias a
INNER JOIN planes p
    ON p.nombre = 'Profesional'
WHERE a.slug = 'autorentcar'
AND NOT EXISTS (
    SELECT 1
    FROM suscripciones s
    WHERE s.agencia_id = a.id
    AND s.estado IN (
        'activa',
        'prueba'
    )
);