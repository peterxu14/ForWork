const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    selectFile: () => ipcRenderer.invoke('select-file'),
    readFolderStructure: (folderPath) => ipcRenderer.invoke('read-folder-structure', folderPath),
    // 添加新的API
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    browseDirectory: (folderPath) => ipcRenderer.invoke('browse-directory', folderPath),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    copyFiles: (sourceFiles, targetDirectory) => ipcRenderer.invoke('copy-files', sourceFiles, targetDirectory)
});