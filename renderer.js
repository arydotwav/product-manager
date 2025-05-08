const form = document.getElementById('productoForm');
const lista = document.getElementById('lista');
const inputBusqueda = document.getElementById('barcode-search');
const resultadoBusqueda = document.getElementById('search-result');
const inputBuscarProducto = document.getElementById('buscar-producto');

const productosEscaneados = [];
let total = 0;
let descuentoAplicado = 0;

//total general
const totalContainer = document.createElement('div');
totalContainer.id = 'total-container';
totalContainer.style.marginTop = '2em';
totalContainer.style.padding = '1em';
totalContainer.style.border = '1px solid #ddd';
totalContainer.style.borderRadius = '5px';
document.body.appendChild(totalContainer);

//total
const totalDiv = document.createElement('div');
totalDiv.id = 'total-precio';
totalDiv.style.marginBottom = '1em';
totalContainer.appendChild(totalDiv);

//imprimir ticket
const botonImprimir = document.createElement('button');
botonImprimir.innerText = 'Imprimir Ticket';
botonImprimir.style.padding = '0.5em 1em';
botonImprimir.style.marginTop = '1em';
botonImprimir.onclick = () => {
  window.api.imprimirTicket({
    productos: productosEscaneados,
    total: total
  });
};
totalContainer.appendChild(botonImprimir);

//cupon
const cuponDiv = document.createElement('div');
cuponDiv.id = 'cupon-container';
cuponDiv.style.marginTop = '1em';

const cuponInput = document.createElement('input');
cuponInput.type = 'number';
cuponInput.placeholder = 'Introduce el % de descuento';
cuponInput.style.marginRight = '10px';
cuponInput.style.padding = '0.5em';

const aplicarCuponBtn = document.createElement('button');
aplicarCuponBtn.innerText = 'Aplicar Cupón';
aplicarCuponBtn.style.padding = '0.5em 1em';

cuponDiv.appendChild(cuponInput);
cuponDiv.appendChild(aplicarCuponBtn);
totalContainer.appendChild(cuponDiv);

//reset carrito
const botonReset = document.createElement('button');
botonReset.innerText = 'Resetear Carrito';
botonReset.style.padding = '0.5em 1em';
botonReset.style.margin = '0.5em 1em';
botonReset.onclick = () => {
  productosEscaneados.length = 0;
  total = 0;
  descuentoAplicado = 0;
  cuponInput.value = '';
  actualizarTotal();
};
document.body.appendChild(botonReset);

function actualizarTotal() {
  const totalConDescuento = total - descuentoAplicado;

  totalDiv.innerHTML = `
    <h3>Total: $${totalConDescuento.toLocaleString('es-AR')}</h3>
    ${descuentoAplicado > 0 ? `<p style="color: green;">Descuento aplicado: -$${descuentoAplicado.toLocaleString('es-AR')}</p>` : ''}
    <ul>
      ${productosEscaneados.map((p, idx) =>
        `<li style="display: flex; align-items: center; margin-bottom: 10px;">
           ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 5px;">` : ''}
           <span>${p.nombre} - $${p.precio.toLocaleString('es-AR')} (x${p.cantidad || 1})</span>
           <button data-idx="${idx}" class="subtract-item" style="margin-left: 10px;">- Restar</button>
           <button data-idx="${idx}" class="add-item" style="margin-left: 10px;">+ Agregar</button>
           <button data-idx="${idx}" class="remove-item" style="margin-left: 10px;">✕ Eliminar</button>
         </li>`
      ).join('')}
    </ul>
  `;

  totalDiv.querySelectorAll('.subtract-item').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.idx);
      const producto = productosEscaneados[idx];
      if (producto.cantidad > 1) {
        producto.cantidad -= 1;
        total -= producto.precio;
        actualizarTotal();
      }
    };
  });

  totalDiv.querySelectorAll('.add-item').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.idx);
      const producto = productosEscaneados[idx];
      producto.cantidad = (producto.cantidad || 1) + 1;
      total += producto.precio;
      actualizarTotal();
    };
  });

  totalDiv.querySelectorAll('.remove-item').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.idx);
      const producto = productosEscaneados[idx];
      total -= producto.precio * (producto.cantidad || 1);
      productosEscaneados.splice(idx, 1);
      actualizarTotal();
    };
  });
}

aplicarCuponBtn.onclick = () => {
  const porcentajeDescuento = parseFloat(cuponInput.value.trim());
  if (isNaN(porcentajeDescuento) || porcentajeDescuento <= 0 || porcentajeDescuento > 100) {
    alert('Porcentaje inválido. Introduce un valor entre 1 y 100.');
    return;
  }

  descuentoAplicado = (total * porcentajeDescuento) / 100;
  alert(`Se aplicó un descuento del ${porcentajeDescuento}%.`);
  actualizarTotal();
};

