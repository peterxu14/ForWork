/**
 * 工作总结功能
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化工作总结
    initSummary();
});

// 全局变量
let currentSummaryId = null;

// 初始化工作总结
function initSummary() {
    // 初始化存储
    Storage.init();
    
    // 加载工作总结列表
    loadSummaryList();
    
    // 绑定创建总结按钮事件
    const createSummaryBtn = document.getElementById('create-summary-btn');
    if (createSummaryBtn) {
        createSummaryBtn.addEventListener('click', showCreateSummaryModal);
    }
    
    // 绑定类型筛选器变更事件
    const typeFilter = document.getElementById('summary-type');
    if (typeFilter) {
        typeFilter.addEventListener('change', loadSummaryList);
    }
    
    // 绑定模态框关闭按钮事件
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // 绑定取消按钮事件
    const cancelBtn = document.getElementById('cancel-summary-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAllModals);
    }
    
    // 绑定查看模态框关闭按钮事件
    const closeViewBtn = document.getElementById('close-view-summary-btn');
    if (closeViewBtn) {
        closeViewBtn.addEventListener('click', closeAllModals);
    }
    
    // 绑定表单提交事件
    const summaryForm = document.getElementById('summary-form');
    if (summaryForm) {
        summaryForm.addEventListener('submit', handleSummaryFormSubmit);
    }
    
    // 绑定编辑按钮事件
    const editBtn = document.getElementById('edit-summary-btn');
    if (editBtn) {
        editBtn.addEventListener('click', handleEditSummary);
    }
    
    // 绑定删除按钮事件
    const deleteBtn = document.getElementById('delete-summary-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteSummary);
    }
    
    // 绑定导出按钮事件
    const exportBtn = document.getElementById('export-summary-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportSummary);
    }
    
    const exportViewBtn = document.getElementById('export-view-summary-btn');
    if (exportViewBtn) {
        exportViewBtn.addEventListener('click', handleExportSummary);
    }
    
    // 绑定从时间线生成按钮事件
    const generateBtn = document.getElementById('generate-from-timeline');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateFromTimeline);
    }
    
    // 检查URL参数是否有指定总结ID
    const urlParams = getUrlParams();
    if (urlParams.id) {
        showSummaryDetails(urlParams.id);
    }
}

// 加载工作总结列表
function loadSummaryList() {
    const summaryListElement = document.getElementById('summary-list');
    if (!summaryListElement) return;
    
    // 获取筛选值
    const typeFilter = document.getElementById('summary-type');
    const selectedType = typeFilter ? typeFilter.value : 'all';
    
    // 获取工作总结数据
    let summaries = Storage.getSummaries();
    
    // 应用筛选
    if (selectedType !== 'all') {
        summaries = summaries.filter(summary => summary.periodType === selectedType);
    }
    
    // 按日期排序（最新的在前）
    summaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 清空列表
    summaryListElement.innerHTML = '';
    
    if (summaries.length === 0) {
        summaryListElement.innerHTML = '<p class="empty-message">暂无工作总结</p>';
        return;
    }
    
    // 添加总结项
    summaries.forEach(summary => {
        const summaryItem = document.createElement('div');
        summaryItem.className = 'list-item';
        summaryItem.dataset.id = summary.id;
        
        const periodText = getPeriodTypeText(summary.periodType);
        const dateRange = `${formatDateForDisplay(summary.startDate)} 至 ${formatDateForDisplay(summary.endDate)}`;
        
        summaryItem.innerHTML = `
            <div class="list-item-header">
                <span class="list-item-title">${escapeHtml(summary.title)}</span>
                <span class="list-item-date">${formatDateForDisplay(summary.createdAt)}</span>
            </div>
            <div class="list-item-content">
                <p class="list-item-period"><span class="tag">${periodText}</span> ${dateRange}</p>
                <p class="list-item-preview">${escapeHtml(truncateText(summary.content, 150))}</p>
                <button class="btn" onclick="showSummaryDetails('${summary.id}')">查看</button>
            </div>
        `;
        
        summaryListElement.appendChild(summaryItem);
    });
}

// 获取周期类型文本
function getPeriodTypeText(periodType) {
    switch (periodType) {
        case 'weekly': return '周报';
        case 'monthly': return '月报';
        case 'quarterly': return '季度报告';
        case 'yearly': return '年度总结';
        default: return '工作总结';
    }
}

// 显示创建总结模态框
function showCreateSummaryModal() {
    const modal = document.getElementById('summary-modal');
    const modalTitle = document.getElementById('summary-modal-title');
    const summaryForm = document.getElementById('summary-form');
    
    if (!modal || !modalTitle || !summaryForm) return;
    
    // 设置模态框标题
    modalTitle.textContent = '创建工作总结';
    
    // 重置表单
    summaryForm.reset();
    
    // 设置日期为今天
    const startDateInput = document.getElementById('summary-start-date');
    const endDateInput = document.getElementById('summary-end-date');
    const periodTypeSelect = document.getElementById('summary-period-type');
    
    if (startDateInput && endDateInput) {
        const today = new Date();
        
        // 根据周期类型设置默认日期范围
        if (periodTypeSelect) {
            periodTypeSelect.addEventListener('change', function() {
                updateDateRangeByPeriodType(this.value, startDateInput, endDateInput);
            });
            
            // 初始设置日期范围
            updateDateRangeByPeriodType(periodTypeSelect.value, startDateInput, endDateInput);
        } else {
            // 默认为本周
            const dayOfWeek = today.getDay() || 7; // 将周日从0转为7
            const mondayOffset = dayOfWeek - 1;
            const sundayOffset = 7 - dayOfWeek;
            
            const monday = new Date(today);
            monday.setDate(today.getDate() - mondayOffset);
            
            const sunday = new Date(today);
            sunday.setDate(today.getDate() + sundayOffset);
            
            startDateInput.value = formatDate(monday);
            endDateInput.value = formatDate(sunday);
        }
    }
    
    // 显示模态框
    modal.style.display = 'block';
    
    // 清除当前总结ID
    currentSummaryId = null;
}

// 根据周期类型更新日期范围
function updateDateRangeByPeriodType(periodType, startDateInput, endDateInput) {
    const today = new Date();
    
    switch (periodType) {
        case 'daily':
            // 日报：今天
            startDateInput.value = formatDate(today);
            endDateInput.value = formatDate(today);
            break;
            
        case 'weekly':
            // 周报：本周一到周日
            const dayOfWeek = today.getDay() || 7; // 将周日从0转为7
            const mondayOffset = dayOfWeek - 1;
            const sundayOffset = 7 - dayOfWeek;
            
            const monday = new Date(today);
            monday.setDate(today.getDate() - mondayOffset);
            
            const sunday = new Date(today);
            sunday.setDate(today.getDate() + sundayOffset);
            
            startDateInput.value = formatDate(monday);
            endDateInput.value = formatDate(sunday);
            break;
            
        case 'monthly':
            // 月报：本月第一天到最后一天
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            
            startDateInput.value = formatDate(firstDay);
            endDateInput.value = formatDate(lastDay);
            break;
            
        case 'quarterly':
            // 季度报告：本季度第一天到最后一天
            const quarter = Math.floor(today.getMonth() / 3);
            const firstDayOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
            const lastDayOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            
            startDateInput.value = formatDate(firstDayOfQuarter);
            endDateInput.value = formatDate(lastDayOfQuarter);
            break;
            
        case 'yearly':
            // 年度总结：今年第一天到最后一天
            const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
            const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
            
            startDateInput.value = formatDate(firstDayOfYear);
            endDateInput.value = formatDate(lastDayOfYear);
            break;
    }
}

// 显示总结详情
function showSummaryDetails(id) {
    const modal = document.getElementById('view-summary-modal');
    const modalTitle = document.getElementById('view-summary-title');
    const contentElement = document.getElementById('view-summary-content');
    
    if (!modal || !modalTitle || !contentElement) return;
    
    // 获取总结数据
    const summaries = Storage.getSummaries();
    const summary = summaries.find(s => s.id === id);
    
    if (!summary) {
        showNotification('找不到指定的工作总结', 'error');
        return;
    }
    
    // 设置模态框标题
    modalTitle.textContent = `查看工作总结: ${summary.title}`;
    
    // 设置内容
    const periodText = getPeriodTypeText(summary.periodType);
    const dateRange = `${formatDateForDisplay(summary.startDate)} 至 ${formatDateForDisplay(summary.endDate)}`;
    const formattedContent = summary.content.replace(/\n/g, '<br>');
    
    contentElement.innerHTML = `
        <div class="view-content">
            <div class="view-group">
                <label>标题：</label>
                <div>${escapeHtml(summary.title)}</div>
            </div>
            <div class="view-group">
                <label>类型：</label>
                <div><span class="tag">${periodText}</span></div>
            </div>
            <div class="view-group">
                <label>时间范围：</label>
                <div>${dateRange}</div>
            </div>
            <div class="view-group">
                <label>创建时间：</label>
                <div>${formatDateForDisplay(summary.createdAt)}</div>
            </div>
            <div class="view-group">
                <label>内容：</label>
                <div class="summary-content">${formattedContent}</div>
            </div>
        </div>
    `;
    
    // 显示模态框
    modal.style.display = 'block';
    
    // 设置当前总结ID
    currentSummaryId = id;
}

// 处理表单提交
function handleSummaryFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const titleInput = document.getElementById('summary-title');
    const periodTypeInput = document.getElementById('summary-period-type');
    const startDateInput = document.getElementById('summary-start-date');
    const endDateInput = document.getElementById('summary-end-date');
    const contentInput = document.getElementById('summary-content');
    
    if (!titleInput || !periodTypeInput || !startDateInput || !endDateInput || !contentInput) {
        showNotification('表单数据不完整', 'error');
        return;
    }
    
    const title = titleInput.value.trim();
    const periodType = periodTypeInput.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const content = contentInput.value.trim();
    
    // 验证必填字段
    if (!title || !startDate || !endDate || !content) {
        showNotification('请填写所有必填字段', 'error');
        return;
    }
    
    // 验证日期范围
    if (new Date(startDate) > new Date(endDate)) {
        showNotification('开始日期不能晚于结束日期', 'error');
        return;
    }
    
    // 创建总结对象
    const summaryData = {
        title,
        periodType,
        startDate,
        endDate,
        content
    };
    
    let success = false;
    
    // 添加或更新总结
    if (currentSummaryId) {
        // 更新现有总结
        success = Storage.updateSummary(currentSummaryId, summaryData);
        if (success) {
            showNotification('工作总结已更新', 'success');
        }
    } else {
        // 添加新总结
        success = Storage.addSummary(summaryData);
        if (success) {
            showNotification('工作总结已创建', 'success');
        }
    }
    
    if (success) {
        // 关闭模态框
        closeAllModals();
        
        // 重新加载总结列表
        loadSummaryList();
    } else {
        showNotification('操作失败，请重试', 'error');
    }
}

// 处理编辑总结
function handleEditSummary() {
    if (!currentSummaryId) {
        showNotification('未选择工作总结', 'error');
        return;
    }
    
    // 获取总结数据
    const summaries = Storage.getSummaries();
    const summary = summaries.find(s => s.id === currentSummaryId);
    
    if (!summary) {
        showNotification('找不到指定的工作总结', 'error');
        return;
    }
    
    // 关闭查看模态框
    const viewModal = document.getElementById('view-summary-modal');
    if (viewModal) {
        viewModal.style.display = 'none';
    }
    
    // 打开编辑模态框
    const modal = document.getElementById('summary-modal');
    const modalTitle = document.getElementById('summary-modal-title');
    const titleInput = document.getElementById('summary-title');
    const periodTypeInput = document.getElementById('summary-period-type');
    const startDateInput = document.getElementById('summary-start-date');
    const endDateInput = document.getElementById('summary-end-date');
    const contentInput = document.getElementById('summary-content');
    
    if (!modal || !modalTitle || !titleInput || !periodTypeInput || !startDateInput || !endDateInput || !contentInput) return;
    
    // 设置模态框标题
    modalTitle.textContent = '编辑工作总结';
    
    // 填充表单数据
    titleInput.value = summary.title || '';
    periodTypeInput.value = summary.periodType || 'weekly';
    startDateInput.value = formatDate(summary.startDate);
    endDateInput.value = formatDate(summary.endDate);
    contentInput.value = summary.content || '';
    
    // 显示模态框
    modal.style.display = 'block';
}

// 处理删除总结
function handleDeleteSummary() {
    if (!currentSummaryId) {
        showNotification('未选择工作总结', 'error');
        return;
    }
    
    // 确认删除
    if (!confirm('确定要删除这个工作总结吗？此操作不可撤销。')) {
        return;
    }
    
    // 删除总结
    const success = Storage.deleteSummary(currentSummaryId);
    
    if (success) {
        showNotification('工作总结已删除', 'success');
        
        // 关闭模态框
        closeAllModals();
        
        // 重新加载总结列表
        loadSummaryList();
    } else {
        showNotification('删除失败，请重试', 'error');
    }
}

// 处理导出总结
function handleExportSummary() {
    if (!currentSummaryId) {
        showNotification('未选择工作总结', 'error');
        return;
    }
    
    // 获取总结数据
    const summaries = Storage.getSummaries();
    const summary = summaries.find(s => s.id === currentSummaryId);
    
    if (!summary) {
        showNotification('找不到指定的工作总结', 'error');
        return;
    }
    
    // 生成导出内容
    const periodText = getPeriodTypeText(summary.periodType);
    const dateRange = `${formatDateForDisplay(summary.startDate)} 至 ${formatDateForDisplay(summary.endDate)}`;
    
    let exportContent = `# ${summary.title}\n\n`;
    exportContent += `类型：${periodText}\n`;
    exportContent += `时间范围：${dateRange}\n`;
    exportContent += `创建时间：${formatDateForDisplay(summary.createdAt)}\n\n`;
    exportContent += `${summary.content}`;
    
    // 导出文件名
    const fileName = `${summary.title}_${formatDate(summary.startDate)}_${formatDate(summary.endDate)}.md`;
    
    // 导出为文件
    exportToFile(exportContent, fileName, 'text/markdown');
    
    showNotification('工作总结已导出', 'success');
}

// 处理从时间线生成总结
function handleGenerateFromTimeline() {
    // 获取日期范围
    const startDateInput = document.getElementById('summary-start-date');
    const endDateInput = document.getElementById('summary-end-date');
    
    if (!startDateInput || !endDateInput) {
        showNotification('无法获取日期范围', 'error');
        return;
    }
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (!startDate || !endDate) {
        showNotification('请先选择日期范围', 'error');
        return;
    }
    
    // 获取时间线数据
    const timelineData = Storage.getTimeline();
    
    // 生成总结内容
    const summaryContent = generateSummaryFromTimeline(timelineData, startDate, endDate);
    
    // 填充到内容框
    const contentInput = document.getElementById('summary-content');
    if (contentInput) {
        contentInput.value = summaryContent;
    }
    
    showNotification('已从时间线生成总结内容', 'success');
}

// 关闭所有模态框
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}