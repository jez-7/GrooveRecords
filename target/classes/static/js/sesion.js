$(document).ready(function () {
    const token = localStorage.getItem('token');

    function obtenerRolesDesdeToken(token) {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = atob(payloadBase64);
        const payload = JSON.parse(decodedPayload);
        return payload.roles;
    }

    if (token) {
        const roles = obtenerRolesDesdeToken(token);

        // Mostrar opciones de usuario autenticado (desktop y mobile)
        $('#profileLink, #profileLinkMobile').show();
        $('#logoutLink, #logoutLinkMobile').show();
        $('#loginLink, #loginLinkMobile').hide();

        if (roles.includes('Administrador')) {
            $('#subirProducto, #subirProductoMobile').show();
            $('#gestionarUsuarios, #gestionarUsuariosMobile').show();
            $('#gestionarProductos, #gestionarProductosMobile').show();
        }

        if (roles.includes('Empleado')) {
            $('#subirProducto, #subirProductoMobile').show();
            $('#gestionarProductos, #gestionarProductosMobile').show();
        }

        $('#logoutLink, #logoutLinkMobile').on('click', function () {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });

    } else {
        // Usuario no autenticado
        $('#profileLink, #profileLinkMobile').hide();
        $('#logoutLink, #logoutLinkMobile').hide();
        $('#loginLink, #loginLinkMobile').show();

        $('#subirProducto, #subirProductoMobile').hide();
        $('#gestionarUsuarios, #gestionarUsuariosMobile').hide();
        $('#gestionarProductos, #gestionarProductosMobile').hide();
    }

    // Menú toggles
    $('#userIcon').on('click', function (event) {
        event.stopPropagation();
        $('#userMenu').toggle();
    });

    $('#userIconMobile').on('click', function (event) {
        event.stopPropagation();
        $('#userMenuMobile').toggle();
    });

    // Ocultar menú si se clickea fuera
    $(document).on('click', function (event) {
        if (!$(event.target).closest('.user').length) {
            $('#userMenu, #userMenuMobile').hide();
        }
    });
});
