document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No se encontró token de autenticación');
        mostrarMensajeNoAutenticado();
    } else {
        cargarProductosCarrito();
    }
});

function mostrarMensajeNoAutenticado() {
    // Mensaje para versión móvil
    const contenedorCarrito = document.getElementById('productosCarrito');
    if (contenedorCarrito) {
        contenedorCarrito.innerHTML = `
            <div class="alert alert-warning" role="alert">
                No has iniciado sesión. Por favor, <a href="login.html" class="alert-link">inicia sesión</a> para ver tu carrito.
            </div>
        `;
    }
    
    // Mensaje para versión desktop
    const contenedorCarritoDesktop = document.getElementById('productosCarritoDesktop');
    if (contenedorCarritoDesktop) {
        contenedorCarritoDesktop.innerHTML = `
            <div class="alert alert-warning" role="alert">
                No has iniciado sesión. Por favor, <a href="login.html" class="alert-link">inicia sesión</a> para ver tu carrito.
            </div>
        `;
    }
}

async function cargarProductosCarrito() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No se encontró token de autenticación');
        }

        const response = await fetch('https://groove-records-nag2.onrender.com/api/carrito/productos', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token'); 
                throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const productosCarrito = await response.json();
        mostrarProductosCarrito(productosCarrito);
    } catch (error) {
        console.error('Error al cargar los productos del carrito:', error);
        mostrarMensaje(error.message, 'error');
    }
}

async function eliminarProducto(productoId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No se encontró token de autenticación');
        }

        const response = await fetch(`https://groove-records-nag2.onrender.com/api/carrito/productos/${productoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Recargar los productos del carrito
        await cargarProductosCarrito();
        mostrarMensaje('Producto eliminado exitosamente', 'success');
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        mostrarMensaje(error.message, 'error');
    }
}

function mostrarProductosCarrito(productos) {
    // Versión responsive/móvil
    const contenedorCarrito = document.getElementById('productosCarrito');
    let htmlMobile = '';
    
    // Versión desktop (mantiene diseño original)
    const contenedorCarritoDesktop = document.getElementById('productosCarritoDesktop');
    let htmlDesktop = '';
    
    let total = 0;

    if (productos.length === 0) {
        htmlMobile = '<div class="p-4 text-center">Tu carrito está vacío.</div>';
        htmlDesktop = '<p>Tu carrito está vacío.</p>';
    } else {
        // Generando HTML para móvil
        htmlMobile = '<div class="card-body p-0">';
        productos.forEach(producto => {
            const subtotal = producto.precio * producto.cantidad;
            total += subtotal;
            htmlMobile += `
                <div class="card mb-3 border-0 border-bottom">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-12 col-sm-8 mb-2 mb-sm-0">
                                <div class="d-flex align-items-center">
                                    <img src="${producto.imagenUrl}" class="img-fluid rounded-3 me-3" alt="${producto.nombre}" style="width: 65px; height: 65px; object-fit: cover;">
                                    <div>
                                        <h5 class="mb-1">${producto.nombre}</h5>
                                        <p class="mb-0 text-muted">${producto.precio.toFixed(0)} x ${producto.cantidad}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-sm-4">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0 fw-bold">${subtotal.toFixed(0)}</h5>
                                    <button class="btn text-danger" onclick="eliminarProducto(${producto.id})">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
             
            htmlDesktop += `
            <div class="d-flex justify-content-center">
                <div class="card mb-3 desktop-producto-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center flex-wrap">
                            <div class="d-flex align-items-center mb-2 mb-md-0">
                                <img src="${producto.imagenUrl}" class="img-fluid rounded-3 me-3" alt="${producto.nombre}" style="width: 50px;">
                                <h5 class="mb-0">${producto.nombre}</h5>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <h5 class="fw-normal mb-0">x${producto.cantidad}</h5>
                                <h5 class="mb-0">${subtotal.toFixed(0)}</h5>
                                <a href="#!" onclick="eliminarProducto(${producto.id})" style="color: #cecece;">
                                    <i class="fas fa-trash-alt"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        });
        htmlMobile += '</div>';
    }

    // Actualizando ambos contenedores
    if (contenedorCarrito) {
        contenedorCarrito.innerHTML = htmlMobile;
    }
    
    if (contenedorCarritoDesktop) {
        contenedorCarritoDesktop.innerHTML = htmlDesktop;
    }
    
    actualizarTotal(total);
}

function actualizarTotal(total) {
    // Actualiza el total en la versión móvil
    const totalElement = document.getElementById('totalCarrito');
    if (totalElement) {
        totalElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center px-4 py-3">
                <h5 class="mb-0">Total a pagar:</h5>
                <h4 class="mb-0 fw-bold">${total.toFixed(0)}</h4>
            </div>
        `;
    }
    
    // Actualiza el total en la versión desktop (estilo original)
    const totalElementDesktop = document.getElementById('totalCarritoDesktop');
    if (totalElementDesktop) {
        totalElementDesktop.textContent = `Total a pagar: ${total.toFixed(2)}`;
    }
}

function mostrarMensaje(mensaje, tipo) {
    const contenedorMensaje = document.getElementById('mensajeCarrito');
    if (contenedorMensaje) {
        contenedorMensaje.innerHTML = `
            <div class="alert alert-${tipo === 'error' ? 'danger' : 'success'}" role="alert">
                ${mensaje}
            </div>
        `;
        setTimeout(() => {
            contenedorMensaje.innerHTML = '';
        }, 3000);
    }
}