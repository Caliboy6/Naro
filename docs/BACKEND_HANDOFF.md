# NARO 整站后端交接

本仓库交付当前公开网站的完整可运行前端、图片、字体和动效代码。运行内容位于 `public/`，对应首页、Vault 总览和三个 Vault 详情页。它保留旧版钱包与 operator 调用，并加入本轮确认的品牌、视觉、导航、ETHvp 和 BTCvc 调整。

**代码边界：** `public/assets/current-app.js` 是原站 React 应用的已编译快照，相关依赖拆分在同目录的 JavaScript chunks 中；本次没有取得原始 TSX、原工程的依赖锁文件或 source map。`public/enhancements/` 中新增的 JavaScript、CSS，以及 Vault 总览 HTML，均是可直接修改的代码。仓库的静态构建命令负责复制这些完整文件，不会把编译快照反编译成 React 源工程。

## 运行与路由

需要 Node.js 22 或以上。按仓库根目录 README 运行 `npm run dev`，默认端口 4173，也可 `npm run dev -- --port 4175`；`npm run build` 将 `public/` 复制成 `dist/`，`npm start` 服务构建结果。`npm run check` 检查路由入口、静态引用和新增模块语法。后端可将静态内容整套部署，也可把新增模块迁入已有 React 工程。资源使用 `/assets/...`、`/enhancements/...` 等根路径，部署在域名根目录。

| 路由 | 入口 | 功能 |
| --- | --- | --- |
| `/` | `public/index.html` | 首页、AI core、BTCvp 操作路径、控制栈、决策记录演示 |
| `/vaults`、`/vaults/` | `public/vaults/index.html`；另保留 `public/vaults.html` | 三个 Vault 总览，ETHvp 排第一 |
| `/ethvp`、`/ethvp/` | `public/ethvp/index.html` | ETH AI Vault，TARGET APY 50%，正式上线展示 |
| `/btcvp`、`/btcvp/` | `public/btcvp/index.html` | BTCvp、原钱包交易与活动记录 |
| `/btcvc`、`/btcvc/` | `public/btcvc/index.html` | BTCvc 新产品文案、交易审阅、9 条 FAQ |

确保静态服务器支持上述无尾斜线和有尾斜线路径，且浏览器直接刷新详情页仍能找到入口。首页顶部和首屏的 **Explore Vaults** 都到 `/vaults`；页尾 **Explore the first ETH vault** 到 `/ethvp`。现有 HTML 保留 `noindex,nofollow`，搜索收录策略应由发布方按需要调整。

## 文件职责与迁入顺序

| 文件或目录 | 职责 | 修改注意 |
| --- | --- | --- |
| `public/assets/current-app.js`、`current-app.css`、同目录 chunks | 原 React 页面、钱包状态、链上读取、operator 通信、交易追踪 | 当前可直接运行；优先在原 React 源工程中承接后续业务修改，避免长期维护压缩代码 |
| `public/enhancements/design.js` | 路由后的品牌替换、导航、首页内容调整、各动效挂载、ETHvp AI 标识 | 依赖现有 DOM class/结构；迁入组件后应删除相应重复 DOM 适配逻辑 |
| `public/enhancements/launch-ui.js` | ETHvp LIVE/TARGET APY 展示、样本曲线注释、第 10 条 FAQ 文字答案 | 改的是展示文字，未生成 AML 批准、收益或余额 |
| `public/enhancements/btcvc-product.js` | BTCvc 收益标题、策略/控制文案、余额区域、Mint/Redeem 审阅弹窗 | 仅对 BTCvc 路由生效；真实提交仍调用原应用交易函数 |
| `public/enhancements/btcvc-product-faq.js` | BTCvc 9 条 FAQ 与展开动画 | 隐藏原列表并保留 React 节点；返回清理函数 |
| `public/enhancements/workflow.js`、`core-scene.js`、`trace-ledger.js` | AI 视觉和交互动效 | 没有交易权限；见 [资源与动效说明](ASSETS_AND_MOTION.md) |
| `public/vaults/index.html`、`vaults.html`、`enhancements/vault-directory.*` | 独立总览页 | 两份 HTML 保持一致；不连接钱包、不请求收益数据 |
| `integration/ReactIntegration.tsx` | 供原 React 工程参考的 Workflow、ControlGate、CoreScene、TraceLedger wrappers | 是动效集成示例，不是原站完整 React 源工程；本静态包不编译它 |

如迁入已有 React 工程：先保留布局和 CSS，再将 `mountCoreScene`、`mountWorkflow`、`mountControlGate`、`mountTraceLedger` 放到对应组件的 `useEffect` 中；`useEffect` 返回模块提供的 cleanup。随后将 `design.js` 和 `launch-ui.js` 的文字、导航与品牌适配改成 JSX，最后把 BTCvc 的确认与真实账户字段接到正式业务状态。不要同时运行两套相同挂载逻辑。

## 现有 operator 与钱包接口

下列信息来自交付代码内的实际调用，**不是新增接口定义，也不代表本次验证了服务端或合约的运营状态**。当前 operator base URL 为 `https://vault.vishwalab.com/v1/api`。`{vault}` 当前业务调用包括 `btcvp`、`btcvc`、`ethvp`。

