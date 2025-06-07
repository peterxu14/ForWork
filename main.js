const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

console.log('Electron 主进程已启动！'); // 添加这一行

// 保持对window对象的全局引用，避免JavaScript对象被垃圾回收时，窗口被自动关闭
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // 在createWindow函数中，确保有以下配置
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // 确保路径正确
      // 添加编码设置
      defaultEncoding: 'utf8'
    }
  });

  // 加载index.html
  mainWindow.loadFile('index.html');

  // 打开开发者工具（可选）
  // 在createWindow函数中取消注释以下行
  // mainWindow.webContents.openDevTools();

  // 当window被关闭时，触发下面的事件
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// 处理读取文件夹结构的IPC消息
ipcMain.handle('read-folder-structure', async (event, folderPath) => {
  try {
    const structure = await readFolderStructure(folderPath);
    return { success: true, data: structure };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 读取文件夹结构的函数
async function readFolderStructure(folderPath) {
  // 检查路径是否存在
  if (!fs.existsSync(folderPath)) {
    throw new Error(`路径不存在: ${folderPath}`);
  }

  // 获取文件夹内容
  const items = fs.readdirSync(folderPath, { withFileTypes: true });
  
  // 项目列表（二级文件夹）
  const projects = [];
  
  // 遍历文件夹内容
  for (const item of items) {
    if (item.isDirectory()) {
      const projectPath = path.join(folderPath, item.name);
      const projectFiles = await getProjectFiles(projectPath);
      
      projects.push({
        name: item.name,
        path: projectPath,
        files: projectFiles
      });
    }
  }
  
  return projects;
}

// 获取项目文件的函数
async function getProjectFiles(projectPath) {
  const result = [];
  const items = fs.readdirSync(projectPath, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(projectPath, item.name);
    
    if (item.isDirectory()) {
      // 递归获取子文件夹中的文件
      const subFiles = await getProjectFiles(itemPath);
      result.push({
        name: item.name,
        path: itemPath,
        isDirectory: true,
        children: subFiles
      });
    } else {
      // 获取文件信息
      const stats = fs.statSync(itemPath);
      result.push({
        name: item.name,
        path: itemPath,
        isDirectory: false,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      });
    }
  }
  
  return result;
}

// 处理打开文件的IPC消息
// 处理打开文件的IPC消息
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    console.log('尝试打开文件:', filePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('文件不存在:', filePath);
      return { success: false, error: '文件不存在' };
    }
    
    // 使用系统默认程序打开文件
    const result = await shell.openPath(filePath);
    console.log('打开文件结果:', result);
    
    if (result !== '') {
      console.error('打开文件错误:', result);
      return { success: false, error: result };
    }
    
    return { success: true };
  } catch (error) {
    console.error('打开文件异常:', error);
    return { success: false, error: error.message };
  }
});

// 添加文件选择对话框处理
ipcMain.handle('select-file', async () => {
  const { dialog } = require('electron');
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md', 'json'] },
        { name: 'Images', extensions: ['jpg', 'png', 'gif', 'bmp'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] }
      ]
    });
    
    if (result.canceled) {
      return { success: false, cancelled: true };
    } else {
      return { success: true, filePath: result.filePaths[0] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 添加文件夹选择对话框处理
ipcMain.handle('select-folder', async () => {
  const { dialog } = require('electron');
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    if (result.canceled) {
      return { success: false, cancelled: true };
    } else {
      return { success: true, folderPath: result.filePaths[0] };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 添加读取文件内容功能
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    return { 
      success: true, 
      content: content,
      size: stats.size,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});