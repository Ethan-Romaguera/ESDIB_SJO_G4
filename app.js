const contenido = document.querySelector('#contenido');
const barra = document.querySelector('.dock');
const ventana = document.querySelector('#info-dialog');
const clave = 'rona-vscode-v1';

const productos = {
    leche: {
        name: 'Leche UHT',
        unit: 'envases de 1 L',
        entity: 'Punto RONA · Centro',
        missing: '40 L',
        progress: 60,
        category: 'Alimentos',
        requirements: 'Envase cerrado de 1 L, sin daños. Comprueba la fecha indicada en el envase.'
    },
    higiene: {
        name: 'Jabón y gel',
        unit: 'envases',
        entity: 'Punto RONA · Norte',
        missing: '25 unidades',
        progress: 35,
        category: 'Higiene',
        requirements: 'Productos nuevos, precintados y con etiquetado legible.'
    },
    panales: {
        name: 'Pañales · talla 4',
        unit: 'paquetes',
        entity: 'Punto RONA · Este',
        missing: '18 paquetes',
        progress: 45,
        category: 'Infantil',
        requirements: 'Paquetes cerrados de talla 4. No se aceptan unidades sueltas.'
    }
};

const paginas = [
    'inicio',
    'logros',
    'donar',
    'mapa',
    'perfil',
    'seguimiento',
    'comunidad',
    'recompensas',
    'campana',
    'preparar'
];

let datos = {
    donations: [
        {
            product: 'higiene',
            qty: 1,
            received: false
        },
        {
            product: 'leche',
            qty: 4,
            received: true
        }
    ],
    reminder: false
};

let posicionAnterior = 0;
let aviso;
let primeraPantalla = true;

function existeProducto(nombre) {
    return Object.keys(productos).includes(nombre);
}

try {
    const guardado = JSON.parse(localStorage.getItem(clave));

    if (guardado && Array.isArray(guardado.donations)) {
        datos.donations = [];

        for (const donacion of guardado.donations) {
            if (
                donacion
                && existeProducto(donacion.product)
                && Number.isInteger(donacion.qty)
                && donacion.qty >= 1
                && donacion.qty <= 100
                && typeof donacion.received === 'boolean'
            ) {
                datos.donations.push(donacion);
            }
        }

        datos.reminder = Boolean(guardado.reminder);
    }
} catch (error) {
}

function guardar() {
    try {
        localStorage.setItem(clave, JSON.stringify(datos));
    } catch (error) {
    }
}