| 请求 | 当前请求内容 | 前端读取内容 |
| --- | --- | --- |
| `GET /{vault}/deposit-info` | 无 body | BTC 使用 `custody_address`；ETHvp 校验 `custody_address`、`contract`，以及响应若提供的链 ID 字段 |
| `POST /{vault}/deposit` | `{ "txid": "交易哈希" }` | HTTP 成功后继续查询状态 |
| `GET /{vault}/status/{txid}` | 交易哈希 | `status`、`mint_tx_hash`；ETHvp 也读取 `registered` |
| `GET /{vault}/history/{evmAddress}` | 地址转小写 | `{ history: [...] }`；每条按 `type: deposit/redeem` 解析 |
| `POST /{vault}/redeem` | BTC：`tx_hash, from_evm, btc_address, amount_units, chain_id`；ETHvp：`tx_hash, from_evm, eth_address, amount_units` | HTTP 成功后查询赎回状态 |
| `GET /{vault}/redeem/{txHash}` | EVM 交易哈希 | `status`；ETHvp 还支持 `burn_tx_hash`、`eth_payout_tx_hash`、`registered` |
| `POST /waitlist` | 旧应用提供的报名对象 | 本轮未新增或启用该流程 |

BTC history 读取 `amount_sats`、`amount_units`、`created_at`、`txid`、`mint_tx_hash`、`burn_tx_hash`/`evm_tx_hash`、`btc_from`、`btc_address`、`status`。ETHvp history 读取 `txid`/`evm_tx_hash`、`eth_from`/`from_evm`、`amount_wei`/`amount_units`、`created_at`、`registered` 和相关 mint/burn/payout 哈希。金额最小单位以整数十进制字符串传输，勿以浮点数传递大额最小单位。

BTC 存入流程保留 Unisat：读取 UTXO、构建含 `vp:{EVM address}` OP_RETURN 的 PSBT、钱包签名与广播、operator 注册、Bitcoin 确认和 mint 状态追踪。原实现要求 6 个 Bitcoin 确认；最小存入为 0.0001 BTC；广播后 Bitcoin 确认约每 30 秒查询，operator 约每 15 秒查询。不要以普通交易替代带路由标签的存入流程。

BTC 赎回保留原 EVM `transfer(tokenAddress, amountUnits)` 调用、operator 注册和状态追踪。BTCvc 新审阅弹窗不会替代服务端对锁定、资格、额度和费用的检查。BTCvc 轮询在 `settled/failed` 才停止，不把仅完成 burn 当作已收到 BTC。

ETHvp 保留 EVM 钱包、源链/目标链读取、operator 配置匹配、真实交易与追踪逻辑；Retry 跟踪入口不应再次发送资金。源链为 Ethereum 1，目标链为 Pharos Pacific 1672，源链确认配置为 12。存入使用 ETH，赎回通过目标链代币交易和 operator 处理。服务端须处理幂等注册、重试、链上失败及钱包切换。

## 当前编译配置

这些地址和网络是旧版快照的现值，便于定位。它们是公开配置，不是私钥。部署前应与后台正式配置核对；仓库中新增 `.env` 不会自动修改已编译的 `current-app.js`。

| 项目 | 当前值 |
| --- | --- |
| Bitcoin | mainnet；`https://mempool.space/api` |
| BTC 托管地址 fallback | `34GV23hMbpDmjKqWcx6skFrcCdWjA3NWPH`，有 operator 返回地址时优先使用其 `custody_address` |
| Pharos Pacific | chain ID `1672`；RPC `https://rpc.pharos.xyz`；原配置 gas symbol `PROS` |
| Pharos Atlantic | chain ID `688689`；RPC `https://atlantic.dplabs-internal.com`；原配置 gas symbol `PHRS` |
| BTCvc token | 两个 Pharos 配置均为 `0x4b01436d82dff601281f7ebdf44e73a47d77ee3d`；8 decimals |
| BTCvp Pacific token | `0x79D154287DDC77e5C10127E68c2df1a942a330BB`；8 decimals |
| BTCvp Atlantic token | `0x6EE353DCdCDB400c5217f65174B545EAf8d3986d`；8 decimals |
| ETHvp token | `0xde0ed48021050a4979068a1708f6bbfb3939f385`；运行时读取 token decimals |
| ETHvp custody | `0x3072c855b1121d6c299116f5bcca6ab383e97cb4` |
| Ethereum RPC | `https://ethereum-rpc.publicnode.com` |

首页显示 **PHAROS · SUI** 是展示覆盖范围；本包没有新增 Sui 钱包、RPC、合约或交易适配。

## BTCvc 交易确认桥接

原 React 表单在状态变化时写入 `window.naroBTCvcContexts.mint` 或 `.redeem`，并派发 `naro:btcvc-wallet` 自定义事件。事件 `detail` 与对应 context 相同。

