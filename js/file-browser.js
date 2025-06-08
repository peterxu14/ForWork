/**
 * 文件浏览器功能
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化文件浏览器
    initFileBrowser();
});

// 全局变量
let currentDirectory = null;
let directoryHistory = [];
let selectedItems = [];

// 初始化文件浏览器
function initFileBrowser() {
    // 绑定选择文件夹按钮事件
    const selectFolderBtn = document.getElementById('select-folder-btn');
    if (selectFolderBtn) {
        selectFolderBtn.addEventListener('click', handleSelectFolder);
    }
    
    // 绑定刷新按钮事件
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshCurrentDirectory);
    }
    
    // 绑定上级目录按钮事件
    const goUpBtn = document.getElementById('go-up-btn');
    if (goUpBtn) {
        goUpBtn.addEventListener('click', handleGoUp);
    }
    
    // 设置拖放区域事件
    setupDropZone();
    
    // 检查是否有保存的上次访问目录
    const lastDirectory = localStorage.getItem('lastDirectory');
    if (lastDirectory) {
        currentDirectory = lastDirectory;
        browseDirectory(currentDirectory);
    }
}

// 选择文件夹
async function handleSelectFolder() {
    try {
        if (!window.electronAPI) {
            showStatus('此功能仅在Electron应用中可用', 'error');
            return;
        }
        
        const result = await window.electronAPI.selectFolder();
        
        if (result.success) {
            currentDirectory = result.path;
            directoryHistory = [];
            localStorage.setItem('lastDirectory', currentDirectory);
            await browseDirectory(currentDirectory);
        } else {
            showStatus('未选择文件夹', 'info');
        }
    } catch (error) {
        showStatus(`选择文件夹失败: ${error.message}`, 'error');
    }
}

// 刷新当前目录
async function refreshCurrentDirectory() {
    if (!currentDirectory) {
        showStatus('请先选择一个文件夹', 'info');
        return;
    }
    
    await browseDirectory(currentDirectory);
}

// 浏览目录
async function browseDirectory(dirPath) {
    try {
        if (!window.electronAPI) {
            showStatus('此功能仅在Electron应用中可用', 'error');
            return;
        }
        
        // 显示加载状态
        showStatus('正在加载文件夹内容...', 'info');
        
        // 调用主进程浏览目录
        const result = await window.electronAPI.browseDirectory(dirPath);
        
        if (!result.success) {
            showStatus(`浏览文件夹失败: ${result.error}`, 'error');
            return;
        }
        
        // 更新当前目录
        currentDirectory = result.data.currentPath;
        
        // 更新界面
        updateBreadcrumb(currentDirectory);
        updateNavigationButtons();
        displayDirectoryContents(result.data);
        
        showStatus(`已加载 ${result.data.directories.length} 个文件夹和 ${result.data.files.length} 个文件`, 'success');
    } catch (error) {
        showStatus(`浏览文件夹失败: ${error.message}`, 'error');
    }
}

// 返回上级目录
async function handleGoUp() {
    if (currentDirectory) {
        // 不使用require('path')，而是使用字符串操作获取父目录
        const parentPath = getParentDirectory(currentDirectory);
        if (parentPath !== currentDirectory) {
            directoryHistory.push(currentDirectory);
            await browseDirectory(parentPath);
        }
    }
}

// 获取父目录路径的辅助函数
function getParentDirectory(dirPath) {
    // 处理Windows路径（使用反斜杠）
    if (dirPath.includes('\\')) {
        // 如果是根目录（如 C:\），则返回自身
        if (/^[A-Za-z]:\\$/.test(dirPath)) {
            return dirPath;
        }
        // 移除末尾的反斜杠（如果有）
        const normalizedPath = dirPath.endsWith('\\') ? dirPath.slice(0, -1) : dirPath;
        // 查找最后一个反斜杠的位置
        const lastSlashIndex = normalizedPath.lastIndexOf('\\');
        // 如果找不到反斜杠或者是驱动器根目录，则返回驱动器根目录
        if (lastSlashIndex <= 2) { // 如 C:\ 的情况
            return dirPath.substring(0, 3); // 返回如 C:\
        }
        // 返回父目录
        return normalizedPath.substring(0, lastSlashIndex) + '\\';
    } 
    // 处理Unix路径（使用正斜杠）
    else if (dirPath.includes('/')) {
        // 如果是根目录，则返回自身
        if (dirPath === '/') {
            return dirPath;
        }
        // 移除末尾的斜杠（如果有）
        const normalizedPath = dirPath.endsWith('/') ? dirPath.slice(0, -1) : dirPath;
        // 查找最后一个斜杠的位置
        const lastSlashIndex = normalizedPath.lastIndexOf('/');
        // 如果找不到斜杠，则返回根目录
        if (lastSlashIndex === -1) {
            return '/';
        }
        // 如果是根目录下的文件夹，则返回根目录
        if (lastSlashIndex === 0) {
            return '/';
        }
        // 返回父目录
        return normalizedPath.substring(0, lastSlashIndex) + '/';
    }
    // 如果没有路径分隔符，则返回原路径
    return dirPath;
}

// 进入目录
async function enterDirectory(dirPath) {
    directoryHistory.push(currentDirectory);
    await browseDirectory(dirPath);
}

// 显示目录内容
function displayDirectoryContents(data) {
    const fileListElement = document.getElementById('file-list');
    if (!fileListElement) return;
    
    // 清空文件列表
    fileListElement.innerHTML = '';
    
    // 合并文件夹和文件
    const directories = data.directories || [];
    const files = data.files || [];
    
    if (directories.length === 0 && files.length === 0) {
        fileListElement.innerHTML = '<p class="empty-message">此文件夹为空</p>';
        return;
    }
    
    // 先添加文件夹
    directories.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'file-list-item directory';
        itemElement.dataset.path = item.path;
        itemElement.dataset.type = 'directory';
        
        itemElement.innerHTML = `
            <div class="file-icon">📁</div>
            <div class="file-name">${escapeHtml(item.name)}</div>
            <div class="file-size">${item.size}</div>
            <div class="file-date">${formatDateForDisplay(item.modified)}</div>
        `;
        
        itemElement.addEventListener('click', () => enterDirectory(item.path));
        itemElement.addEventListener('dblclick', () => enterDirectory(item.path));
        
        fileListElement.appendChild(itemElement);
    });
    
    // 再添加文件
    files.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'file-list-item file';
        itemElement.dataset.path = item.path;
        itemElement.dataset.type = 'file';
        
        // 根据文件扩展名选择图标
        const fileIcon = getFileIcon(item.extension);
        
        itemElement.innerHTML = `
            <div class="file-icon">${fileIcon}</div>
            <div class="file-name">${escapeHtml(item.name)}</div>
            <div class="file-size">${item.size}</div>
            <div class="file-date">${formatDateForDisplay(item.modified)}</div>
        `;
        
        itemElement.addEventListener('click', () => selectItem(itemElement));
        itemElement.addEventListener('dblclick', () => openFile(item.path));
        
        fileListElement.appendChild(itemElement);
    });
}

// 根据文件扩展名获取图标
function getFileIcon(extension) {
    if (!extension) return '📄';
    
    extension = extension.toLowerCase();
    
    // 图片文件
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'].includes(extension)) {
        return '🖼️';
    }
    
    // 文档文件
    if (['.doc', '.docx', '.pdf', '.txt', '.md'].includes(extension)) {
        return '📝';
    }
    
    // 表格文件
    if (['.xls', '.xlsx', '.csv'].includes(extension)) {
        return '📊';
    }
    
    // 压缩文件
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) {
        return '🗜️';
    }
    
    // 音频文件
    if (['.mp3', '.wav', '.ogg', '.flac'].includes(extension)) {
        return '🎵';
    }
    
    // 视频文件
    if (['.mp4', '.avi', '.mov', '.wmv', '.mkv'].includes(extension)) {
        return '🎬';
    }
    
    // 代码文件
    if (['.js', '.html', '.css', '.py', '.java', '.c', '.cpp', '.php'].includes(extension)) {
        return '📜';
    }
    
    // 默认图标
    return '📄';
}

// 选择项目
function selectItem(element) {
    // 清除其他选中项
    document.querySelectorAll('.file-list-item.selected').forEach(item => {
        if (item !== element) {
            item.classList.remove('selected');
        }
    });
    
    // 切换当前项的选中状态
    element.classList.toggle('selected');
    
    // 更新选中项列表
    updateSelectedItems();
}

// 更新选中项列表
function updateSelectedItems() {
    selectedItems = [];
    document.querySelectorAll('.file-list-item.selected').forEach(item => {
        selectedItems.push({
            path: item.dataset.path,
            type: item.dataset.type
        });
    });
}

// 打开文件
async function openFile(filePath) {
    if (window.electronAPI) {
        try {
            showStatus(`正在打开文件: ${filePath}`, 'info');
            const result = await window.electronAPI.openFile(filePath);
            
            if (result.success) {
                showStatus('文件已打开', 'success');
            } else {
                showStatus(`打开文件失败: ${result.error}`, 'error');
            }
        } catch (error) {
            showStatus(`打开文件时发生错误: ${error.message}`, 'error');
        }
    } else {
        showStatus('此功能仅在Electron应用中可用', 'error');
    }
}

// 更新面包屑导航
function updateBreadcrumb(dirPath) {
    const breadcrumb = document.getElementById('path-breadcrumb');
    if (!breadcrumb) return;
    
    breadcrumb.innerHTML = '';
    
    if (!dirPath) {
        const item = document.createElement('div');
        item.className = 'breadcrumb-item active';
        item.textContent = '请选择文件夹';
        breadcrumb.appendChild(item);
        return;
    }
    
    // 分割路径
    const pathParts = dirPath.split(/[\\/]/).filter(Boolean);
    
    // 添加根目录
    const rootItem = document.createElement('div');
    rootItem.className = 'breadcrumb-item';
    
    // 获取驱动器名称
    const driveLetter = dirPath.substring(0, 2);
    
    const rootLink = document.createElement('a');
    rootLink.href = '#';
    rootLink.textContent = driveLetter;
    rootLink.addEventListener('click', (e) => {
        e.preventDefault();
        browseDirectory(driveLetter + '\\');
    });
    
    rootItem.appendChild(rootLink);
    breadcrumb.appendChild(rootItem);
    
    // 添加路径部分
    let currentPath = driveLetter + '\\';
    
    pathParts.forEach((part, index) => {
        currentPath += part + '\\';
        
        const item = document.createElement('div');
        item.className = 'breadcrumb-item';
        
        if (index === pathParts.length - 1) {
            item.classList.add('active');
            item.textContent = part;
        } else {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = part;
            
            // 保存当前路径的副本，以便在闭包中使用
            const pathCopy = currentPath;
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                browseDirectory(pathCopy);
            });
            
            item.appendChild(link);
        }
        
        breadcrumb.appendChild(item);
    });
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const goUpBtn = document.getElementById('go-up-btn');
    if (goUpBtn) {
        goUpBtn.disabled = !currentDirectory;
    }
}

// 设置拖放区域
function setupDropZone() {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;
    
    // 阻止默认行为以允许放置
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // 高亮显示放置区域
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    // 处理放置事件
    dropZone.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropZone.classList.add('active');
    }
    
    function unhighlight() {
        dropZone.classList.remove('active');
    }
}

// 处理文件放置
async function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (!currentDirectory) {
        showStatus('请先选择一个目标文件夹', 'error');
        return;
    }
    
    showStatus(`正在处理 ${files.length} 个文件...`, 'info');
    
    // 这里需要实现文件复制功能
    // 由于浏览器安全限制，这部分功能需要在Electron中实现
    // 这里只是一个示例，实际功能需要添加到main.js和preload.js中
    
    if (window.electronAPI && window.electronAPI.copyFiles) {
        try {
            const fileList = Array.from(files).map(file => file.path);
            const result = await window.electronAPI.copyFiles(fileList, currentDirectory);
            
            if (result.success) {
                showStatus(`成功复制 ${result.copied} 个文件到当前目录`, 'success');
                refreshCurrentDirectory();
            } else {
                showStatus(`复制文件失败: ${result.error}`, 'error');
            }
        } catch (error) {
            showStatus(`复制文件时发生错误: ${error.message}`, 'error');
        }
    } else {
        showStatus('拖放上传功能仅在Electron应用中可用', 'error');
    }
}

// 显示状态信息
function showStatus(message, type = 'info') {
    const statusBar = document.getElementById('status-bar');
    if (!statusBar) return;
    
    statusBar.textContent = message;
    
    // 根据类型设置样式
    statusBar.className = '';
    statusBar.classList.add(`status-${type}`);
    
    // 如果是临时消息，设置定时器清除
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusBar.textContent = '就绪';
            statusBar.className = '';
        }, 5000);
    }
}

// 格式化日期显示
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}