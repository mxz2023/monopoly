/**
 * 始终使用相对路径 /api/*。
 * 开发时由 Vite 代理到后端，与页面同域，不会触发 CORS 预检（OPTIONS），避免跨域请求一直 Pending。
 * 生产环境由 Nginx 等同域反代 /api。
 */
export function apiUrl(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}
