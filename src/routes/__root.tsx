import { createRootRoute } from '@tanstack/react-router'
import {NavShell} from "../components/NavShell.tsx";

export const Route = createRootRoute({
    component: () => (
        <>
            <NavShell/>
        </>
    ),
})