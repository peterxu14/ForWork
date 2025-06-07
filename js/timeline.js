/**
 * 时间线功能
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化时间线
    initTimeline();
});

// 全局变量
let currentEntryId = null;

// 初始化时间线
function initTimeline() {
    // 加载时间线数据
    loadTimeline();
    
    // 初始化日期筛选器
    initDateFilters();
    
    // 绑定添加按钮事件
    const addEntryBtn = document.getElementById('add-entry-btn');
    if (addEntryBtn) {
        addEntryBtn.addEventListener('click', showAddEntryModal);
    }
    
    // 绑定模态框关闭按钮事件
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // 绑定取消按钮事件
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAllModals);
    }
    
    // 绑定查看模态框关闭按钮事件
    const closeViewBtn = document.getElementById('close-view-btn');
    if (closeViewBtn) {
        closeViewBtn.addEventListener('click', closeAllModals);
    }
    
    // 绑定表单提交事件
    const entryForm = document.getElementById('entry-form');
    if (entryForm) {
        entryForm.addEventListener('submit', handleEntryFormSubmit);
    }
    
    // 绑定编辑按钮事件
    const editBtn = document.getElementById('edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', handleEditEntry);
    }
    
    // 绑定删除按钮事件
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteEntry);
    }
    
    // 绑定添加文件按钮事件
    const addFileBtn = document.getElementById('add-file-btn');
    if (addFileBtn) {
        addFileBtn.addEventListener('click', handleAddFile);
    }
    
    // 检查URL参数是否有指定条目ID
    const urlParams = getUrlParams();
    if (urlParams.id) {
        showEntryDetails(urlParams.id);
    }
}

// 初始化日期筛选器
function initDateFilters() {
    const monthFilter = document.getElementById('month-filter');
    const yearFilter = document.getElementById('year-filter');
    
    if (!monthFilter || !yearFilter) return;
    
    // 获取当前日期
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // 填充月份选择器
    monthFilter.innerHTML = '<option value="all">所有月份</option>';
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    monthNames.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        option.selected = index === currentMonth;
        monthFilter.appendChild(option);
    });
    
    // 填充年份选择器
    yearFilter.innerHTML = '<option value="all">所有年份</option>';
    const startYear = 2020; // 可以根据需要调整起始年份
    
    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '年';
        option.selected = year === currentYear;
        yearFilter.appendChild(option);
    }
    
    // 绑定筛选器变更事件
    monthFilter.addEventListener('change', loadTimeline);
    yearFilter.addEventListener('change', loadTimeline);
}

// 加载时间线数据
function loadTimeline() {
    const timelineElement = document.getElementById('timeline');
    if (!timelineElement) return;
    
    // 获取筛选值
    const monthFilter = document.getElementById('month-filter');
    const yearFilter = document.getElementById('year-filter');
    
    const selectedMonth = monthFilter ? monthFilter.value : 'all';
    const selectedYear = yearFilter ? yearFilter.value : 'all';
    
    // 获取时间线数据
    let timelineData = Storage.getTimeline();
    
    // 应用筛选
    if (selectedMonth !== 'all' || selectedYear !== 'all') {
        timelineData = timelineData.filter(entry => {
            const entryDate = new Date(entry.date);
            const monthMatch = selectedMonth === 'all' || entryDate.getMonth() === parseInt(selectedMonth);
            const yearMatch = selectedYear === 'all' || entryDate.getFullYear() === parseInt(selectedYear);
            return monthMatch && yearMatch;
        });
    }
    
    // 按日期排序（最新的在前）
    timelineData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 清空时间线
    timelineElement.innerHTML = '';
    
    if (timelineData.length === 0) {
        timelineElement.innerHTML = '<p class="empty-message">暂无时间线数据</p>';
        return;
    }
    
    // 添加时间线项
    timelineData.forEach(entry => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.dataset.id = entry.id;
        
        const formattedDate = formatDateForDisplay(entry.date);
        const previewContent = truncateText(entry.content, 150);
        
        timelineItem.innerHTML = `
            <div class="timeline-date">${formattedDate}</div>
            <div class="timeline-content" onclick="showEntryDetails('${entry.id}')">
                <h3 class="timeline-title">${escapeHtml(entry.title)}</h3>
                <div class="timeline-preview">${escapeHtml(previewContent)}</div>
            </div>
        `;
        
        timelineElement.appendChild(timelineItem);
    });
}

// 显示添加记录模态框
function showAddEntryModal() {
    // 重置表单
    const entryForm = document.getElementById('entry-form');
    if (entryForm) {
        entryForm.reset();
    }
    
    // 设置默认日期为今天
    const dateInput = document.getElementById('entry-date');
    if (dateInput) {
        dateInput.value = getCurrentDate();
    }
    
    // 清空文件列表
    const filesList = document.getElementById('entry-files');
    if (filesList) {
        filesList.innerHTML = '';
    }
    
    // 更新模态框标题
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = '添加工作记录';
    }
    
    // 重置当前条目ID
    currentEntryId = null;
    
    // 显示模态框
    const modal = document.getElementById('entry-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// 关闭所有模态框
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// 处理表单提交
function handleEntryFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const dateInput = document.getElementById('entry-date');
    const titleInput = document.getElementById('entry-title');
    const contentInput = document.getElementById('entry-content');
    
    if (!dateInput || !titleInput || !contentInput) return;
    
    const entry = {
        date: dateInput.value,
        title: titleInput.value,
        content: contentInput.value,
        files: [] // 可以在这里添加关联文件的功能
    };
    
    // 保存数据
    let success = false;
    
    if (currentEntryId) {
        // 更新现有条目
        success = Storage.updateTimelineEntry(currentEntryId, entry);
        if (success) {
            showNotification('工作记录已更新', 'success');
        }
    } else {
        // 添加新条目
        success = Storage.addTimelineEntry(entry);
        if (success) {
            showNotification('工作记录已添加', 'success');
        }
    }
    
    if (success) {
        // 关闭模态框
        closeAllModals();
        
        // 重新加载时间线
        loadTimeline();
    } else {
        showNotification('保存失败，请重试', 'error');
    }
}

// 显示条目详情
function showEntryDetails(id) {
    // 获取条目数据
    const timelineData = Storage.getTimeline();
    const entry = timelineData.find(item => item.id === id);
    
    if (!entry) {
        showNotification('找不到指定的工作记录', 'error');
        return;
    }
    
    // 设置当前条目ID
    currentEntryId = id;
    
    // 填充详情内容
    const viewTitleElement = document.getElementById('view-modal-title');
    const viewContentElement = document.getElementById('view-entry-content');
    
    if (viewTitleElement && viewContentElement) {
        viewTitleElement.textContent = '查看工作记录';
        
        const formattedDate = formatDateForDisplay(entry.date);
        
        viewContentElement.innerHTML = `
            <div class="view-entry-header">
                <h3>${escapeHtml(entry.title)}</h3>
                <div class="view-entry-date">${formattedDate}</div>
            </div>
            <div class="view-entry-body">
                <p>${escapeHtml(entry.content).replace(/\n/g, '<br>')}</p>
            </div>
        `;
        
        // 如果有关联文件，可以在这里显示
        if (entry.files && entry.files.length > 0) {
            const filesHtml = `
                <div class="view-entry-files">
                    <h4>相关文件</h4>
                    <ul>
                        ${entry.files.map(file => `<li>${escapeHtml(file.name)}</li>`).join('')}
                    </ul>
                </div>
            `;
            viewContentElement.innerHTML += filesHtml;
        }
    }
    
    // 显示模态框
    const modal = document.getElementById('view-entry-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// 处理编辑条目
function handleEditEntry() {
    // 获取当前条目数据
    const timelineData = Storage.getTimeline();
    const entry = timelineData.find(item => item.id === currentEntryId);
    
    if (!entry) {
        showNotification('找不到指定的工作记录', 'error');
        return;
    }
    
    // 填充表单
    const dateInput = document.getElementById('entry-date');
    const titleInput = document.getElementById('entry-title');
    const contentInput = document.getElementById('entry-content');
    
    if (dateInput && titleInput && contentInput) {
        dateInput.value = entry.date;
        titleInput.value = entry.title;
        contentInput.value = entry.content;
    }
    
    // 更新模态框标题
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = '编辑工作记录';
    }
    
    // 关闭查看模态框
    const viewModal = document.getElementById('view-entry-modal');
    if (viewModal) {
        viewModal.style.display = 'none';
    }
    
    // 显示编辑模态框
    const editModal = document.getElementById('entry-modal');
    if (editModal) {
        editModal.style.display = 'block';
    }
}

// 处理删除条目
function handleDeleteEntry() {
    if (!currentEntryId) return;
    
    // 确认删除
    if (!confirm('确定要删除这条工作记录吗？此操作不可撤销。')) {
        return;
    }
    
    // 执行删除
    const success = Storage.deleteTimelineEntry(currentEntryId);
    
    if (success) {
        showNotification('工作记录已删除', 'success');
        
        // 关闭模态框
        closeAllModals();
        
        // 重新加载时间线
        loadTimeline();
    } else {
        showNotification('删除失败，请重试', 'error');
    }
}

// 处理添加文件
function handleAddFile() {
    // 这里可以实现添加文件的功能
    // 可以打开一个文件选择对话框，或者显示一个文件索引选择界面
    alert('添加文件功能尚未实现');
    
    // 示例：可以添加一个简单的文件输入框
    // const fileInput = document.createElement('input');
    // fileInput.type = 'file';
    // fileInput.click();
    // fileInput.addEventListener('change', (e) => {
    //     const file = e.target.files[0];
    //     if (file) {
    //         // 处理选择的文件
    //         console.log('选择的文件:', file.name);
    //     }
    // });
}

// 全局函数：用于在HTML中直接调用显示条目详情
window.showEntryDetails = showEntryDetails;