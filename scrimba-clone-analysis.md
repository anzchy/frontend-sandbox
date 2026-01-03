# Scrimba 技术架构分析与复刻方案

## 1. 项目概述

Scrimba 是一个交互式编程学习平台，其核心功能是提供实时代码编辑和预览。本文档分析其技术架构，并提供复刻方案。

## 2. 技术架构分析

### 2.1 前端技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| **Monaco Editor** | 代码编辑器 | VS Code 的核心编辑器组件，支持语法高亮、智能提示 |
| **Service Worker** | 资源拦截 | 拦截文件请求，返回虚拟文件系统内容 |
| **iframe 沙箱** | 代码隔离执行 | 安全隔离用户代码运行环境 |
| **postMessage API** | 跨 iframe 通信 | 编辑器与预览窗口间的数据传输 |
| **Imba** (推测) | UI 框架 | 从类名前缀 `αα` 推测使用 Imba 框架 |

### 2.2 核心组件结构

```
┌─────────────────────────────────────────────────────────────────┐
│                         主页面 (scrimba.com)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │ 文件    │  │   Monaco Editor     │  │   预览窗口          │  │
│  │ 列表    │  │   (代码编辑器)       │  │   ($runner iframe)  │  │
│  │         │  │                     │  │                     │  │
│  │ - html  │  │  虚拟文件系统        │  │  cw1.scrimba.com   │  │
│  │ - css   │  │  file:///sp0/xxx    │  │  /__sw__.html      │  │
│  │ - js    │  │                     │  │                     │  │
│  └─────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Service Worker (__sw__worker.js)                │ │
│  │              拦截请求 → 返回虚拟文件内容                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 iframe 架构

Scrimba 使用 4 个 iframe 实现功能隔离：

| iframe | 类名 | URL | 用途 |
|--------|------|-----|------|
| 空白框架 | `$iframe` | `/__sw__blank.html` | 初始化占位 |
| 内容框架 | `$frame` | 动态设置 | 渲染内容 |
| 代码运行器 | `$runner` | `cw1.scrimba.com/__sw__.html` | 执行用户代码 |
| 视频播放器 | `$player` | `scrimba.com/__sw__.html` | 播放教学视频 |

### 2.4 API 端点结构

```
/op/pub/{scrim_id}/data     - 获取 Scrim 数据
/op/pub/app01/data          - 应用配置数据
/op/pub/{user_id}/data      - 用户数据
/op/stream/{scrim_id}/stream - 视频流数据 (SSE)
/assets/app.{hash}.js       - 主应用 JS
/assets/chunks/chunk.{hash}.js - 代码分割 chunks
```

### 2.5 实时预览机制

```
┌──────────────────────────────────────────────────────────────┐
│                      实时预览流程                              │
└──────────────────────────────────────────────────────────────┘

1. 用户在 Monaco Editor 中编辑代码
                    │
                    ▼
2. Monaco 触发 onDidChangeModelContent 事件
                    │
                    ▼
