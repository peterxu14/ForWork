console.log('Preload script is running!');

const { contextBridge, ipcRenderer } = require('electron');

// 在window对象上暴露API
contextBridge.exposeInMainWorld('electronAPI', {
  // 读取文件夹结构
  readFolderStructure: (folderPath) => ipcRenderer.invoke('read-folder-structure', folderPath),
  
  // 打开文件
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  
  // 选择文件
  selectFile: () => ipcRenderer.invoke('select-file'),
  
  // 选择文件夹
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // 读取文件内容
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath)
});