| 字段 | 类型/含义 |
| --- | --- |
| `mode` | `mint` 或 `redeem` |
| `amount` | 用户输入的十进制字符串 |
| `bitcoinAddress` | 存入来源/赎回接收 Bitcoin 地址 |
| `receivingAddress` | BTCvc EVM 接收/持有钱包地址 |
| `bitcoinConnected`, `evmConnected` | 当前连接状态 |
| `network`, `networkLabel`, `chainId` | `pacific/atlantic`、名称、当前所选目标链 |
| `balanceSats` | Mint context：真实 Bitcoin 钱包余额，单位 sats，未取得时为空 |
| `totalBalance` | Redeem context：真实链上 BTCvc balance 格式化字符串，未取得时为 `null` |

原表单提交前分别 `await window.naroBTCvcReviewMint(context)`、`await window.naroBTCvcReviewRedemption(context)`。Promise 返回 `true` 才继续原交易；关闭、Escape、返回、离开路由、钱包/网络/金额改变时返回 `false`。窗口提交时再次对比最新 context。这个桥接负责用户审阅，不是服务端授权机制；服务端还须校验资格和可赎回额度。

确认弹窗沿用约 1:1、8 位显示精度。Bitcoin 网络费单独由钱包确认，旧选择 `halfHourFee → fastestFee → 10 sats/vB fallback`；Mint Max 的 2000 sats 余额预留不是最终报价。BTCvc Mint/Redeem 的产品手续费没有独立数值来源，不能把未列出解释为零费用；Pharos gas 按原网络符号说明。不要将 ETHvp 的无存赎费/30% carry 复制到 BTCvc。

## 后端要补齐的数据与约束

| 区域 | 当前状态 | 正式接入要求 |
| --- | --- | --- |
| BTCvc 余额 | Total 使用实际链上余额；Locked principal、Eligible to redeem、Pending redemption 显示 `—` | 返回真实锁定批次、可赎回额度、待处理请求、下一解锁时间，并据此禁用/验证赎回；不要用总余额替代可赎回余额 |
| BTCvc 锁定 | 文案为每次 mint 完成起 3 个日历月，各笔独立 | 服务端保留 mint 完成时间、原解锁权利和支持转移的权利记录，按日历月计算而非固定 90 天 |
| BTCvc 分配 | 9 条 FAQ 说明 UTC 月内时间加权合格余额、月后结算、单独 BTCvc 转账 | 提供结算周期、实际可分配净收益、历史应计权利、支付状态；奖励非 rebasing，未分配奖励不自动复利 |
| BTCvc 赎回 | 已接受的合格申请预计 3–5 个工作日 | 提供 accepted、处理和 payout 事实；已承诺赎回金额停止新增权重，先前权利保留；现有通用 activity 状态映射尚无 `accepted` 标签，扩展服务端状态时同步前端映射 |
| Veta/Naro 控制状态 | BTCvc 显示 `Status unavailable` | 接实际控制健康度/策略状态，失败和未知不得显示为通过；`VETA VERIFIED` 仅描述约束验证，不是收益/本金保证 |
| BTC/BTCvc 收益曲线 | 继续使用旧版内嵌累计收益序列，始于 2026-01-01；BTCvc 标为 `REFERENCE SERIES / Cumulative Net Return` | 接入实际净值/收益时明确单位、基期和奖励是否计入；本次没有新增实时历史数据 API |
| ETHvp 收益 | `TARGET APY 50%`，保留样本 APY 曲线和非保证说明 | 用实际 ETH 计价收益/净值替换样本；目标 APY 与实时年化收益保持不同字段 |
| ETHvp AML | UI 已移除旧集成提示；运行代码没有 AML 授权流程 | `deposit-info` 若 `aml_required` 存在且不是明确 `false`，现有代码会拒绝发款；应接正式审批结果并保留拒绝状态，不能仅改文案或伪造批准 |
| ETHvp 最小投资 | 产品展示 10 ETH；旧运行配置 `minDepositWei` 为 0.001 ETH | 在正式产品与原源工程中同步前后端限额；本轮静态交接没有调整这一旧运行配置 |

BTCvc FAQ 已按确认稿替换为 9 条：1:1 基础、奖励计算、月度分配、起算/确认、锁定、转移、奖励无新增锁定、赎回、收益和风险。FAQ 的说明不是后台账本实现；如后台还没有相应字段，应保留未知状态，不能用示例账户或模拟金额替代。

## 文档、费用与主体口径

沿用原文档入口 `https://docs.vishwalab.com/`、支持邮箱 `tech@vishwanetwork.xyz` 和页尾 `© 2026 Naro · VishwaLab`。原站未提供独立的 BTCvc 费率明细、法律发行主体或单独 Terms/Risk/Fees 页面，交付没有虚构它们。产品披露由运营方提供正式版本后接入。

## 接入验收

先核对五条路由直达、刷新与移动布局，保留字体和全部动态 chunks。再验证未连接、连接、换钱包、换链、取消确认、签名拒绝、广播成功、注册重试和最终结算。BTCvc 只有后端返回 mint/settled 事实后才能显示成功；ETHvp 配置/AML 不满足条件时不得发款。查询和重试不能自动重复交易。最后验证真实余额、解锁、费用、reward 权利和 activity 状态一致。本交接不包含后端服务、合约、托管签名系统或运营后台。
