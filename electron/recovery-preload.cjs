const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('nexoRecovery', Object.freeze(Object.fromEntries(
  ['status', 'retry', 'folder', 'diagnostic', 'select', 'restore', 'exit'].map(action => [action, (...args) => ipcRenderer.invoke('nexo-recovery:' + action, ...args)]))));
