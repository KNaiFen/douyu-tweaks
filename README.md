# 去掉斗鱼的刀塔助手

通过 Tampermonkey（油猴）阻止斗鱼刀塔助手启动，移除视频中英雄、技能和装备的悬停交互层，以及工具栏的“刀塔助手”入口和提示窗。

## 安装

1. 在桌面浏览器中安装并启用 [Tampermonkey](https://www.tampermonkey.net/)。
2. 点击 [安装脚本](https://raw.githubusercontent.com/KNaiFen/douyu-dota-assistant-blocker/main/douyu-dota-assistant-blocker.user.js)，在 Tampermonkey 页面确认安装。
3. **刷新已打开的斗鱼直播页面**，让脚本在播放器启动前生效。

若链接未弹出安装页面，可下载仓库中的 `douyu-dota-assistant-blocker.user.js`，通过 Tampermonkey 的导入功能安装。

支持 `https://www.douyu.com/*` 顶层页面，无需构建或配置。停用脚本后刷新页面，即可恢复网站原有行为。

## 工作方式

脚本在 `document-start` 阶段阻止播放器注册 `gameHotArea` 助手模块，使组件不挂载，其数据请求、消息监听和计时器不启动。同时跳过助手工具栏和提示窗组件的初始化。

脚本不使用轮询，不发起额外网络请求，不修改账号设置，也不生成日志或其他文件。

## 注意事项

- 安装、升级或停用后都需刷新直播页面。加载后才注入脚本时，样式兜底只能隐藏界面。
- 助手与其他播放器功能共享代码包，文件仍需下载和解析；屏蔽减少的是助手的运行开销。
- 不针对独立的主播战绩面板或第一视角入口。
- 斗鱼内部模块结构可能随网站更新而变化。若助手重新出现，可通过 [Issues](https://github.com/KNaiFen/douyu-dota-assistant-blocker/issues) 反馈。
