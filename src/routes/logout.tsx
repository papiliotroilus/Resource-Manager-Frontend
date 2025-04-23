import { createFileRoute } from '@tanstack/react-router'
import { keycloak } from '../main.tsx'

export const Route = createFileRoute('/logout')({
    beforeLoad: async() => {await keycloak.updateToken()},
    component: Logout,
})

async function Logout() {
    const rootURL = import.meta.env.VITE_ROOT_URL || window.process.env.VITE_ROOT_URL
    await keycloak.logout({redirectUri: rootURL})
}