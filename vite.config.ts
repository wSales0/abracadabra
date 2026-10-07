import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Middleware para executar os endpoints serverless da pasta /api durante o npm run dev
function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        try {
          const url = new URL(req.url, 'http://localhost:3000')
          const route = url.pathname.replace(/^\/api\//, '').split('/')[0].split('?')[0]
          const handlerPath = `./api/${route}.ts`

          const module = await server.ssrLoadModule(handlerPath)
          const handler = module.default

          const query: Record<string, string> = {}
          url.searchParams.forEach((val, key) => {
            query[key] = val
          })
          ;(req as any).query = query

          if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
            const chunks: any[] = []
            for await (const chunk of req) {
              chunks.push(chunk)
            }
            const bodyStr = Buffer.concat(chunks).toString()
            try {
              ;(req as any).body = JSON.parse(bodyStr)
            } catch {
              ;(req as any).body = bodyStr
            }
          }

          const resObj: any = res
          resObj.status = (code: number) => {
            res.statusCode = code
            return resObj
          }
          resObj.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
            return resObj
          }

          return await handler(req as any, resObj)
        } catch (err: any) {
          console.error('API dev server error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
})
