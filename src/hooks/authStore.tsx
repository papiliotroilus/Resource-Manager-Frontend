import { create } from 'zustand'
interface AuthState {
    id: string | undefined,
    username: string | undefined,
    role: string | undefined,
}

const useAuthStore = create<AuthState>()(() => ({
    id: undefined,
    username: undefined,
    role: undefined,
}))

export default useAuthStore