function textoSeguro(texto) {
    return String(texto)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function leerPlantilla(nombre, campos) {
    const plantilla = document.getElementById(nombre);

    if (!plantilla) {
        return '';
    }

    let html = plantilla.innerHTML;

    for (const campo in campos) {
        html = html.replaceAll(
            '{{' + campo + '}}',
            textoSeguro(campos[campo])
        );
    }

    return html;
}

function mostrarPagina() {
    const direccion = location.hash.substring(1).split('/');

    let pagina = direccion[0];
    let idProducto = direccion[1];

    if (!paginas.includes(pagina)) {
        pagina = 'inicio';
    }

    if (!existeProducto(idProducto)) {
        idProducto = 'leche';
    }

    const producto = productos[idProducto];
    const ultima = datos.donations[datos.donations.length - 1];

    let recibidas = 0;

    for (const donacion of datos.donations) {
        if (donacion.received) {
            recibidas++;
        }
    }

    const campos = {
        intentions: datos.donations.length,
        received: recibidas,
        medals: 0,
        receivedSummary: recibidas + ' entregas confirmadas',
        firstBadgeClass: 'locked',
        firstBadgeDescription: 'Confirma tu primera entrega',
        reminderChecked: '',
        productId: idProducto,
        productName: producto.name,
        entity: producto.entity,
        missing: producto.missing,
        progress: producto.progress,
        unit: producto.unit,
        requirements: producto.requirements,
        quantityLabel: '',
        reference: 'DEMO-' + String(datos.donations.length).padStart(3, '0'),
        receivedClass: '',
        receivedState: 'Pendiente de recepción',
        trackingAction: ''
    };

    if (recibidas === 1) {
        campos.receivedSummary = '1 entrega confirmada';
    }

    if (recibidas > 0) {
        campos.medals = 1;
        campos.firstBadgeClass = '';
        campos.firstBadgeDescription = 'Desbloqueada en esta demo';
    }

    if (datos.reminder) {
        campos.reminderChecked = 'checked';
    }

    if (pagina === 'seguimiento' && ultima) {
        const productoDonado = productos[ultima.product];

        campos.productName = productoDonado.name;
        campos.quantityLabel = ultima.qty + ' ' + productoDonado.unit;

        if (ultima.received) {
            campos.receivedClass = 'done';
            campos.receivedState = 'Recibida · simulación';
        }
    }

    contenido.innerHTML = leerPlantilla('page-' + pagina, campos);

    const recordatorio = document.querySelector('#reminder');

    if (recordatorio) {
        recordatorio.checked = datos.reminder;
    }

    if (pagina === 'seguimiento') {
        mostrarSeguimiento(ultima);
    }

    let seleccionada = pagina;

    if (
        pagina === 'campana'
        || pagina === 'preparar'
        || pagina === 'seguimiento'
    ) {
        seleccionada = 'donar';
    }

    if (pagina === 'recompensas') {
        seleccionada = 'logros';
    }

    for (const enlace of document.querySelectorAll('[data-nav]')) {
        enlace.removeAttribute('aria-current');

        if (enlace.dataset.nav === seleccionada) {
            enlace.setAttribute('aria-current', 'page');
        }
    }

    barra.classList.remove('compact');

    window.scrollTo({
        top: 0,
        behavior: 'instant'
    });

    posicionAnterior = 0;
    document.title = 'RONA · ' + pagina;

    if (!primeraPantalla) {
        contenido.focus({
            preventScroll: true
        });
    }

    primeraPantalla = false;
}

function mostrarSeguimiento(donacion) {
    if (!donacion) {
        contenido.innerHTML = `
            <h1>Aquí empieza tu recorrido.</h1>

            <p>
                Prepara una aportación para ver su seguimiento.
            </p>

            <a class="button" href="#donar">
                Buscar necesidades →
            </a>
        `;

        return;
    }

    let boton;

    if (donacion.received) {
        boton = document.createElement('a');
        boton.href = '#logros';
        boton.className = 'button block yellow';
        boton.textContent = 'Ver mi medalla →';
    } else {
        boton = document.createElement('button');
        boton.id = 'simulate-receipt';
        boton.className = 'button block';
        boton.textContent = 'Simular recepción de esta aportación';
    }

    const pasos = contenido.querySelector('.timeline');

    pasos.insertAdjacentElement('afterend', boton);
}

function mostrarAviso(mensaje) {
    const caja = document.querySelector('.toast');

    caja.textContent = mensaje;
    caja.classList.add('visible');

    clearTimeout(aviso);

    aviso = setTimeout(function () {
        caja.classList.remove('visible');
    }, 3500);
}

const informacion = {
    historia: [
        'Nuestra historia',
        'RONA conecta necesidades cercanas con personas que quieren ayudar. Es un proyecto académico.'
    ],
    equipo: [
        'Quiénes somos',
        'La propuesta reúne donantes, entidades y voluntariado. Los puntos de esta demo son ficticios.'
    ],
    como: [
        'Cómo donar',
        'Elige una necesidad, revisa los requisitos, selecciona cantidad y horario y prepara tu entrega.'
    ],
    impacto: [
        'Ayuda visible',
        'Una intención no es una entrega. La entidad confirmaría lo recibido y publicaría los resultados de la campaña.'
    ],
    voluntariado: [
        'Ofrece tu tiempo',
        'Esta demo muestra actividades de ejemplo y no reserva plazas de voluntariado.'
    ]
};

function abrirInformacion(nombre) {
    const textos = informacion[nombre];

    if (!textos) {
        return;
    }

    document.querySelector('#dialog-content').innerHTML =
        '<h2>' + textoSeguro(textos[0]) + '</h2>' +
        '<p>' + textoSeguro(textos[1]) + '</p>';

    ventana.showModal();
}

function cambiarNoticia(numero) {
    const carrusel = document.querySelector('#carousel-slide');

    if (numero === 0) {
        const copia = document.createElement('div');

        copia.innerHTML = document.getElementById('page-inicio').innerHTML;

        carrusel.innerHTML = copia.querySelector('#carousel-slide').innerHTML;
    } else {
        carrusel.innerHTML = leerPlantilla('slide-' + numero, {});
    }

    for (const boton of document.querySelectorAll('[data-slide]')) {
        boton.setAttribute('aria-pressed', 'false');

        if (Number(boton.dataset.slide) === numero) {
            boton.setAttribute('aria-pressed', 'true');
        }
    }
}

function filtrarProductos(categoria) {
    for (const boton of document.querySelectorAll('[data-filter]')) {
        boton.setAttribute(
            'aria-pressed',
            String(boton.dataset.filter === categoria)
        );
    }

    for (const tarjeta of document.querySelectorAll('[data-category]')) {
        tarjeta.hidden = false;

        if (
            categoria !== 'Todo'
            && tarjeta.dataset.category !== categoria
        ) {
            tarjeta.hidden = true;
        }
    }
}

function cambiarCantidad(cambio) {
    const contador = document.querySelector('#quantity');

    let cantidad = Number(contador.value) + cambio;

    if (cantidad < 1) {
        cantidad = 1;
    }

    if (cantidad > 100) {
        cantidad = 100;
    }

    contador.value = cantidad;
}

function mostrarPuntos(busqueda, seleccionado) {
    const lista = document.querySelector('#point-list');
    const palabra = busqueda.toLowerCase().trim();

    let html = '';

    for (const id in productos) {
        const producto = productos[id];

        const texto = (
            producto.name + ' ' +
            producto.entity + ' ' +
            producto.category
        ).toLowerCase();

        let mostrar = texto.includes(palabra);

        if (seleccionado !== '') {
            mostrar = id === seleccionado;
        }

        if (mostrar) {
            html += `
                <article class="card">
                    <h3>${textoSeguro(producto.entity)}</h3>

                    <p>
                        Necesita: ${textoSeguro(producto.name)}
                    </p>

                    <a
                        class="button secondary block"
                        href="#campana/${id}"
                    >
                        Consultar campaña →
                    </a>
                </article>
            `;
        }
    }

    if (html === '') {
        html = '<p>No hay puntos con esa búsqueda.</p>';
    }

    lista.innerHTML = html;

    for (const punto of document.querySelectorAll('[data-point]')) {
        punto.setAttribute(
            'aria-pressed',
            String(punto.dataset.point === seleccionado)
        );
    }
}

document.addEventListener('click', function (evento) {
    const boton = evento.target.closest('button');

    if (!boton) {
        return;
    }

    if (boton.dataset.route) {
        location.hash = boton.dataset.route;
    } else if (boton.dataset.info) {
        abrirInformacion(boton.dataset.info);
    } else if (boton.dataset.slide !== undefined) {
        cambiarNoticia(Number(boton.dataset.slide));
    } else if (boton.dataset.filter) {
        filtrarProductos(boton.dataset.filter);
    } else if (boton.dataset.qty) {
        cambiarCantidad(Number(boton.dataset.qty));
    } else if (boton.dataset.point) {
        document.querySelector('#point-search').value = '';

        mostrarPuntos('', boton.dataset.point);
    } else if (boton.classList.contains('close-dialog')) {
        ventana.close();
    } else if (
        boton.id === 'simulate-receipt'
        && datos.donations.length > 0
    ) {
        datos.donations[datos.donations.length - 1].received = true;

        guardar();
        mostrarPagina();

        mostrarAviso('Recepción simulada. Tu medalla está disponible.');
    } else if (boton.id === 'reset-demo') {
        if (confirm('¿Borrar los datos de esta demostración?')) {
            datos.donations = [];
            datos.reminder = false;

            guardar();
            mostrarPagina();

            mostrarAviso('Datos de demostración borrados.');
        }
    }
});

document.addEventListener('submit', function (evento) {
    if (evento.target.id !== 'donation-form') {
        return;
    }

    evento.preventDefault();

    if (!evento.target.reportValidity()) {
        return;
    }

    const producto = evento.target.dataset.product;
    const cantidad = Number(document.querySelector('#quantity').value);

    if (
        !existeProducto(producto)
        || !Number.isInteger(cantidad)
        || cantidad < 1
        || cantidad > 100
    ) {
        return;
    }

    datos.donations.push({
        product: producto,
        qty: cantidad,
        received: false
    });

    guardar();

    location.hash = 'seguimiento';

    mostrarAviso(
        'Intención guardada. Es una simulación, no una reserva real.'
    );
});

document.addEventListener('input', function (evento) {
    if (evento.target.id === 'point-search') {
        mostrarPuntos(evento.target.value, '');
    }
});

document.addEventListener('change', function (evento) {
    if (evento.target.id === 'reminder') {
        datos.reminder = evento.target.checked;

        guardar();

        mostrarAviso(
            'Preferencia guardada. Esta demo no envía avisos.'
        );
    }
});

window.addEventListener('scroll', function () {
    const posicion = Math.max(0, window.scrollY);

    if (posicion < 50) {
        barra.classList.remove('compact');
        posicionAnterior = posicion;
    } else if (posicion > posicionAnterior + 16) {
        barra.classList.add('compact');
        posicionAnterior = posicion;
    } else if (posicion < posicionAnterior - 16) {
        barra.classList.remove('compact');
        posicionAnterior = posicion;
    }
}, {
    passive: true
});

window.addEventListener('hashchange', mostrarPagina);

mostrarPagina();