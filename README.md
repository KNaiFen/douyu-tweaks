# 去掉斗鱼的刀塔助手

看斗鱼直播时，不再因鼠标移到英雄、技能或装备上而弹出刀塔助手，同时去掉“刀塔助手”入口和提示窗。

适用于电脑浏览器中的斗鱼网页版，需要安装 Tampermonkey（油猴）。

## 安装

1. 在桌面浏览器中安装并启用 [Tampermonkey](https://www.tampermonkey.net/)。
2. 点击 [安装脚本](https://raw.githubusercontent.com/KNaiFen/douyu-dota-assistant-blocker/main/douyu-dota-assistant-blocker.user.js)，在 Tampermonkey 页面确认安装。
3. **刷新已打开的斗鱼直播页面**。

若链接未弹出安装页面，可下载仓库中的 `douyu-dota-assistant-blocker.user.js`，通过 Tampermonkey 的导入功能安装。

## 使用

安装后自动生效，不需要额外设置。打开斗鱼直播间，正常观看即可。

主播战绩面板和第一视角入口不在本脚本的屏蔽范围内。

## 更新与停用

- **更新**：在 Tampermonkey 管理面板中检查脚本更新，更新后刷新直播页面。
- **暂时停用**：在 Tampermonkey 中关闭“去掉斗鱼的刀塔助手”，然后刷新页面。
- **卸载**：在 Tampermonkey 管理面板中删除此脚本，然后刷新页面。

## 常见问题

### 安装后仍然弹出刀塔助手

确认 Tampermonkey 和本脚本都已启用，并允许 Tampermonkey 在斗鱼网站运行，然后刷新直播页面。如果仍未生效，先检查脚本是否有更新。

### 点击安装链接后只看到代码

可以从 [版本下载页](https://github.com/KNaiFen/douyu-dota-assistant-blocker/releases/latest) 下载 `.user.js` 文件，再通过 Tampermonkey 的导入功能安装。

### 更新后失效，或者影响了正常观看

先停用脚本并刷新页面。可以到 [问题反馈](https://github.com/KNaiFen/douyu-dota-assistant-blocker/issues) 提供浏览器名称、脚本版本和出现问题的操作步骤。截图前请遮住个人信息，不要上传 Cookie、账号凭据或完整网页存档。

## 许可证

[MIT](LICENSE)
