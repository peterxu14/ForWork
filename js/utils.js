/**
 * 工具函数库
 */

// 格式化日期为 YYYY-MM-DD 格式
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 格式化日期为友好显示格式
function formatDateForDisplay(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}年${month}月${day}日`;
}

// 获取当前日期的 YYYY-MM-DD 格式
function getCurrentDate() {
    return formatDate(new Date());
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 截断文本
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// 转义HTML特殊字符
function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// 解析URL参数
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        if (!pairs[i]) continue;
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params;
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动关闭
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 打开本地文件
function openLocalFile(filePath) {
    // 尝试使用 File System Access API (如果浏览器支持)
    if (window.showOpenFilePicker) {
        // 现代浏览器可能不允许直接打开本地文件路径
        // 这里提供一个替代方案，让用户手动选择文件
        showNotification('由于浏览器安全限制，无法直接打开文件。请手动打开文件。', 'warning');
        return;
    }
    
    // 回退方案：尝试使用 window.open
    try {
        const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
        window.open(fileUrl, '_blank');
    } catch (error) {
        console.error('无法打开文件:', error);
        showNotification('无法打开文件，请手动打开。', 'error');
    }
}

// 导出文本为文件
function exportToFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], {type: contentType || 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

// 从时间线数据生成总结
function generateSummaryFromTimeline(timelineData, startDate, endDate) {
    // 过滤日期范围内的数据
    const filteredData = timelineData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
    });
    
    // 按日期排序
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 生成总结文本
    let summary = `工作时间：${formatDateForDisplay(startDate)} 至 ${formatDateForDisplay(endDate)}\n\n`;
    summary += '工作内容：\n';
    
    filteredData.forEach((item, index) => {
        summary += `${index + 1}. ${formatDateForDisplay(item.date)}：${item.title}\n`;
        summary += `   ${item.content}\n\n`;
    });
    
    if (filteredData.length === 0) {
        summary += '该时间段内暂无工作记录。\n';
    }
    
    return summary;
}