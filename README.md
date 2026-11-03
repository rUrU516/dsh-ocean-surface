# 背景磁带 / Background Tapes

**0.8.3 · 3D 磁带抽屉 · Dots + 海面水波 · 开发分支 `feat/cassette-deck`**

一个安静可靠的背景磁带底座，两盘固定效果：

- **Dots**：鼠标附近显出的紫色点阵、透镜放大与柔光，外围不铺满小点。
- **海面水波 / Ocean Surface**：原版海面着色器、轻微环境起伏与指针扰动产生的水波，不是重新画的同心圆替代品。

每盘效果已固定，不提供参数面板。设置页是一台带开放式立体抽屉的播放器：磁带可先试听，再拖入插槽、播放插入动画并保存。仍保留在开发分支，不改 `main` 或正式 Release。

## 使用

打开 DSH **设置 → 背景磁带**：

1. 点击抽屉中的磁带，在上方屏幕试听。
2. 将磁带拖到播放器插槽，松手后播放插入动画并应用；也可使用插入按钮，不必拖拽。
3. 拖到插槽外或按 Esc 取消，不会切换正式背景。

右上角总开关独立控制正式背景；试听和插入都不会偷偷开启背景。保存过程中会锁定重复操作；拒绝保存会显示失败，而非假装播放成功。减少动态效果模式会跳过位移动画。输入卡片继续保持实色，两侧留白露出背景，聊天几何尺寸不变。

Dots 静止后停止连续绘制；水波纹有持续环境起伏。两者均在隐藏或失焦时暂停，遵守减少动态效果偏好。抽屉封面是原创静态 SVG，不额外启动 canvas。

## 本地源码与接口

| 内容 | 文件 |
| --- | --- |
| Dots 完整磁带 | [tapes/dots.js](<./tapes/dots.js>) |
| 海面水波完整磁带 | [tapes/ocean.js](<./tapes/ocean.js>) |
| 显式注册表 | [cassette-registry.js](<./cassette-registry.js>) |
| 固定预设、目录、兼容配置 | [cassette-catalog.js](<./cassette-catalog.js>) |
| Canvas2D / WebGL 资源与生命周期底座 | [effect-runtime.js](<./effect-runtime.js>) |
| 指针、尺寸、主题、RAF、暂停与清理 | [effect-surface.js](<./effect-surface.js>) |
| 立体抽屉、拖拽插入、试听、总开关 | [deck-panel.js](<./deck-panel.js>) |
| 无 DOM 的拖拽几何与插入位移 | [deck-transport.js](<./deck-transport.js>) |
| Settings 同源保存 | [appearance-model.js](<./appearance-model.js>)、[index.js](<./index.js>) |
| DSH 布局与设置入口 | [client-entry.js](<./client-entry.js>) |

**每盘一个本地源码模块**，包含 descriptor、固定默认值、normalizer 和 factory。底座向 factory 提供 `context/params/dark/reducedMotion`，磁带返回 `resize/update/pointer/frame/dispose`。详见 [完整 Cassette API v1](<./docs/cassette-api.md>)，包括时间单位、指针坐标、调度和资源职责。

源码由 [构建脚本](<./build.js>) 静态合并成一个 [浏览器产物](<./client.js>)。不是自动扫描磁带目录，不是每磁带独立安装包，也不支持自定义代码导入、远程脚本或 eval。根目录旧海面文件是历史存档；新水波磁带的模拟与 shader 均封装在自己的模块，不依赖这些存档。

## Agent API

`background_tapes` 提供 `list/get/insert/enable`：列出两盘、读取当前状态、插入固定预设、独立启停。插入 id 为 `dot-field` 或 `ocean-surface`。没有调参或重置 API。UI 与工具共用 Host Settings；旧 `ocean_appearance` 不恢复。

## 安装与开发

```sh
git clone --branch feat/cassette-deck https://github.com/rUrU516/dsh-ocean-surface.git
cd dsh-ocean-surface
node build.js
node --test *.test.js tapes/*.test.js
node --check client.js
```

根目录就是 bundle，在 DSH 中通过插件管理器安装这个目录的绝对路径。**安装链接本地目录，安装后请保留它。** 包名 `@local/dsh-cursor-ripples`，配置 namespace `cursor-ripples`，兼容已有安装。原海面顶层参数仍惰性留存，但当前效果使用各盘固定预设。

## 兼容与核验边界

设置页使用公开的 `settings.section`。背景放置仍是用户授权、面向 DSH `0.2.1-rc.5` 的版本特定布局适配，**不是官方稳定背景 API**。不修改 DSH 核心、不启动替代服务器、不改变聊天几何尺寸。

使用操作保存选中磁带的嵌套路径，避免整表覆盖和总开关回退；只读、拒绝保存和失败状态明确显示。渲染失败让原生界面继续可用。

测试、安装与实时 Client 注册检查结果见 [验证记录](<./docs/verification.md>)。当前没有浏览器控制，不将单元测试或 slot 激活当成 GPU 渲染、浅深色排版或截图还原验收。两盘为原创实现，未引入第三方效果源码，不声称截图逐像素复刻。