3. 更新虚拟文件系统 (file:///sp0/xxx)
                    │
                    ▼
4. 通过 postMessage 通知 Service Worker
                    │
                    ▼
5. Service Worker 更新缓存的文件内容
                    │
                    ▼
6. 刷新预览 iframe (或 iframe 请求文件时返回新内容)
                    │
                    ▼
7. 预览窗口显示更新后的结果
```

## 3. 复刻实现方案

### 3.1 技术选型

| 组件 | 推荐技术 | 替代方案 |
|------|----------|----------|
| 代码编辑器 | Monaco Editor | CodeMirror 6 |
| 前端框架 | React / Vue 3 | Svelte |
| 构建工具 | Vite | webpack |
| 预览沙箱 | iframe + Service Worker | iframe + Blob URL |
| 状态管理 | Zustand / Pinia | Redux |

### 3.2 核心功能实现

#### 3.2.1 Monaco Editor 集成

```typescript
// editor.ts
import * as monaco from 'monaco-editor';

interface VirtualFile {
  path: string;
  content: string;
  language: string;
}

class CodeEditor {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private files: Map<string, monaco.editor.ITextModel> = new Map();

  constructor(container: HTMLElement) {
    this.editor = monaco.editor.create(container, {
      theme: 'vs-dark',
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      minimap: { enabled: false },
      automaticLayout: true,
    });
  }

  // 创建虚拟文件
  createFile(file: VirtualFile): void {
    const uri = monaco.Uri.parse(`file:///${file.path}`);
    const model = monaco.editor.createModel(file.content, file.language, uri);
    this.files.set(file.path, model);
  }

  // 切换文件
  openFile(path: string): void {
    const model = this.files.get(path);
    if (model) {
      this.editor.setModel(model);
    }
  }

  // 监听内容变化
  onContentChange(callback: (path: string, content: string) => void): void {
    this.editor.onDidChangeModelContent(() => {
      const model = this.editor.getModel();
      if (model) {
        const path = model.uri.path.slice(1); // 移除开头的 /
        callback(path, model.getValue());
      }
    });
  }
}
```

#### 3.2.2 Service Worker 实现

```typescript
// sw.ts - Service Worker
const VIRTUAL_FS: Map<string, string> = new Map();

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

// 拦截请求
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // 检查是否是虚拟文件请求
  if (url.pathname.startsWith('/virtual/')) {
    const filePath = url.pathname.replace('/virtual/', '');
    const content = VIRTUAL_FS.get(filePath);

    if (content !== undefined) {
      const mimeType = getMimeType(filePath);
      event.respondWith(
        new Response(content, {
          headers: { 'Content-Type': mimeType }
        })
      );
      return;
    }
  }

  // 其他请求正常处理
  event.respondWith(fetch(event.request));
});

// 接收来自主页面的消息
self.addEventListener('message', (event: MessageEvent) => {
  const { type, path, content } = event.data;

  if (type === 'UPDATE_FILE') {
    VIRTUAL_FS.set(path, content);
    // 通知所有客户端文件已更新
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'FILE_UPDATED', path });
      });
    });
  }
});

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'svg': 'image/svg+xml',
  };
  return mimeTypes[ext || ''] || 'text/plain';
}
```

#### 3.2.3 预览组件实现

```typescript
// Preview.tsx
import React, { useRef, useEffect, useCallback } from 'react';

interface PreviewProps {
  files: Map<string, string>;
  entryFile: string;
}

export function Preview({ files, entryFile }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 生成预览 HTML
  const generatePreviewHTML = useCallback(() => {
    const html = files.get(entryFile) || '';
    const css = files.get('styles.css') || '';
    const js = files.get('index.js') || '';

    // 注入 CSS 和 JS 到 HTML
    return html
      .replace('</head>', `<style>${css}</style></head>`)
      .replace('</body>', `<script>${js}</script></body>`);
  }, [files, entryFile]);

  // 更新预览
  const updatePreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const html = generatePreviewHTML();

    // 方法1: 使用 srcdoc (简单但有限制)
    iframe.srcdoc = html;

    // 方法2: 使用 Blob URL (更灵活)
    // const blob = new Blob([html], { type: 'text/html' });
    // iframe.src = URL.createObjectURL(blob);
  }, [generatePreviewHTML]);

  useEffect(() => {
    updatePreview();
  }, [files, updatePreview]);

  return (
    <div className="preview-container">
      <div className="preview-header">
        <span className="preview-url">/{entryFile}</span>
        <button onClick={updatePreview}>刷新</button>
      </div>
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
        className="preview-frame"
      />
    </div>
  );
}
```

#### 3.2.4 文件管理器组件

```typescript
// FileExplorer.tsx
import React from 'react';

interface FileExplorerProps {
  files: string[];
  currentFile: string;
  onFileSelect: (path: string) => void;
  onFileCreate: (path: string) => void;
  onFileDelete: (path: string) => void;
}

