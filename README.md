# 大富翁 Monopoly Online

Vue 3 + Vite + Pinia 前端，Node.js + `ws` 服务端。地图与卡牌数据位于 **`shared/map.json`**、**`shared/cards.json`**，前后端共用，请勿在服务端再复制一份。

## 本地开发

需要两个终端：

1. **WebSocket 游戏服**（默认 `8080`）：

   ```bash
   npm run server
   ```

2. **前端**（默认 `3000`，并将 `/ws` 代理到上面的端口）：

   ```bash
   npm run dev
   ```

浏览器打开 `http://localhost:3000`。若修改了服务端端口，在项目根目录复制 `.env.example` 为 `.env`，设置 `VITE_DEV_WS_PORT` 与 `process.env.PORT` 一致。

## 环境变量

| 变量 | 说明 |
|------|------|
| `PORT` | 服务端监听端口（默认 `8080`），仅 `node server/index.js` 使用 |
| `VITE_DEV_WS_PORT` | 开发时 Vite 代理 `/ws` 的目标端口（默认 `8080`） |
| `VITE_WS_URL` | 可选。生产环境覆盖 WebSocket 完整地址；不设则使用与页面同源的 `ws(s)://当前域名/ws` |

## 生产部署

- 静态资源与 WebSocket **需同域**或由反向代理将 `wss://站点/ws` 转到 Node，否则需设置 `VITE_WS_URL`。
- 示例：Nginx `location /ws { proxy_pass http://127.0.0.1:8080; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }`

## 脚本

- `npm run build` — 类型检查并构建前端
- `npm run preview` — 预览构建结果
- `node scripts/validate-shared.mjs` — 校验 `shared/*.json` 结构

## 说明

- 断线后当前连接会从房间移除，**不会自动回到原座位**；刷新或关闭页面前请知悉。
- 公网部署时请自行评估鉴权与限流（当前为局域网对战向实现）。
