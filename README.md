# ForWork_Ki v1.0 - 工作汇报系统（初版不进行维护）

一个基于 Electron 的本地工作汇报管理工具，帮助您高效记录、整理和管理日常工作内容。

## 📋 项目概述

ForWork_Ki 是一个专为个人或团队设计的工作汇报系统，提供直观的界面来记录工作进展、创建总结报告，并管理相关文件索引。所有数据存储在本地，确保隐私和安全。

## ✨ 主要功能

### 🏠 首页仪表板
- 系统概览和快速导航
- 最近活动展示
- 各功能模块快速访问入口

### ⏰ 时间线管理
- **日常记录**：按时间顺序记录工作内容
- **日期筛选**：快速查找特定时间段的工作记录
- **条目管理**：添加、编辑、删除工作条目
- **可视化展示**：清晰的时间线界面展示工作进展

### 📊 工作总结
- **多类型总结**：支持日报、周报、月报等不同类型
- **模板化创建**：提供标准化的总结模板
- **分类管理**：按类型和时间组织总结文档
- **导出功能**：支持总结内容的导出和分享

### 📁 文件索引
- **文件管理**：添加和管理工作相关文件
- **项目文件夹读取**：自动扫描和索引项目文件
- **文件搜索**：快速定位和访问文件
- **文件打开**：直接在系统中打开文件

## 🛠️ 技术栈

- **前端框架**：HTML5 + CSS3 + JavaScript
- **桌面应用**：Electron
- **数据存储**：本地文件系统
- **UI设计**：响应式设计，支持现代浏览器

## 📦 安装和运行

### 环境要求
- Node.js (推荐 v14 或更高版本)
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/peterxu14/ForWork.git
cd ForWork_Ki_v1

npm install
# 或者使用 yarn
yarn install

npm start
# 或者使用 yarn
yarn start

ForWork_Ki_v1/
├── css/                    # 样式文件
│   ├── main.css           # 主样式
│   ├── components.css     # 组件样式
│   └── timeline.css       # 时间线专用样式
├── js/                     # JavaScript 文件
│   ├── app.js             # 主应用逻辑
│   ├── timeline.js        # 时间线功能
│   ├── summary.js         # 总结功能
│   ├── file-index.js      # 文件索引功能
│   ├── storage.js         # 数据存储管理
│   └── utils.js           # 工具函数
├── index.html             # 主页面
├── timeline.html          # 时间线页面
├── summary.html           # 工作总结页面
├── file-index.html        # 文件索引页面
├── main.js                # Electron 主进程
├── preload.js             # 预加载脚本
├── package.json           # 项目配置
└── README.md              # 项目说明


- 工作记录数据
- 总结文档
- 文件索引信息
- 用户配置

- 
