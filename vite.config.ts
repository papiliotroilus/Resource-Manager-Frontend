import { defineConfig } from 'vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import topLevelAwait from "vite-plugin-top-level-await"

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        TanStackRouterVite({ autoCodeSplitting: true }),
        viteReact(),
        mkcert(),
        topLevelAwait({
            promiseExportName: "__tla",
            promiseImportName: i => `__tla_${i}`
        })
    ]
})
