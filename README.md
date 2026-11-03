# 背景磁带 / Background Tapes

**0.8.1 · Dots 固定效果 · 开发分支 `feat/cassette-deck`**

一个安静可靠的背景磁带底座，这一版只装一盘 **Dots**：蓝紫到粉紫的密集点阵，指尖附近的大范围透镜放大，以及柔和的光晕。效果已经调好，不再提供参数面板；试听、使用和背景总开关都留在同一个 deck 中。

> **0.8.1 的用户取舍：仅保留 Dots。** 旧的 Space Membrane、Quiet Contours、Ocean Surface 从目录、界面与运行时移除，不再显示或运行。旧参数只为兼容留存，不参与当前效果；需要旧实现时请查看 Git 历史。此次工作保留在 `feat/cassette-deck`，不改 `main` 或正式 Release。

## 使用

打开 DSH **设置 → Dots 点阵背景**：

1. 唯一的 Dots 卡片与上方舞台用于试听，指针划过可体验透镜放大。
2. 点击 **使用 Dots**，保存这盘磁带及固定效果；没有额外调参步骤。
3. 用右上角总开关独立开启或关闭正式背景。

试听舞台完整显示效果，不受正式聊天背景的低透明度影响。试听不会保存设置，也不会偷偷开启背景；使用操作保留当时的总开关状态。正式背景使用固定预设的透明度，聊天文字不参与扭曲，输入卡片保持完整主题底色。

Dots 是独立原创的 Canvas2D 实现与 SVG 磁带封面，**不声称是截图或第三方组件的逐像素复刻**，未引入第三方效果源码或依赖。没有浏览器控制时，不能把源码实现或 slot 注册当成视觉还原已经完成。

## 获取与安装

```sh
git clone --branch feat/cassette-deck https://github.com/rUrU516/dsh-ocean-surface.git
cd dsh-ocean-surface
```

在 DSH 中让助手通过插件管理器安装克隆目录的绝对路径。根目录就是完整 bundle；发布给用户前需包含对应的 Client 构建产物。**本地安装链接这个目录，安装后请保留它。**

包名仍是 `@local/dsh-cursor-ripples`，配置 namespace 仍是 `cursor-ripples`，用于兼容已有安装。旧海面字段与旧磁带参数可以留存，但不再是可选效果或可调功能。没有发布 npm 磁带包，也没有开放自定义代码导入。

## 一个效果一个源码模块，不是一个安装包

磁带源码约定是**每盘一个本地模块**：本版唯一的 [Dots 模块](<./tapes/dots.js>) 将 descriptor、normalizer 和 runtime factory 放在一起。名称、固定默认值、参数兼容归一化与绘制实现属于该效果；不让效果依赖 DSH 上下文。

- [catalog](<./cassette-catalog.js>) 只负责静态登记本地磁带、查找与兼容配置。
- [runtime 适配器](<./effect-runtime.js>) 将普通输入和 Canvas2D context 交给所登记的 factory，不维护逐磁带效果分支。
- [surface 底座](<./effect-surface.js>) 独立负责浏览器调度：尺寸、RAF、指针、主题、可见性、失焦、减少动态效果和资源释放。
- [deck 界面](<./deck-panel.js>) 只负责固定效果的试听、明确使用、背景开关及双语状态，不展示调参控件。
- [保存模型](<./appearance-model.js>) 与 [Host 入口](<./index.js>) 负责同源 Settings、保存确认与错误回退。
- [Client 入口](<./client-entry.js>) 负责设置入口与 DSH 背景布局适配。
- [构建脚本](<./build.js>) 将本地源码合并为唯一的浏览器产物 [client.js](<./client.js>)。

**最终仍是一个 bundle、一个 Client 产物，不是运行时扫描目录，也不是每磁带一个独立安装包，更不是动态加载任意 JavaScript。** 拆模块是源码组织方式，不扩大运行时代码信任边界。

## 安静可靠的底座

- 每个 surface 只有一个真实 canvas；设置打开时运行单个试听舞台，正式背景与其独立。
- 抽屉封面是静态原创 SVG，不另起 canvas 或 GPU 场景。
- 交互恢复平静后停止连续绘制；隐藏或失焦时暂停，减少动态效果时保持静态。
- 渲染失败退回原生界面，装饰不阻断应用交互。
- 使用操作通过现有 Settings 路径保存固定预设，不用旧快照整表覆盖，也不改变总开关。
- 拒绝保存、异常与只读状态明确可见，不将乐观界面当成持久化成功。

### 分层与兼容性

设置页使用公开的 `settings.section` 扩展点。**背景仍是用户授权的、面向 DSH `0.2.1-rc.5` 的版本特定适配，不是官方稳定背景接口。** DSH 升级可能需要更新这一层。

唯一的 DOM 布局适配位于 [Client 入口](<./client-entry.js>)：背景放在 frame 底层，输入卡不透明。不改变 Chat 几何尺寸、不修改 DSH 本体、不启动替代服务器。

### Agent 入口

`background_tapes` 提供 `list/get/insert/enable`：目录只返回 Dots，插入使用固定效果，不向 Agent 暴露调参或重置。旧工具 `ocean_appearance` 已移除；旧海面数据仅在 Config 中惰性兼容留存，不对外提供历史调参入口。工具和 UI 使用相同的 Host Settings，不使用浏览器 localStorage。

## 开发与验证

```sh
node build.js
node --test *.test.js tapes/*.test.js
node --check client.js
```

完整接口与边界见 [Cassette API v1](<./docs/cassette-api.md>)。本轮 **49 项测试通过**（含 Dots 的16项纯数学与交互测试），并已确认实时 Client 的固定 Dots 入口激活；详细范围与限制见 [验证记录](<./docs/verification.md>)。

本版不支持用户导入磁带、远程脚本、eval 或任意 JS 执行。没有浏览器控制，不声称已验证当前 GUI 的实际排版、浅深色、透镜观感或柔光还原；最终真实安装与验收以验证记录中明确标注的本轮结果为准。

## 更新与回退

此版继续使用 `feat/cassette-deck`，不覆盖 `main` 或正式 Release。旧实现可从 Git 历史检出到另一个目录，再通过 DSH 插件管理器安装对应版本；不要把历史海面参数的兼容留存误认为旧效果仍在此版运行。
