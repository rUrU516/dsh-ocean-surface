# 背景磁带 / Background Tapes

**0.8.0 · 开发分支 `feat/cassette-deck`**

一个安静可靠的背景底座，以及装着不同氛围的磁带抽屉。不是把每个效果拼进页面，而是让所有磁带使用同一套生命周期、交互和设置接口。

> GitHub 的正式 Release 仍为海面版 **v0.7.0**。这份磁带框架位于新分支，未覆盖主分支或替换旧版发布资产。

## 四盘内置磁带

| 磁带 | 感觉 | 动态方式 |
|---|---|---|
| 01 引力点阵 / Dot Field | 紫蓝色轻点阵，鼠标附近像透镜一样弯曲 | 平时静止，交互后恢复并休眠 |
| 02 空间薄膜 / Space Membrane | 极淡的空间网格，指尖留下短暂涟漪 | 交互触发，余波消退后休眠 |
| 03 风的等高线 / Quiet Contours | 少量、低对比的细线 | 缓慢流动，可调到静止 |
| 04 深海来信 / Ocean Surface | 原来的WebGL海面和传播余波 | 连续，保留原有配色和阻尼 |

Dot Field 的视觉方向参考 [React Bits 的效果介绍](https://www.reactbits.dev/backgrounds/dot-field)。这里是独立原创的 Canvas2D 透镜点阵实现，**不是原组件的逐像素复刻或默认代码移植**；没有引入它的依赖或源码。其他新效果与磁带封面也为原创。

## 使用

打开 DSH **设置 → 背景磁带**（原来的海面外观入口）：

1. 在抽屉里选一盘磁带，舞台立即试听，**不会改动正在使用的背景**。
2. 打开一个小调音控件，边看效果边调整；没有整页常驻参数表。
3. 点击 **插入使用**，将选中的磁带与参数一起保存并应用。
4. 每盘磁带记住自己的参数，切回来仍是上次的模样。

总开关独立于磁带。恢复参数只影响当前试听，仍需插入才能保存。关闭设置不应用未提交的试听；试听不是一次隐式安装或切换。

已有0.7.x用户升级时仍保留海面为当前磁带，旧海面8项字段不移动、不覆盖；其他磁带的默认参数独立保存。输入卡片始终是完整主题底色，背景不会透进正在书写的内容，也不把聊天文字拿去做空间扭曲。

## 获取与安装

```sh
git clone --branch feat/cassette-deck https://github.com/rUrU516/dsh-ocean-surface.git
cd dsh-ocean-surface
```

在DSH中让助手通过插件管理器安装克隆目录的绝对路径。根目录就是完整bundle，包含构建产物，无需先安装构建依赖。**本地安装链接这个目录，安装后请保留它。**

包名仍是 `@local/dsh-cursor-ripples`，配置namespace仍是 `cursor-ripples`，以兼容已安装的海面配置。未发布npm，也没有开放自定义代码导入。

## 安静可靠的底座

- 一个运行时接口：创建、尺寸、参数、指针、逐帧、释放。磁带不接触DSH上下文、聊天DOM或全局事件。
- 一个浏览器适配层：集中管理RAF、可见性、失焦暂停、主题、减少动态效果、上下文丢失。
- 切换磁带释放旧资源、重建画布，避免WebGL和Canvas2D复用冲突。
- 同时只有正式背景和设置中的单个试听舞台运行；抽屉封面是静态SVG，不给每张卡分配GPU资源。
- 安静效果在余波结束后不继续绘制；隐藏/失焦停止，减少动态效果时静态。
- 背景画布长边最多1100px、预览600px，指针不阻断应用交互。
- 渲染失败回退原生界面，不让装饰层盖住工作组件。
- 选择与参数通过细粒度路径原子写入DSH Settings，不整表替换其他磁带；拒绝/异常可见并回退，不假报保存成功。

### 分层与兼容性

设置页使用公开的 `settings.section` 扩展点。**背景仍是用户授权的、面向 DSH `0.2.1-rc.5` 的版本特定适配，不是官方稳定背景接口。** DSH升级可能需要更新这一层。

唯一的DOM适配在 `client-entry.js`：Portal进入frame底层，列在上方；正文透底，输入卡不透明。没有更改Chat几何尺寸、没有修改DSH本体、没有启动替代服务器。

## 开发 / API

```sh
node build.js
node --test *.test.js
node --check client.js
```

- `cassette-catalog.js`：纯数据描述、默认值、控制范围、旧配置迁移。
- `effect-runtime.js`：四种效果通过统一runtime API实现。
- `effect-surface.js`：唯一浏览器调度/生命周期适配器。
- `deck-panel.js`：抽屉、封面、试听/插入、局部调音、双语界面。
- `appearance-model.js`：Host-backed保存与失败回滚。
- `index.js`：持久化Config和同源设置工具。
- `client-entry.js`：正式设置入口与DSH底层适配。
- `water-field.js` / `ocean-renderer.js`：原海面磁带的数值模拟与GPU绘制。
- `build.js` / `client.js`：零额外依赖的本地模块合并与产物，不直接改产物。

完整的 **[Cassette API v1](./docs/cassette-api.md)** 说明了生命周期与数据边界。当前为内置效果接口，**本版不支持用户导入磁带、远程脚本、eval或任意JS执行**，未来扩展不需要让效果依赖DSH内部结构。

### Agent入口

`background_tapes`：list/get/insert/update/reset/enable；list返回支持的磁带、默认值和范围。调整未插入的磁带不会擅自切换当前背景。兼容工具 `ocean_appearance` 只编辑原海面参数。两者与UI共用Host Settings，不使用浏览器localStorage。

### 更新与回退

分支起点保留0.7.1输入框修复快照 `81b722e`，主分支与正式v0.7.0 Release不变。需要回退时，在另一个目录检出快照，通过DSH插件管理器安装该目录；新磁带字段可忽略，原海面参数仍在原位置。

Host在可选的 `clientModules` 服务可用时发布已完成的Client构建；仍需用live Slots确认版本，安装applied不等于页面更新。linked目录迁移可能被当前DSH进程缓存，需处理旧路径或重启重新解析。

## 验证边界

有自动化数学、配置、保存与资源检查；安装后核验Host Config、工具和实时Client入口。**没有浏览器控制，不能将slot active当成设置排版、浅深色、GPU效果或图标的视觉验收**，实际体验仍请在当前GUI确认。

海面高度场原理参考 [WebGL Water](https://madebyevan.com/webgl-water/) 与 [jQuery Ripples](https://github.com/sirxemic/jquery.ripples)，未引入它们的代码、图片或依赖。早期海面实验见[原仓库备份](https://github.com/rUrU516/dsh-whaleling/commit/4dbf3ed)。
