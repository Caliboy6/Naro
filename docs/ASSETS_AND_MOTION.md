# NARO 图片、字体与动效交接

所有页面资源在 `public/` 中，部署时按目录完整保留。新增动效主要通过 WebGL/Canvas、SVG、CSS 和浏览器 Web Animations API 实现；没有视频、Lottie、外置动效文件或必须下载的动画服务。

## 图片与字体

| 资源路径 | 来源与用途 | 保留要求 |
| --- | --- | --- |
| `public/assets/naro-supplied.png` | 用户提供的 NARO 标志原图；导航、Core 和工作流使用 | 图内原宣传句仍在源图片中，显示时由 `design.css` 的 symbol/word 窗口裁切，只呈现 Logo 和 NARO 字样；不要把整图直接当导航 Logo 展示 |
| `public/assets/veta-supplied.png` | 用户提供的 VETA 原图 | `brand-system.js` 通过 SVG viewBox 和亮度转透明滤镜保留原字形；完整 Logo 与 mark-only 复用同一图片 |
| `public/assets/ciara-mark.svg` | 本轮设计的 Ciara 几何标识 | 可编辑 SVG，工作流和控制栈使用；文件名沿用现有项目的 Ciara 命名 |
| `public/assets/workflow-reference.png` | 用户提供的原始六阶段流程参考图 | 随资源交付，当前新工作流由代码绘制，未把该参考图片作为最终流程内容；避免恢复旧六阶段叙事 |
| `public/assets/btcvp.svg`、`btcvc.svg` | 原站 Vault 标识 | 保留原 SVG，与余额/表单/详情页使用一致 |
| `public/ethvp-mark.svg` | ETHvp Vault 标识 | 当前页面及总览引用 |
| `public/icons.svg` | 原站 SVG symbol 集合 | 存在 `<use href="/icons.svg#...">` 引用，不能只按 `<img>` 搜索后删除 |
| `public/assets/favicon.svg` | 站点图标 | HTML 通过根路径引用 |
| `public/assets/fonts/InterVariable.woff2` | 本地 Inter variable font | 全站统一用 Inter，字重 100–900；数字使用 tabular-nums，不引入等宽字体 |
| `public/assets/fonts/Inter-LICENSE.txt` | Inter SIL Open Font License 1.1 | 分发字体时保留此许可及作者声明 |

NARO/VETA 图片按用户提供素材交付，没有重新绘制商标或声明新的商标授权。原 React 钱包 SDK 资源和第三方 chunks 的许可证应以原项目依赖许可为准；不能因为本仓库包含新增代码就把整个原编译应用宣称为统一 MIT 授权。

同目录大量 `*-<hash>.js` 包含钱包、网络、图标、语言及 SDK 动态导入。文件不一定在首屏加载；不能因首次 Network 面板未请求而删除。`current-app.js` 和这些 chunks 需要作为一套保留。

## 模块与生命周期

| 模块 | 实现与位置 | 导出/挂载方式 | 清理和状态 |
| --- | --- | --- | --- |
| `enhancements/core-scene.js` + `core-scene.css` | 首页环形纤维 AI core、ETHvp 背景 Core；自定义 GLSL shader、程序化 geometry；WebGL 失败回退 Canvas 2D | `mountCoreScene(container, options)`；支持 `variant: 'vault'`、`labels: false/'footer'`、`controls: false` | 返回 cleanup：取消 RAF、断开 Resize/Intersection observers、移除 pointer/visibility/media/context listeners、释放 GL buffers/shaders/programs、删除节点 |
| `enhancements/workflow.js` + `workflow.css` + `btcvp-flow.css` | 首页 BTCvp 操作路径；四阶段 Ciara → Naro → Veta → Execution；SVG 连线和卡片进度；ETHvp 的 AI→Veta→Execution gate | `mountWorkflow(container)`、`mountControlGate(container)` | 均返回 cleanup：清定时器、取消连线绘制 RAF、移除监听/observers、删除 root；clock 独立管理隐藏、离屏、手动暂停和查看原因 |
| `enhancements/trace-ledger.js` + `trace-ledger.css` | 首页 Radical Transparency 决策记录：提案→校验→结果；记录切换、暂停、重播 | `mountTraceLedger(host)` | 返回 cleanup：取消 RAF、断开 IntersectionObserver、移除 click/keyboard/visibility/media listeners、删除 root；播放在结果结束，不无限重播 |
| `enhancements/design.js` + `design.css` | 页面适配、品牌、首页/ETHvp 模块挂载、区块 reveal、滚动深度、桌面指针倾斜与追光 | HTML 直接载入 ES module；观察 React 的 main 更换 | main 更换时运行已登记 disposers；它自身的 root MutationObserver 是页面级常驻适配器，迁入 React 后应由组件生命周期管理 |
| `enhancements/cinematic.css` | 页面入场、扫描光、环境层、CTA 等视觉细化 | 与页面 CSS 一起加载 | 通过 class、可见性与 reduced-motion 规则控制；不请求业务数据 |
| `enhancements/vault-directory.js` + `vault-directory.css` | 独立 `/vaults`：ETH 卡片优先、入场、hover 扫描、指针倾斜和光位 | 总览 HTML 直接载入 module | 当前是独立文档，离开后由浏览器销毁；没有导出统一 cleanup。若改成 SPA 组件，应保存并移除 card/media listeners、清 timer/RAF |
| `enhancements/btcvc-product-faq.js` + `btcvc-product-faq.css` | BTCvc 9 条 FAQ 展开/收起，260ms 高度与透明度动画 | `installBTCvcFAQ(main)` | 返回 cleanup：取消所有 WAAPI animations、移除 listeners、新列表移除、恢复隐藏的原 React FAQ 状态；减少动效立即完成展开 |
| `enhancements/btcvc-product.js` + `btcvc-product.css` | BTCvc 确认弹窗、状态提示、余额和曲线标题适配 | HTML 直接载入 module；内部调用 FAQ 挂载 | 弹窗关闭/取消/路由离开/pagehide 都释放 pending Promise；root MutationObserver 与钱包事件监听当前是页面级，迁入组件后需要显式卸载 |
| `enhancements/brand-system.js` + `brand-system.css` | VETA 原图渲染、Ciara SVG、VETA VERIFIED 徽标 | `vetaLogo(options)`、`installPartnerBrands(scope)` | 纯标记生成/DOM 替换，不启定时器、不调用 API |
| `enhancements/launch-ui.js` | ETHvp 上线展示、目标 APY、FAQ 文案；BTC 执行说明 | `installLaunchUI(main)` | 返回 cleanup；ETHvp 分支断开自身 MutationObserver；BTC 分支无后台任务 |
| `enhancements/readability.css`、`typography.css` | 字号、排版、数值对齐、全站 Inter | CSS 载入 | `typography.css` 放在最后，统一覆盖旧 serif/mono/italic 标题字体 |

