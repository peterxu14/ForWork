/**
 * 文件索引功能
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化文件索引
    initFileIndex();
});

// 全局变量
let currentFileId = null;
let allTags = [];

// 初始化文件索引
function initFileIndex() {
    // 初始化存储
    Storage.init();
    
    // 加载文件索引
    loadFileIndex();
    
    // 加载标签
    loadTags();
    
    // 绑定搜索按钮事件
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    // 绑定搜索框回车事件
    const searchInput = document.getElementById('file-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // 绑定标签展开/收起按钮事件
    const toggleTagsBtn = document.getElementById('toggle-tags-btn');
    if (toggleTagsBtn) {
        toggleTagsBtn.addEventListener('click', toggleTagsDisplay);
    }
    
    // 绑定模态框关闭按钮事件
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // 绑定取消按钮事件
    const cancelBtn = document.getElementById('cancel-file-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAllModals);
    }
    
    // 绑定查看模态框关闭按钮事件
    const closeViewBtn = document.getElementById('close-view-file-btn');
    if (closeViewBtn) {
        closeViewBtn.addEventListener('click', closeAllModals);
    }
    
    // 绑定表单提交事件
    const fileForm = document.getElementById('file-form');
    if (fileForm) {
        fileForm.addEventListener('submit', handleFileFormSubmit);
    }
    
    // 绑定编辑按钮事件
    const editBtn = document.getElementById('edit-file-btn');
    if (editBtn) {
        editBtn.addEventListener('click', handleEditFile);
    }
    
    // 绑定删除按钮事件
    const deleteBtn = document.getElementById('delete-file-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteFile);
    }
    
    // 绑定打开文件按钮事件
    const openFileBtn = document.getElementById('open-file-btn');
    if (openFileBtn) {
        openFileBtn.addEventListener('click', handleOpenFile);
    }
    
    // 绑定选择文件夹按钮事件
    const selectFolderBtn = document.getElementById('select-folder-btn');
    if (selectFolderBtn) {
        selectFolderBtn.addEventListener('click', handleSelectFolder);
    }
    
    // 绑定上级目录按钮事件
    const goUpBtn = document.getElementById('go-up-btn');
    if (goUpBtn) {
        goUpBtn.addEventListener('click', handleGoUp);
    }
    
    // 检查URL参数是否有指定文件ID
    const urlParams = getUrlParams();
    if (urlParams.id) {
        showFileDetails(urlParams.id);
    }
}

// 标签展开/收起功能
function toggleTagsDisplay() {
    const tagsContainer = document.getElementById('file-tags');
    if (!tagsContainer) return;
    
    // 切换显示状态
    if (tagsContainer.classList.contains('collapsed')) {
        // 展开标签
        tagsContainer.classList.remove('collapsed');
        // 显示所有标签
        const tags = tagsContainer.querySelectorAll('.tag');
        tags.forEach(tag => tag.style.display = '');
    } else {
        // 收起标签
        tagsContainer.classList.add('collapsed');
        // 只显示活跃的标签和前5个标签
        const tags = tagsContainer.querySelectorAll('.tag');
        let visibleCount = 0;
        
        // 首先显示所有活跃标签
        const activeTags = tagsContainer.querySelectorAll('.tag.active');
        activeTags.forEach(tag => {
            tag.style.display = '';
            visibleCount++;
        });
        
        // 然后显示非活跃标签，直到总共显示5个
        tags.forEach(tag => {
            if (!tag.classList.contains('active')) {
                if (visibleCount < 5) {
                    tag.style.display = '';
                    visibleCount++;
                } else {
                    tag.style.display = 'none';
                }
            }
        });
    }
}

// 添加全局变量
let currentDirectory = null;
let directoryHistory = [];

// 修改处理读取文件夹的函数
async function handleReadFolder() {
    try {
        console.log('开始读取当前文件夹...');
        
        // 检查是否在Electron环境中
        if (!window.electronAPI) {
            showNotification('此功能仅在Electron应用中可用', 'error');
            return;
        }
        
        // 检查是否已选择文件夹
        if (!currentDirectory) {
            showNotification('请先选择一个文件夹', 'info');
            await handleSelectFolder();
            return;
        }
        
        // 显示加载提示
        showNotification('正在读取文件夹结构，请稍候...', 'info');
        
        // 浏览当前目录
        await browseDirectory(currentDirectory);
        
    } catch (error) {
        console.error('读取文件夹错误:', error);
        showNotification(`读取文件夹时发生错误: ${error.message}`, 'error');
    }
}

// 选择文件夹
async function handleSelectFolder() {
    try {
        if (!window.electronAPI) {
            showNotification('此功能仅在Electron应用中可用', 'error');
            return;
        }
        
        const result = await window.electronAPI.selectFolder();
        
        if (result.success) {
            currentDirectory = result.path;
            updateCurrentPathDisplay();
            await browseDirectory(currentDirectory);
        } else {
            showNotification('未选择文件夹', 'info');
        }
    } catch (error) {
        showNotification(`选择文件夹失败: ${error.message}`, 'error');
    }
}

// 浏览目录
async function browseDirectory(dirPath) {
    try {
        if (!window.electronAPI) {
            showNotification('此功能仅在Electron应用中可用', 'error');
            return;
        }
        
        // 显示加载提示
        showNotification('正在加载文件夹内容...', 'info');
        
        // 调用主进程浏览目录
        const result = await window.electronAPI.browseDirectory(dirPath);
        
        if (!result.success) {
            showNotification(`浏览文件夹失败: ${result.error}`, 'error');
            return;
        }
        
        // 更新当前目录
        currentDirectory = result.data.currentPath;
        
        // 更新界面
        updateCurrentPathDisplay();
        updateNavigationButtons();
        displayDirectoryContents(result.data);
        
        showNotification('文件夹内容已加载', 'success');
    } catch (error) {
        showNotification(`浏览文件夹失败: ${error.message}`, 'error');
    }
}

// 返回上级目录
async function handleGoUp() {
    if (currentDirectory) {
        const parentPath = getParentDirectory(currentDirectory);
        if (parentPath !== currentDirectory) {
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
    const fileListElement = document.getElementById('file-index-list');
    if (!fileListElement) return;
    
    // 清空文件列表
    fileListElement.innerHTML = '';
    
    // 合并文件夹和文件
    const allItems = [...data.directories, ...data.files];
    
    if (allItems.length === 0) {
        fileListElement.innerHTML = '<p class="empty-message">此文件夹为空</p>';
        return;
    }
    
    allItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `list-item ${item.type}`;
        
        const icon = item.type === 'directory' ? '📁' : '📄';
        
        itemElement.innerHTML = `
            <div class="list-item-header" style="cursor: pointer;">
                <span class="list-item-icon">${icon}</span>
                <span class="list-item-title">${escapeHtml(item.name)}</span>
                <span class="list-item-size">${item.size}</span>
                <span class="list-item-date">${formatDateForDisplay(item.modified)}</span>
            </div>
        `;
        
        // 添加点击事件监听器
        const headerElement = itemElement.querySelector('.list-item-header');
        if (headerElement) {
            headerElement.addEventListener('click', () => {
                if (item.type === 'directory') {
                    enterDirectory(item.path);
                } else {
                    openFileFromBrowser(item.path);
                }
            });
        }
        
        fileListElement.appendChild(itemElement);
    });
}

// 从浏览器打开文件
function openFileFromBrowser(filePath) {
    if (window.electronAPI) {
        window.electronAPI.openFile(filePath)
            .then(result => {
                showNotification('文件已打开', 'success');
            })
            .catch(error => {
                showNotification(`打开文件时发生错误: ${error.message}`, 'error');
            });
    }
}

// 更新当前路径显示
function updateCurrentPathDisplay() {
    const pathDisplay = document.getElementById('current-path-display');
    if (pathDisplay && currentDirectory) {
        pathDisplay.textContent = currentDirectory;
    }
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const goUpBtn = document.getElementById('go-up-btn');
    if (goUpBtn) {
        goUpBtn.disabled = !currentDirectory;
    }
}

// ... 其他现有函数 ...

// 导入项目文件的函数
async function importProjectFiles(project) {
    let count = 0;
    
    // 递归处理文件
    async function processFiles(files, projectName) {
        for (const file of files) {
            if (file.isDirectory && file.children) {
                // 处理子文件夹
                await processFiles(file.children, projectName);
            } else if (!file.isDirectory) {
                // 添加文件索引
                const fileExt = file.name.split('.').pop().toLowerCase();
                
                // 创建标签：项目名称和文件类型
                const tags = [projectName];
                if (fileExt) tags.push(fileExt);
                
                // 添加到存储
                Storage.addFile({
                    name: file.name,
                    path: file.path,
                    description: `项目: ${projectName}`,
                    tags: tags,
                    date: new Date(file.modifiedAt).toISOString(),
                    size: file.size
                });
                
                count++;
            }
        }
    }
    
    // 处理项目文件
    await processFiles(project.files, project.name);
    
    return count;
}

// 修改打开文件函数，使用Electron API
async function handleOpenFile() {
    const files = Storage.getFiles();
    const file = files.find(f => f.id === currentFileId);
    
    if (!file || !file.path) {
        showNotification('文件路径无效', 'error');
        return;
    }
    
    // 显示正在尝试打开文件的通知
    showNotification(`正在尝试打开文件: ${file.name}`, 'info');
    console.log('尝试打开文件:', file.path);
    
    // 检查是否在Electron环境中
    if (window.electronAPI) {
        // 在handleOpenFile函数中添加路径规范化
        const normalizedPath = file.path.replace(/\//g, '\\'); // 确保使用Windows路径格式
        console.log('规范化后的路径:', normalizedPath);
        
        window.electronAPI.openFile(normalizedPath)
            .then(result => {
                console.log('打开文件结果:', result);
                if (result.success) {
                    showNotification(`文件已打开: ${file.name}`, 'success');
                } else {
                    showNotification(`无法打开文件: ${result.error}`, 'error');
                }
            })
            .catch(error => {
                console.error('打开文件错误:', error);
                showNotification(`打开文件时发生错误: ${error.message}`, 'error');
            });
    } else {
        // 回退到原有的打开方法
        openLocalFile(file.path);
    }
}

// 加载文件索引
function loadFileIndex(searchTerm = '', selectedTags = []) {
    const fileListElement = document.getElementById('file-index-list');
    if (!fileListElement) return;
    
    // 获取文件索引数据
    let files = Storage.getFiles();
    
    // 应用搜索筛选
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        files = files.filter(file => 
            file.name.toLowerCase().includes(searchLower) || 
            (file.description && file.description.toLowerCase().includes(searchLower)) ||
            (file.path && file.path.toLowerCase().includes(searchLower))
        );
    }
    
    // 应用标签筛选
    if (selectedTags.length > 0) {
        files = files.filter(file => {
            if (!file.tags) return false;
            return selectedTags.some(tag => file.tags.includes(tag));
        });
    }
    
    // 按日期排序（最新的在前）
    files.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    
    // 清空文件列表
    fileListElement.innerHTML = '';
    
    if (files.length === 0) {
        fileListElement.innerHTML = '<p class="empty-message">暂无文件索引</p>';
        return;
    }
    
    // 添加文件项
    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'list-item';
        fileItem.dataset.id = file.id;
        
        const formattedDate = formatDateForDisplay(file.date || file.createdAt);
        const tagsHtml = file.tags && file.tags.length > 0 
            ? file.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('') 
            : '';
        
        fileItem.innerHTML = `
            <div class="list-item-header">
                <span class="list-item-title">${escapeHtml(file.name)}</span>
                <span class="list-item-date">${formattedDate}</span>
            </div>
            <div class="list-item-content">
                <p class="list-item-description">${file.description ? escapeHtml(truncateText(file.description, 100)) : ''}</p>
                <p class="list-item-path">${escapeHtml(file.path)}</p>
                <div class="list-item-tags">${tagsHtml}</div>
                <button class="btn" onclick="showFileDetails('${file.id}')">查看</button>
            </div>
        `;
        
        fileListElement.appendChild(fileItem);
    });
}

// 加载标签
function loadTags() {
    const tagsContainer = document.getElementById('file-tags');
    if (!tagsContainer) return;
    
    // 获取所有文件
    const files = Storage.getFiles();
    
    // 提取所有标签
    allTags = [];
    files.forEach(file => {
        if (file.tags && Array.isArray(file.tags)) {
            file.tags.forEach(tag => {
                if (!allTags.includes(tag)) {
                    allTags.push(tag);
                }
            });
        }
    });
    
    // 按字母顺序排序
    allTags.sort();
    
    // 清空标签容器
    tagsContainer.innerHTML = '';
    
    if (allTags.length === 0) {
        tagsContainer.innerHTML = '<p class="empty-message">暂无标签</p>';
        return;
    }
    
    // 添加标签
    allTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag clickable';
        tagElement.textContent = tag;
        tagElement.addEventListener('click', () => toggleTagFilter(tag, tagElement));
        
        tagsContainer.appendChild(tagElement);
    });
}

// 切换标签筛选
function toggleTagFilter(tag, tagElement) {
    tagElement.classList.toggle('active');
    
    // 获取所有选中的标签
    const selectedTags = [];
    document.querySelectorAll('#file-tags .tag.active').forEach(el => {
        selectedTags.push(el.textContent);
    });
    
    // 重新加载文件列表
    const searchInput = document.getElementById('file-search');
    const searchTerm = searchInput ? searchInput.value : '';
    loadFileIndex(searchTerm, selectedTags);
}

// 处理搜索
function handleSearch() {
    const searchInput = document.getElementById('file-search');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    
    // 获取选中的标签
    const selectedTags = [];
    document.querySelectorAll('#file-tags .tag.active').forEach(el => {
        selectedTags.push(el.textContent);
    });
    
    // 加载文件列表
    loadFileIndex(searchTerm, selectedTags);
}

// 显示添加文件模态框
function showAddFileModal() {
    const modal = document.getElementById('file-modal');
    const modalTitle = document.getElementById('file-modal-title');
    const fileForm = document.getElementById('file-form');
    
    if (!modal || !modalTitle || !fileForm) return;
    
    // 设置模态框标题
    modalTitle.textContent = '添加文件索引';
    
    // 重置表单
    fileForm.reset();
    
    // 设置日期为今天
    const dateInput = document.getElementById('file-date');
    if (dateInput) {
        dateInput.value = getCurrentDate();
    }
    
    // 显示模态框
    modal.style.display = 'block';
    
    // 清除当前文件ID
    currentFileId = null;
}

// 显示文件详情
function showFileDetails(id) {
    const modal = document.getElementById('view-file-modal');
    const modalTitle = document.getElementById('view-file-title');
    const contentElement = document.getElementById('view-file-content');
    
    if (!modal || !modalTitle || !contentElement) return;
    
    // 获取文件数据
    const files = Storage.getFiles();
    const file = files.find(f => f.id === id);
    
    if (!file) {
        showNotification('找不到指定的文件索引', 'error');
        return;
    }
    
    // 设置模态框标题
    modalTitle.textContent = `查看文件索引: ${file.name}`;
    
    // 设置内容
    const formattedDate = formatDateForDisplay(file.date || file.createdAt);
    const tagsHtml = file.tags && file.tags.length > 0 
        ? file.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('') 
        : '<span class="hint">无标签</span>';
    
    contentElement.innerHTML = `
        <div class="view-content">
            <div class="view-group">
                <label>文件名：</label>
                <div>${escapeHtml(file.name)}</div>
            </div>
            <div class="view-group">
                <label>文件路径：</label>
                <div>${escapeHtml(file.path)}</div>
            </div>
            <div class="view-group">
                <label>添加日期：</label>
                <div>${formattedDate}</div>
            </div>
            <div class="view-group">
                <label>描述：</label>
                <div>${file.description ? escapeHtml(file.description) : '<span class="hint">无描述</span>'}</div>
            </div>
            <div class="view-group">
                <label>标签：</label>
                <div class="tags-container">${tagsHtml}</div>
            </div>
        </div>
    `;
    
    // 显示模态框
    modal.style.display = 'block';
    
    // 设置当前文件ID
    currentFileId = id;
}

// 处理表单提交
function handleFileFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const nameInput = document.getElementById('file-name');
    const pathInput = document.getElementById('file-path');
    const descriptionInput = document.getElementById('file-description');
    const tagsInput = document.getElementById('file-tags-input');
    const dateInput = document.getElementById('file-date');
    
    if (!nameInput || !pathInput || !dateInput) {
        showNotification('表单数据不完整', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const path = pathInput.value.trim();
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const tagsText = tagsInput ? tagsInput.value.trim() : '';
    const date = dateInput.value;
    
    // 验证必填字段
    if (!name || !path || !date) {
        showNotification('请填写所有必填字段', 'error');
        return;
    }
    
    // 处理标签
    const tags = tagsText ? tagsText.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // 创建文件对象
    const fileData = {
        name,
        path,
        description,
        tags,
        date
    };
    
    let success = false;
    
    // 添加或更新文件
    if (currentFileId) {
        // 更新现有文件
        success = Storage.updateFile(currentFileId, fileData);
        if (success) {
            showNotification('文件索引已更新', 'success');
        }
    } else {
        // 添加新文件
        success = Storage.addFile(fileData);
        if (success) {
            showNotification('文件索引已添加', 'success');
        }
    }
    
    if (success) {
        // 关闭模态框
        closeAllModals();
        
        // 重新加载文件列表和标签
        loadFileIndex();
        loadTags();
    } else {
        showNotification('操作失败，请重试', 'error');
    }
}

// 处理编辑文件
function handleEditFile() {
    if (!currentFileId) {
        showNotification('未选择文件', 'error');
        return;
    }
    
    // 获取文件数据
    const files = Storage.getFiles();
    const file = files.find(f => f.id === currentFileId);
    
    if (!file) {
        showNotification('找不到指定的文件索引', 'error');
        return;
    }
    
    // 关闭查看模态框
    const viewModal = document.getElementById('view-file-modal');
    if (viewModal) {
        viewModal.style.display = 'none';
    }
    
    // 打开编辑模态框
    const modal = document.getElementById('file-modal');
    const modalTitle = document.getElementById('file-modal-title');
    const nameInput = document.getElementById('file-name');
    const pathInput = document.getElementById('file-path');
    const descriptionInput = document.getElementById('file-description');
    const tagsInput = document.getElementById('file-tags-input');
    const dateInput = document.getElementById('file-date');
    
    if (!modal || !modalTitle || !nameInput || !pathInput || !dateInput) return;
    
    // 设置模态框标题
    modalTitle.textContent = '编辑文件索引';
    
    // 填充表单数据
    nameInput.value = file.name || '';
    pathInput.value = file.path || '';
    if (descriptionInput) descriptionInput.value = file.description || '';
    if (tagsInput) tagsInput.value = file.tags ? file.tags.join(', ') : '';
    dateInput.value = formatDate(file.date || file.createdAt);
    
    // 显示模态框
    modal.style.display = 'block';
}

// 处理删除文件
function handleDeleteFile() {
    if (!currentFileId) {
        showNotification('未选择文件', 'error');
        return;
    }
    
    // 确认删除
    if (!confirm('确定要删除这个文件索引吗？此操作不可撤销。')) {
        return;
    }
    
    // 删除文件
    const success = Storage.deleteFile(currentFileId);
    
    if (success) {
        showNotification('文件索引已删除', 'success');
        
        // 关闭模态框
        closeAllModals();
        
        // 重新加载文件列表和标签
        loadFileIndex();
        loadTags();
    } else {
        showNotification('删除失败，请重试', 'error');
    }
}

// 处理打开文件
function handleOpenFile() {
    if (!currentFileId) {
        showNotification('请先选择一个文件', 'error');
        return;
    }
    
    // 获取文件数据
    const files = Storage.getFiles();
    const file = files.find(f => f.id === currentFileId);
    
    if (!file || !file.path) {
        showNotification('文件路径无效或文件不存在', 'error');
        return;
    }
    
    // 使用 Electron API 打开文件
    if (window.electronAPI) {
        window.electronAPI.openFile(file.path)
            .then(result => {
                if (result.success) {
                    console.log('文件打开成功:', file.path);
                    showNotification(`文件已打开: ${file.name}`, 'success');
                } else {
                    console.error('文件打开失败:', result.error);
                    showNotification(`无法打开文件: ${result.error}`, 'error');
                }
            })
            .catch(error => {
                console.error('打开文件时发生错误:', error);
                showNotification(`打开文件时发生错误: ${error.message}`, 'error');
            });
    } else {
        showNotification('Electron API 不可用', 'error');
    }
}

// 关闭所有模态框
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// 添加打开文件夹的功能
function openContainingFolder(filePath) {
    const folderPath = filePath.substring(0, filePath.lastIndexOf('\\'));
    console.log('尝试打开文件夹:', folderPath);
    
    if (window.electronAPI) {
        window.electronAPI.openFile(folderPath)
            .then(result => {
                if (result.success) {
                    showNotification('已打开文件所在文件夹', 'success');
                } else {
                    showNotification(`无法打开文件夹: ${result.error}`, 'error');
                }
            })
            .catch(error => {
                showNotification(`打开文件夹时发生错误: ${error.message}`, 'error');
            });
    }
}

const testOpenFileBtn = document.getElementById('testOpenFileBtn');
if (testOpenFileBtn) {
    testOpenFileBtn.addEventListener('click', () => {
        console.log('打开当前选中的文件...');
        // 直接调用handleOpenFile函数来打开当前选中的文件
        handleOpenFile();
    });
}
// 文件在这里结束，删除第688行之后的所有内容
