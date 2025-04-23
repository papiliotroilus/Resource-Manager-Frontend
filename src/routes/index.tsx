import {createFileRoute, Navigate} from '@tanstack/react-router'
import {keycloak} from "../main.tsx";
import useAuthStore from '../hooks/authStore.tsx'

export const Route = createFileRoute('/')({
    beforeLoad: async() => {await keycloak.updateToken()},
    component: Index,
})

function Index() {
    const {id} = useAuthStore()
    return <Navigate to="/user/$userID" params={{ userID: id }} />
}