# 大富翁 Monopoly Online

Vue 3 + Vite + Pinia 前端，Node.js + `ws` 服务端。地图与卡牌数据位于 **`shared/map.json`**、**`shared/cards.json`**，前后端共用，请勿在服务端再复制一份。

## 账户系统

- 首次使用请 **注册**（用户名 + 密码 + **游戏昵称**）。昵称会显示在房间内。
- **登录**后进入大厅；创建/加入房间时 WebSocket 会携带 JWT，服务端用账户 **userId** 作为玩家 id。
- **资金与产业**保存在服务端 `server/data/account.json`（已加入 `.gitignore`），对局中会定期写入；**破产**后账户资金与产业清零。
- **每一局新游戏开始**（房主点击「开始游戏」）时，所有玩家 **从起点（位置 0）出发**，并按账户数据 **载入资金与产业** 到当前棋盘。

生产环境请设置环境变量 **`JWT_SECRET`**，不要使用默认密钥。

## 本地开发

需要两个终端：

1. **HTTP + WebSocket 服务**（默认 `8080`，提供 `/api` 与 `/ws`）：

   ```bash
   npm run server
   ```

2. **前端**（默认 `3000`，将 `/api` 与 `/ws` 代理到上面的端口）：

   ```bash
   npm run dev
   ```

浏览器打开 `http://localhost:3000`，先 **注册/登录** 再游戏。若修改了服务端端口，在项目根目录复制 `.env.example` 为 `.env`，设置 `VITE_DEV_WS_PORT` 与 `process.env.PORT` 一致。

### 端口被占用（`EADDRINUSE :::8080`）

说明 **8080 上已有进程**（多半是之前开的 `npm run server` 没关）。

- **查进程**：`lsof -i :8080`
- **结束进程**：`kill <PID>`（或 `kill -9 <PID>`）
- **换端口**（二选一）：
  - `PORT=9000 npm run server`
  - `npm run server -- 9000`（注意 `--` 才能把参数传给脚本）

换端口后，前端 `.env` 里 **`VITE_DEV_WS_PORT`** 也要改成同一数字。

**说明**：`npm run server 8080` **不会**把 `8080` 传给 Node；正确写法是 **`npm run server -- 8080`** 或依赖默认 8080。

## 环境变量

| 变量 | 说明 |
|------|------|
| `PORT` | 服务端监听端口（默认 `8080`），仅 `node server/index.js` 使用 |
| `VITE_DEV_WS_PORT` | 开发时 Vite 代理 `/ws` 的目标端口（默认 `8080`） |
| `VITE_WS_URL` | 可选。生产环境覆盖 WebSocket 完整地址；不设则使用与页面同源的 `ws(s)://当前域名/ws` |

## 生产部署

- 静态资源与后端 **需同域**或由反向代理将 **`/api`** 与 **`/ws`** 转到同一 Node 进程，否则需分别为 API 与 WS 配置地址（WS 可用 `VITE_WS_URL`）。
- 示例：Nginx 为 `location /api/` 与 `location /ws` 分别 `proxy_pass` 到 `http://127.0.0.1:8080`；WebSocket 需 `Upgrade` 与 `Connection` 头。

## 脚本

- `npm run build` — 类型检查并构建前端
- `npm run preview` — 预览构建结果
- `node scripts/validate-shared.mjs` — 校验 `shared/*.json` 结构

## 说明

- 断线后当前连接会从房间移除，**不会自动回到原座位**；刷新或关闭页面前请知悉。
- 公网部署时请自行评估鉴权与限流（当前为局域网对战向实现）。
