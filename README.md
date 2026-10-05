# NARO Vault — 完整网站交付

当前公开版：[naro-vault-showcase.davidtheevanoob.chatgpt.site](https://naro-vault-showcase.davidtheevanoob.chatgpt.site/)。本仓库交付与公开版本 10 一致的五个页面、全部本地资源，以及本轮新增的可编辑布局和动效模块。

## 运行和构建

需要 Node.js 22 或以上。运行工具没有 npm 第三方依赖。

```sh
npm run dev
# http://127.0.0.1:4173

npm run check
npm run build
npm start
```

Windows 也可双击 `Start-preview.cmd`。自定义端口：`npm run dev -- --port 4175`。

## 页面与源码

| 路由 | 页面入口 |
| --- | --- |
| `/` | `public/index.html` |
| `/vaults` | `public/vaults.html`，以及直接访问目录用的 `public/vaults/index.html` |
| `/btcvp` | `public/btcvp/index.html` |
| `/btcvc` | `public/btcvc/index.html` |
| `/ethvp` | `public/ethvp/index.html` |

- `public/enhancements/`：本轮编写的布局、文案适配、WebGL 核心、BTCvp 流程、Veta 控制演示、执行记录、BTCvc 确认与 FAQ。HTML/CSS/JS 均可直接编辑。
- `public/assets/`：NARO / VETA / Ciara 等图片、图标、Inter 字体及现有应用运行所需的全部 JavaScript chunks。
- `integration/ReactIntegration.tsx`：迁移到 React 源项目时可参考的动效组件适配器，组件卸载时释放资源。
- `docs/BACKEND_HANDOFF.md`：钱包、接口、状态、数据、费用、文案与接入位置。
- `docs/ASSETS_AND_MOTION.md`：图片、品牌、字体、动效和生命周期说明。
- `docs/PUBLIC_VERSION.json`：公开 v10 文件清单及 SHA-256；运行 `node scripts/check.mjs --verify-export` 可核验交付与公开版一致。

## 源码边界

原始 `vault.vishwalab.com` 的基础 React 应用只有编译快照：`public/assets/current-app.js`、`current-app.css` 及其 chunks；本轮未获得原始 TSX、构建配置和依赖锁文件。本仓库没有将这些文件伪称为原始 React 开发源码，也没有反编译生成不可靠的 TSX。

交付保留完整可运行的网站和全部已编写模块。后端若要在原 React 工程中维护基础页面，应取得原项目源码，并按交接说明将本轮模块和页面修改迁入；也可直接部署当前静态前端并对接现有服务。

## 部署与后端接入

`npm run build` 输出 `dist/`，可交给支持静态文件的托管平台。部署目录为 `dist`，保持根路径资源 URL；各路由目录均含 `index.html`，直接刷新不会丢页面。

GitHub 仓库用于源码交付；默认 GitHub Pages 的 `/Naro/` 子路径需要另行适配资源路径。当前包适用于域名根目录部署。

本地服务器只提供静态文件，不代理或实现业务接口。钱包、合约和 API 保留公开版现有调用；后端接入前请按交接说明核对链、地址、跨域和实际返回字段。BTCvc 的确认弹窗不替代后端资格与余额判断。

收益曲线沿用已确认的旧版数据；ETHvp 的 `TARGET APY 50%` 是目标收益展示。BTCvc 分栏中缺少服务端来源的账户字段显示 `—`，不会用本地示例余额填充。正式文档、支持邮箱和页脚署名沿用已确认版本。

图片和字体已随仓库提供；Inter 使用 SIL Open Font License，许可证位于 `public/assets/fonts/Inter-LICENSE.txt`。原应用第三方运行 chunks 保留其文件内的许可标记；本仓库不对未获许可的第三方材料重新授权。
