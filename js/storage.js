/**
 * 本地存储管理
 */

const Storage = {
    // 存储键名
    keys: {
        TIMELINE: 'forwork_timeline',
        SUMMARIES: 'forwork_summaries',
        FILES: 'forwork_files',
        SETTINGS: 'forwork_settings'
    },
    
    // 初始化存储
    init() {
        // 检查并初始化各存储项
        if (!this.get(this.keys.TIMELINE)) {
            this.set(this.keys.TIMELINE, []);
        }
        
        if (!this.get(this.keys.SUMMARIES)) {
            this.set(this.keys.SUMMARIES, []);
        }
        
        if (!this.get(this.keys.FILES)) {
            this.set(this.keys.FILES, []);
        }
        
        if (!this.get(this.keys.SETTINGS)) {
            this.set(this.keys.SETTINGS, {
                theme: 'light',
                dateFormat: 'YYYY-MM-DD',
                lastBackup: null
            });
        }
        
        console.log('存储初始化完成');
    },
    
    // 获取存储项
    get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('获取存储项失败:', error);
            return null;
        }
    },
    
    // 设置存储项
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('设置存储项失败:', error);
            return false;
        }
    },
    
    // 删除存储项
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除存储项失败:', error);
            return false;
        }
    },
    
    // 清空所有存储
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空存储失败:', error);
            return false;
        }
    },
    
    // 获取时间线数据
    getTimeline() {
        return this.get(this.keys.TIMELINE) || [];
    },
    
    // 添加时间线条目
    addTimelineEntry(entry) {
        const timeline = this.getTimeline();
        entry.id = generateId();
        entry.createdAt = new Date().toISOString();
        timeline.push(entry);
        return this.set(this.keys.TIMELINE, timeline);
    },
    
    // 更新时间线条目
    updateTimelineEntry(id, updatedEntry) {
        const timeline = this.getTimeline();
        const index = timeline.findIndex(entry => entry.id === id);
        
        if (index !== -1) {
            updatedEntry.updatedAt = new Date().toISOString();
            timeline[index] = { ...timeline[index], ...updatedEntry };
            return this.set(this.keys.TIMELINE, timeline);
        }
        
        return false;
    },
    
    // 删除时间线条目
    deleteTimelineEntry(id) {
        const timeline = this.getTimeline();
        const filteredTimeline = timeline.filter(entry => entry.id !== id);
        
        if (filteredTimeline.length !== timeline.length) {
            return this.set(this.keys.TIMELINE, filteredTimeline);
        }
        
        return false;
    },
    
    // 获取工作总结数据
    getSummaries() {
        return this.get(this.keys.SUMMARIES) || [];
    },
    
    // 添加工作总结
    addSummary(summary) {
        const summaries = this.getSummaries();
        summary.id = generateId();
        summary.createdAt = new Date().toISOString();
        summaries.push(summary);
        return this.set(this.keys.SUMMARIES, summaries);
    },
    
    // 更新工作总结
    updateSummary(id, updatedSummary) {
        const summaries = this.getSummaries();
        const index = summaries.findIndex(summary => summary.id === id);
        
        if (index !== -1) {
            updatedSummary.updatedAt = new Date().toISOString();
            summaries[index] = { ...summaries[index], ...updatedSummary };
            return this.set(this.keys.SUMMARIES, summaries);
        }
        
        return false;
    },
    
    // 删除工作总结
    deleteSummary(id) {
        const summaries = this.getSummaries();
        const filteredSummaries = summaries.filter(summary => summary.id !== id);
        
        if (filteredSummaries.length !== summaries.length) {
            return this.set(this.keys.SUMMARIES, filteredSummaries);
        }
        
        return false;
    },
    
    // 获取文件索引数据
    getFiles() {
        return this.get(this.keys.FILES) || [];
    },
    
    // 添加文件索引
    addFile(file) {
        const files = this.getFiles();
        file.id = generateId();
        file.createdAt = new Date().toISOString();
        files.push(file);
        return this.set(this.keys.FILES, files);
    },
    
    // 更新文件索引
    updateFile(id, updatedFile) {
        const files = this.getFiles();
        const index = files.findIndex(file => file.id === id);
        
        if (index !== -1) {
            updatedFile.updatedAt = new Date().toISOString();
            files[index] = { ...files[index], ...updatedFile };
            return this.set(this.keys.FILES, files);
        }
        
        return false;
    },
    
    // 删除文件索引
    deleteFile(id) {
        const files = this.getFiles();
        const filteredFiles = files.filter(file => file.id !== id);
        
        if (filteredFiles.length !== files.length) {
            return this.set(this.keys.FILES, filteredFiles);
        }
        
        return false;
    },
    
    // 搜索文件索引
    searchFiles(query, tags = []) {
        const files = this.getFiles();
        if (!query && (!tags || tags.length === 0)) {
            return files;
        }
        
        return files.filter(file => {
            // 搜索文本匹配
            const textMatch = !query || 
                file.name.toLowerCase().includes(query.toLowerCase()) ||
                file.path.toLowerCase().includes(query.toLowerCase()) ||
                (file.description && file.description.toLowerCase().includes(query.toLowerCase()));
            
            // 标签匹配
            const tagMatch = !tags || tags.length === 0 || 
                (file.tags && file.tags.some(tag => tags.includes(tag)));
            
            return textMatch && tagMatch;
        });
    },
    
    // 获取所有标签
    getAllTags() {
        const files = this.getFiles();
        const tagsSet = new Set();
        
        files.forEach(file => {
            if (file.tags && Array.isArray(file.tags)) {
                file.tags.forEach(tag => tagsSet.add(tag));
            }
        });
        
        return Array.from(tagsSet);
    },
    
    // 导出所有数据
    exportAllData() {
        return {
            timeline: this.getTimeline(),
            summaries: this.getSummaries(),
            files: this.getFiles(),
            settings: this.get(this.keys.SETTINGS),
            exportDate: new Date().toISOString()
        };
    },
    
    // 导入所有数据
    importAllData(data) {
        try {
            if (data.timeline) this.set(this.keys.TIMELINE, data.timeline);
            if (data.summaries) this.set(this.keys.SUMMARIES, data.summaries);
            if (data.files) this.set(this.keys.FILES, data.files);
            if (data.settings) this.set(this.keys.SETTINGS, data.settings);
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }
};

// 初始化存储
document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
});