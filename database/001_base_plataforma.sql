/* =========================================================
   AUTORENTCAR
   FASE 2 - BASE PRINCIPAL DE LA PLATAFORMA
========================================================= */

USE autorentcar;

/* =========================================================
   PLANES
========================================================= */

CREATE TABLE IF NOT EXISTS planes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255) NULL,

    precio_mensual DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    limite_vehiculos INT UNSIGNED NULL,
    limite_sucursales INT UNSIGNED NULL,
    limite_empleados INT UNSIGNED NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_planes_nombre (nombre)
);


/* =========================================================
   AGENCIAS
========================================================= */

CREATE TABLE IF NOT EXISTS agencias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,

    slug VARCHAR(160) NOT NULL,

    nombre_legal VARCHAR(180) NULL,

    identificacion_fiscal VARCHAR(50) NULL,

    correo VARCHAR(150) NULL,

    telefono VARCHAR(30) NULL,

    whatsapp VARCHAR(30) NULL,

    direccion VARCHAR(255) NULL,

    ciudad VARCHAR(100) NULL,

    provincia VARCHAR(100) NULL,

    pais VARCHAR(100) NOT NULL
        DEFAULT 'República Dominicana',

    logo VARCHAR(255) NULL,

    color_primario VARCHAR(20) NULL,

    color_secundario VARCHAR(20) NULL,

    estado ENUM(
        'prueba',
        'activa',
        'suspendida',
        'vencida',
        'cancelada'
    ) NOT NULL DEFAULT 'prueba',

    fecha_creacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_agencias_slug (slug)
);


/* =========================================================
   SUSCRIPCIONES
========================================================= */

CREATE TABLE IF NOT EXISTS suscripciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    agencia_id INT UNSIGNED NOT NULL,

    plan_id INT UNSIGNED NOT NULL,

    fecha_inicio DATE NOT NULL,

    fecha_fin DATE NULL,

    estado ENUM(
        'prueba',
        'activa',
        'vencida',
        'suspendida',
        'cancelada'
    ) NOT NULL DEFAULT 'prueba',

    precio_acordado DECIMAL(10, 2) NULL,

    renovacion_automatica BOOLEAN NOT NULL DEFAULT FALSE,

    fecha_creacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_suscripciones_agencia
        FOREIGN KEY (agencia_id)
        REFERENCES agencias(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_suscripciones_plan
        FOREIGN KEY (plan_id)
        REFERENCES planes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_suscripciones_agencia (
        agencia_id
    ),

    INDEX idx_suscripciones_plan (
        plan_id
    ),

    INDEX idx_suscripciones_estado (
        estado
    )
);


/* =========================================================
   ROLES
========================================================= */

CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(80) NOT NULL,

    codigo VARCHAR(80) NOT NULL,

    descripcion VARCHAR(255) NULL,

    nivel SMALLINT UNSIGNED NOT NULL DEFAULT 100,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    fecha_creacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_roles_codigo (codigo)
);


/* =========================================================
   USUARIOS
========================================================= */

CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    agencia_id INT UNSIGNED NULL,

    rol_id INT UNSIGNED NOT NULL,

    nombre VARCHAR(120) NOT NULL,

    apellido VARCHAR(120) NULL,

    correo VARCHAR(150) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    telefono VARCHAR(30) NULL,

    estado ENUM(
        'activo',
        'inactivo',
        'bloqueado'
    ) NOT NULL DEFAULT 'activo',

    ultimo_acceso DATETIME NULL,

    intentos_fallidos SMALLINT UNSIGNED NOT NULL
        DEFAULT 0,

    fecha_creacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuarios_agencia
        FOREIGN KEY (agencia_id)
        REFERENCES agencias(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_usuarios_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    UNIQUE KEY uk_usuarios_correo (
        correo
    ),

    INDEX idx_usuarios_agencia (
        agencia_id
    ),

    INDEX idx_usuarios_rol (
        rol_id
    ),

    INDEX idx_usuarios_estado (
        estado
    )
);


/* =========================================================
   ROLES INICIALES DE LA PLATAFORMA
========================================================= */

INSERT INTO roles (
    nombre,
    codigo,
    descripcion,
    nivel
)
VALUES
(
    'Superadministrador',
    'superadmin',
    'Propietario general de la plataforma.',
    1
),
(
    'Administrador de agencia',
    'admin_agencia',
    'Administrador principal de una agencia.',
    10
),
(
    'Empleado',
    'empleado',
    'Usuario interno de una agencia con permisos limitados.',
    20
)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    nivel = VALUES(nivel);


/* =========================================================
   PLANES INICIALES DE DEMOSTRACIÓN
========================================================= */

INSERT INTO planes (
    nombre,
    descripcion,
    precio_mensual,
    limite_vehiculos,
    limite_sucursales,
    limite_empleados
)
VALUES
(
    'Inicial',
    'Plan básico para agencias pequeñas.',
    0.00,
    10,
    1,
    2
),
(
    'Profesional',
    'Plan para agencias en crecimiento.',
    0.00,
    50,
    3,
    10
),
(
    'Empresarial',
    'Plan avanzado para agencias con varias sucursales.',
    0.00,
    NULL,
    NULL,
    NULL
)
ON DUPLICATE KEY UPDATE
    descripcion = VALUES(descripcion),
    limite_vehiculos = VALUES(limite_vehiculos),
    limite_sucursales = VALUES(limite_sucursales),
    limite_empleados = VALUES(limite_empleados);