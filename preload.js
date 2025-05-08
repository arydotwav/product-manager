const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  crearProducto: (producto) => ipcRenderer.invoke('crear-producto', producto),
  listarProductos: () => ipcRenderer.invoke('listar-productos'),
  editarProducto: (producto) => ipcRenderer.invoke('editar-producto', producto),
  eliminarProducto: (id) => ipcRenderer.invoke('eliminar-producto', id),
  imprimirTicket: (data) => ipcRenderer.send('imprimir-ticket', data),

});
