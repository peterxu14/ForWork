/**
 * 主应用逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化应用
    initApp();
});

// 初始化应用
function initApp() {
    // 加载最近活动
    loadRecentActivities();
}

// 加载最近活动
function loadRecentActivities() {
    const activityListElement = document.getElementById('recent-activities');
    if (!activityListElement) return;
    
    const activityList = activityListElement.querySelector('.activity-list');
    
    // 获取时间线数据
    const timeline = Storage.getTimeline();
    
    // 获取工作总结数据
    const summaries = Storage.getSummaries();
    
    // 获取文件索引数据
    const files = Storage.getFiles();
    
    // 合并所有活动并按日期排序
    const allActivities = [
        ...timeline.map(item => ({
            type: 'timeline',
            title: item.title,
            date: item.date,
            id: item.id
        })),
        ...summaries.map(item => ({
            type: 'summary',
            title: item.title,
            date: item.createdAt,
            id: item.id
        })),
        ...files.map(item => ({
            type: 'file',
            title: item.name,
            date: item.date || item.createdAt,
            id: item.id
        }))
    ];
    
    // 按日期排序（最新的在前）
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 只显示最近10条
    const recentActivities = allActivities.slice(0, 10);
    
    // 清空列表
    activityList.innerHTML = '';
    
    if (recentActivities.length === 0) {
        activityList.innerHTML = '<p class="empty-message">暂无最近活动</p>';
        return;
    }
    
    // 添加活动项
    recentActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'list-item';
        
        let typeText = '';
        let linkHref = '';
        
        switch (activity.type) {
            case 'timeline':
                typeText = '工作记录';
                linkHref = `timeline.html?id=${activity.id}`;
                break;
            case 'summary':
                typeText = '工作总结';
                linkHref = `summary.html?id=${activity.id}`;
                break;
            case 'file':
                typeText = '文件索引';
                linkHref = `file-index.html?id=${activity.id}`;
                break;
        }
        
        activityItem.innerHTML = `
            <div class="list-item-header">
                <span class="list-item-title">${escapeHtml(activity.title)}</span>
                <span class="list-item-date">${formatDateForDisplay(activity.date)}</span>
            </div>
            <div class="list-item-content">
                <span class="tag">${typeText}</span>
                <a href="${linkHref}" class="btn">查看</a>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}