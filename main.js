const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const dbPath = path.join(__dirname, 'db', 'productos.db');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, '');
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    descripcion TEXT,
    precio REAL,
    codigo_barra TEXT UNIQUE,
    imagen TEXT
  )`);
});


function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false
    }    
  });

  win.loadFile('index.html');
}

// Handlers de IPC
ipcMain.handle('crear-producto', async (event, producto) => {
  return new Promise((resolve, reject) => {
    const codigo = `CB-${Date.now()}`;
    db.run(
      `INSERT INTO productos (nombre, descripcion, precio, codigo_barra, imagen) VALUES (?, ?, ?, ?, ?)`,
      [
        producto.nombre, 
        producto.descripcion, 
        producto.precio, 
        codigo, 
        producto.imagen || ''  // Si no se provee imagen, queda vacío
      ],
      function (err) {
        if (err) reject(err);
        resolve({ id: this.lastID, codigo });
      }
    );
  });
});


ipcMain.handle('listar-productos', () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM productos`, [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
});

// Eliminar producto
ipcMain.handle('eliminar-producto', async (event, idProducto) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM productos WHERE id = ?`, [idProducto], function (err) {
      if (err) {
        reject(err);
      } else {
        // Emitir un evento para actualizar la lista de productos
        db.all('SELECT * FROM productos', [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            event.sender.send('productos-actualizados', rows);  // Enviar la lista actualizada al renderer
            resolve({ success: true });
          }
        });
      }
    });
  });
});


// Editar producto
ipcMain.handle('editar-producto', async (event, producto) => {
  return new Promise((resolve, reject) => {
    // Se agrega actualizar imagen
    db.run(
      `UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, imagen = ? WHERE id = ?`,
      [producto.nombre, producto.descripcion, producto.precio, producto.imagen, producto.id],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      }
    );
  });
});


ipcMain.on('imprimir-ticket', (event, data) => {
  const { productos, total } = data;

  // Contenido HTML del ticket
  let contenido = `
    <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            background: #f1f1f1;
            margin: 0;
          }
          .ticket {
            background: white;
            width: 350px;
            margin: 0 auto;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          h1 {
            text-align: center;
            font-size: 24px;
            color: #333;
          }
          ul {
            list-style-type: none;
            padding: 0;
          }
          li {
            font-size: 18px;
            color: #555;
            padding: 5px 0;
            border-bottom: 1px dashed #ddd;
          }
          .total {
            font-size: 22px;
            font-weight: bold;
            color: #333;
            text-align: right;
            margin-top: 10px;
          }
          .footer {
            font-size: 12px;
            color: #888;
            text-align: center;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <h1>Ticket de Compra</h1>
          <ul>
            ${productos.map(p => `<li>${p.nombre} - $${p.precio.toFixed(2)}</li>`).join('')}
          </ul>
          <div class="total">Total: $${total.toFixed(2)}</div>
          <div class="footer">
            <p>Gracias por su compra</p>
            <p>Visítenos nuevamente</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Crear ventana oculta para mostrar el ticket
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    show: true, // Mostrar la ventana antes de imprimir
    webPreferences: {
      offscreen: true
    }
  });

  // Cargar el contenido HTML
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(contenido)}`);

  // Imprimir una vez que se haya cargado el contenido
  win.webContents.print({silent: false, printBackground: true}, (success, failureReason) => {
  if (!success) {
    console.error('Error al imprimir:', failureReason);
  } else {
    console.log('Ticket impreso con éxito');
  }
  // Comentamos la línea de cierre temporalmente para no cerrar la ventana
  win.close();
});

});

// Iniciar la app
app.whenReady().then(() => {
  createWindow();

  // En macOS vuelve a abrir si se cierra la ventana pero no la app
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Cerrar app completamente
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