async function mostrarProductos() {
  const productos = await window.api.listarProductos();
  lista.innerHTML = '';

  productos.forEach(p => {
    const div = document.createElement('div');
    div.id = `producto-${p.id}`;
    div.innerHTML = `
      <h3>${p.nombre} - $${p.precio.toLocaleString('es-AR')}</h3>
      <p>${p.descripcion}</p>
      ${p.imagen ? `<img src="${p.imagen}" alt="Imagen de ${p.nombre}" style="max-width:150px; margin-top:10px;">` : ''}
      <svg id="barcode-${p.id}"></svg>
      <button onclick="eliminarProducto(${p.id})">Eliminar</button>
      <button onclick="descargarCodigoBarras(${p.id})">Descargar Código de Barras</button>
    `;
    lista.appendChild(div);

    JsBarcode(`#barcode-${p.id}`, p.codigo_barra, {
      format: "CODE128",
      width: 1,
      height: 40,
      displayValue: true
    });
  });
}

form.addEventListener('submit', async (e) => {
  try {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Before window.api call');
    const res = await window.api.crearProducto(producto);
    console.log('After window.api call');
    alert(`Producto creado con código: ${res.codigo}`);
    form.reset();
    await mostrarProductos();
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("Error al crear el producto");
  }
  return false;
});

function filtrarProductosEnLista(texto) {
  const productos = document.querySelectorAll('#lista > div');
  productos.forEach(producto => {
    const nombreProducto = producto.querySelector('h3').textContent.toLowerCase();
    const descripcionProducto = producto.querySelector('p').textContent.toLowerCase();

    if (nombreProducto.includes(texto.toLowerCase()) || descripcionProducto.includes(texto.toLowerCase())) {
      producto.style.display = 'block';
    } else {
      producto.style.display = 'none';
    }
  });
}

inputBuscarProducto.addEventListener('input', (e) => {
  const nombre = e.target.value.trim();
  filtrarProductosEnLista(nombre);
});

function descargarCodigoBarras(productoId) {
  const svgElement = document.querySelector(`#barcode-${productoId}`);
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const pngData = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngData;
    a.download = `codigo-barras-${productoId}.png`;
    a.click();
  };

  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
}

async function buscarProductoPorCodigo(codigo) {
  const productos = await window.api.listarProductos();
  const encontrado = productos.find(p => p.codigo_barra === codigo);

  if (encontrado) {
    resultadoBusqueda.innerHTML = `
      <h3>${encontrado.nombre} - $${parseFloat(encontrado.precio).toFixed(2)}</h3>
      <p>${encontrado.descripcion}</p>
      <svg id="barcode-busqueda"></svg>
    `;
    JsBarcode("#barcode-busqueda", encontrado.codigo_barra, {
      format: "CODE128",
      width: 2,
      height: 40,
      displayValue: true
    });

    productosEscaneados.push(encontrado);
    total += parseFloat(encontrado.precio);
    actualizarTotal();
    inputBusqueda.value = '';
  } else {
    resultadoBusqueda.innerHTML = '<p style="color: red;">Producto no encontrado</p>';
  }
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

form.addEventListener('submit', async (e) => {
  try {
    e.preventDefault();
    e.stopPropagation();
    
    const producto = {
      nombre: document.getElementById('nombre').value,
      descripcion: document.getElementById('descripcion').value,
      precio: parseFloat(document.getElementById('precio').value)
    };

    const imagenInput = document.getElementById('imagen');
    if (imagenInput && imagenInput.files && imagenInput.files[0]) {
      producto.imagen = await fileToDataURL(imagenInput.files[0]);
    } else {
      producto.imagen = '';
    }

    const res = await window.api.crearProducto(producto);
    alert(`Producto creado con código: ${res.codigo}`);
    form.reset();
    await mostrarProductos();
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("Error al crear el producto");
  }
  return false;
});

async function eliminarProducto(id) {
  try {
    const respuesta = await window.api.eliminarProducto(id);
    if (respuesta.success) {
      alert("Producto eliminado con éxito");
      mostrarProductos();
    }
  } catch (error) {
    console.error("Error al eliminar el producto", error);
  }
}

//busqueda de codigo de barras
inputBusqueda.addEventListener('paste', (e) => {
  e.preventDefault();
  const pasted = (e.clipboardData || window.clipboardData).getData('text');
  inputBusqueda.value = pasted;
  buscarProductoPorCodigo(pasted.trim());
});

let codigoBuffer = '';
let typingTimer;

inputBusqueda.addEventListener('input', (e) => {
  clearTimeout(typingTimer);
  codigoBuffer = e.target.value;

  typingTimer = setTimeout(() => {
    if (codigoBuffer.trim() !== '') {
      buscarProductoPorCodigo(codigoBuffer.trim());
    }
  }, 400);
});

window.onload = () => {
  mostrarProductos();
  actualizarTotal();
};