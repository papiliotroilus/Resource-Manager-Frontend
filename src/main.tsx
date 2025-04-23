import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import { MantineProvider } from '@mantine/core'
import { StrictMode } from 'react'
import {createRoot} from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import Keycloak from 'keycloak-js'
import useAuthStore from "./hooks/authStore.tsx";
import request from 'superagent'

const router = createRouter({ routeTree })

export const keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL || window.process.env.VITE_KEYCLOAK_URL,
    realm: import.meta.env.VITE_KEYCLOAK_REALM || window.process.env.VITE_KEYCLOAK_REALM,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT || window.process.env.VITE_KEYCLOAK_CLIENT
})

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
    const root = createRoot(rootElement)
    const authenticated = await keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false
    })
    if (!authenticated) {
        await keycloak.login()
    }
    const profile = await keycloak.loadUserProfile()
    const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
    const self = await request
        .get(`${backendURL}v1/whoami`)
        .ok(() => true)
        .set({
            Authorization: `Bearer ${keycloak.token}`
        })
    const userID = self.body.userID
    useAuthStore.setState({id: userID})
    const username = profile.username
    useAuthStore.setState({username : username})
    if (keycloak.hasRealmRole('admin')) {
        useAuthStore.setState({role : 'admin'})
    } else {
        useAuthStore.setState({role : 'user'})
    }
    root.render(
        <StrictMode>
            <MantineProvider defaultColorScheme="auto">
                <RouterProvider router={router} />
            </MantineProvider>
        </StrictMode>
    )
}