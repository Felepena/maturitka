"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User } from "firebase/auth"
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
} from "firebase/auth"
import { useRouter } from "next/navigation"
import { auth } from "../lib/config"

type AuthContextType = {
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, username?: string) => Promise<void>
    signOut: () => Promise<void>
    updateUsername: (username: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


// AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])



    // Sign in function
    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password)
        router.push("/")
    }

    // Sign up function
    const signUp = async (email: string, password: string, username?: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (username && auth.currentUser) {
            try {
                await updateProfile(auth.currentUser, { displayName: username })
            } catch (e) {
                // no-op: profile update failure shouldn't block signup redirect
            }
        }
        router.push("/login")
    }

    // Sign out function
    const signOut = async () => {
        await firebaseSignOut(auth)
        router.push("/")
    }

    // Update displayName helper
    const updateUsername = async (username: string) => {
        if (!auth.currentUser) throw new Error("Not authenticated")
        await updateProfile(auth.currentUser, { displayName: username })
        // Force re-render by cloning the user object
        setUser({ ...(auth.currentUser as any) })
    }

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUsername }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within an AuthProvider")
    return context
}