export function FileExplorer({
  files,
  currentFile,
  onFileSelect,
  onFileCreate,
  onFileDelete
}: FileExplorerProps) {
  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop();
    const icons: Record<string, string> = {
      'html': '📄',
      'css': '🎨',
      'js': '⚡',
      'json': '📋',
      'jpg': '🖼️',
      'png': '🖼️',
    };
    return icons[ext || ''] || '📄';
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <span>FILES</span>
        <button onClick={() => onFileCreate('newfile.txt')}>+</button>
      </div>
      <ul className="file-list">
        {files.map(file => (
          <li
            key={file}
            className={file === currentFile ? 'active' : ''}
            onClick={() => onFileSelect(file)}
          >
            <span className="file-icon">{getFileIcon(file)}</span>
            <span className="file-name">{file}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3.3 完整项目结构

```
frontend-sandbox/
├── public/
│   └── sw.js                 # Service Worker
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── Editor.tsx    # Monaco 编辑器封装
│   │   │   ├── EditorTabs.tsx
│   │   │   └── editor.css
│   │   ├── Preview/
│   │   │   ├── Preview.tsx   # 预览组件
│   │   │   └── preview.css
│   │   ├── FileExplorer/
│   │   │   ├── FileExplorer.tsx
│   │   │   └── file-explorer.css
│   │   └── Layout/
│   │       ├── SplitPane.tsx # 分割面板
│   │       └── layout.css
│   ├── hooks/
│   │   ├── useVirtualFS.ts   # 虚拟文件系统 hook
│   │   └── useServiceWorker.ts
│   ├── utils/
│   │   ├── fileUtils.ts
│   │   └── mimeTypes.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 3.4 依赖包

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "monaco-editor": "^0.45.0",
    "@monaco-editor/react": "^4.6.0",
    "zustand": "^4.4.0",
    "react-split-pane": "^0.1.92"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

## 4. 简化方案：使用 Blob URL

如果不需要 Service Worker 的复杂性，可以使用更简单的 Blob URL 方案：

```typescript
// SimplePreviewer.ts
class SimplePreviewer {
  private iframe: HTMLIFrameElement;
  private currentBlobUrl: string | null = null;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  update(html: string, css: string, js: string): void {
    // 清理旧的 Blob URL
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }

    // 组合完整的 HTML
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}<\/script>
</body>
</html>`;

    // 创建 Blob URL
    const blob = new Blob([fullHtml], { type: 'text/html' });
    this.currentBlobUrl = URL.createObjectURL(blob);

    // 更新 iframe
    this.iframe.src = this.currentBlobUrl;
  }

  destroy(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
  }
}
```

## 5. 实现步骤

### 第一阶段：基础框架 (MVP)
1. 搭建 Vite + React + TypeScript 项目
2. 集成 Monaco Editor
3. 实现简单的 Blob URL 预览
4. 实现文件切换功能

### 第二阶段：功能完善
1. 实现 Service Worker 虚拟文件系统
2. 添加文件创建/删除功能
3. 实现多文件项目支持
4. 添加控制台输出面板

### 第三阶段：高级功能
1. 添加项目保存/加载功能
2. 实现代码分享功能
3. 添加多种预设模板
4. 支持 npm 包导入

## 6. 关键技术要点

### 6.1 安全考虑
- 使用 `sandbox` 属性限制 iframe 权限
- 使用独立域名（如 cw1.scrimba.com）隔离代码执行
- 实现 CSP (Content Security Policy)

### 6.2 性能优化
- 使用防抖处理编辑器内容变化
- 懒加载 Monaco Editor
- 使用 Web Worker 处理代码转换

### 6.3 用户体验
- 保存编辑器状态到 localStorage
- 实现快捷键（Ctrl+S 保存，Ctrl+Enter 运行）
- 添加主题切换功能

## 7. 参考资源

- [Monaco Editor 文档](https://microsoft.github.io/monaco-editor/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Vite 官方文档](https://vitejs.dev/)
- [React 官方文档](https://react.dev/)

## 8. 总结

Scrimba 的核心技术架构基于：
1. **Monaco Editor** - 提供专业级代码编辑体验
2. **Service Worker** - 实现虚拟文件系统
3. **iframe 沙箱** - 安全隔离代码执行
4. **postMessage** - 跨组件通信

复刻此项目的关键在于理解这些技术如何协同工作，实现从代码编辑到实时预览的完整流程。