表格内路径均相对 `public/`。入口 HTML 的 CSS 次序与 module import 链已经配置好。改动次序可能改变品牌裁切、字号或旧样式覆盖结果。

## React 中复用

仓库 `integration/ReactIntegration.tsx` 已提供四个动效的 React wrappers；它供已有 React 工程复用，本静态部署不编译该 TSX。`public/enhancements/` 的对应类型声明随模块交付。使用模块提供的清理函数，避免切路由后重复实例和未结束的 RAF：

```jsx
import { mountCoreScene } from '/enhancements/core-scene.js';

useEffect(() => {
  if (!coreRef.current) return;
  return mountCoreScene(coreRef.current, {
    labels: 'footer',
    controls: false,
  });
}, []);
```

同样方式调用其他 `mount*`。如果在原工程由 bundler 编译，应将上述模块迁到工程 source 目录并使用本地模块 import；组件 host 留空，由 mount 函数管理内部节点。不要让 React 和动效模块同时维护同一组子节点。

## 性能与减少动效

- Core 在离屏、页面隐藏和 `prefers-reduced-motion: reduce` 时停止连续绘制。减少动效保留静态帧，resize 后重绘；桌面 DPR 上限 1.5，窄屏 compact 上限 1.25，窄屏使用较少纤维。WebGL context lost/restored 有停止和重建逻辑。
- 工作流在离屏、页签隐藏、查看节点或手动暂停时保留剩余时间；减少动效呈现静态结果，按钮不继续动画。SVG 连线 resize 绘制用 RAF 合并。
- Trace ledger 只有可见且可播放时推进；隐藏和离屏不累积经过时间。减少动效立即展示完整静态结果，同时保留记录选择和键盘导航。
- 页面 reveal 由 IntersectionObserver 触发；滚动样式更新用 RAF 合并。卡片倾斜只对 fine pointer 开启；总览不对触屏使用 pointer tilt。
- FAQ 使用 WAAPI；系统开启减少动效时直接完成展开/收起，取消已进行动画。原页面 `typography.css` 对标题取消斜体，不加载第二套装饰字体。

当前首页按用户要求隐藏 Core 的 **Pause motion**、**NARO CORE / INTENT COORDINATION ENGINE** 和 **VETA POLICY BOUNDARY** 文本，通过 `mountCoreScene(..., { labels: 'footer', controls: false })` 控制；不要删除模块内部的暂停/清理支持。工作流、验证示意与决策记录自身仍可查看和重播。

## 动效与业务数据的边界

Core 是程序化视觉，不是链上实时模型图。首页四阶段 workflow 的叙事按 BTCvp 的公开操作模型整理；它是流程播放，不负责发起交易。Trace ledger 的 +3.2%、2.8×/2.0×、14% 都是记录解释示例，不是正式策略参数或实时订单。

BTC Vault 的真实钱包、余额、交易和 activity 保留原应用链上/operator 流程。`launch-ui.js` 把旧固定示例文案换为运行说明；它没有从静态记录生成 live execution。BTCvc 控制未知时显示 `Status unavailable`，不把动画完成解释为真实 Veta 批准。

若将示意记录接入真实后端：添加正式数据适配层，保留真实时间、record ID、验证结果和交易哈希；用明确的空/加载/错误状态替换默认例子，并取消示例标签。不能只删除示例标识后继续显示固定数值。收益曲线与目标 APY 的数据口径见 [后端交接](BACKEND_HANDOFF.md)。

## 资源验收

五页直达/刷新后查看图片、字体及钱包动态 chunks 的 404。分别在桌面和移动端确认 Logo 只呈现所需部分、VETA 字形正确、全站为 Inter。切换系统减少动效、切页签、滚动出屏、反复进入离开页面，确认动画停止和恢复正确；检查 FAQ 的 Enter/Space、Trace 的方向键和弹窗 Escape。部署域名根路径下完成一次完整资源检查后，再调整缓存策略；修改过的无 hash `current-app.js`/enhancement 文件应随发布刷新缓存。
