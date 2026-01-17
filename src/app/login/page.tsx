"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {AuthProvider, useAuth} from "../contex/contex"
import { ChefHat } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { signIn, user } = useAuth()
    const router = useRouter()



    useEffect(() => {
        if (!isLoading && user) {
            router.push("/")
        }
    }, [isLoading, user, router])


    const handleLogin = async (e: any) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            await signIn(email, password)

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to log in. Please try again."
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden border border-neutral-300/40">
                {/* Header */}
                <div className="px-6 pt-8 pb-6 text-center bg-white">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{backgroundColor:'#D7E5CF'}}>
                        <ChefHat className="w-8 h-8" style={{color:'#5E7A0F'}} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900">Welcome to CheffAI</h1>
                    <p className="text-neutral-600 mt-2">Sign in to your account to continue</p>
                </div>

                <div className="h-px bg-neutral-300/60" />

                {error && <p className="text-red-600 text-sm px-6 pt-4">{error}</p>}
                <form onSubmit={handleLogin} className="px-6 py-6 space-y-4">
                    <label className="block text-sm font-medium text-neutral-800">Email</label>
                    <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-md bg-neutral-900 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#5E7A0F]"
                        disabled={isLoading}
                    />
                    <div className="flex items-center justify-between mt-2">
                        <label className="text-sm font-medium text-neutral-800">Password</label>
                        <Link href="#" className="text-sm font-semibold" style={{color:'#5E7A0F'}}>
                            Forgot password?
                        </Link>
                    </div>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-md bg-neutral-900 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#5E7A0F]"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="w-full px-4 py-2 rounded-md text-white font-semibold shadow-sm disabled:opacity-70"
                        style={{backgroundColor:'#5E7A0F'}}
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="h-px bg-neutral-300/60" />

                <p className="px-6 py-6 text-center text-neutral-700">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-semibold hover:underline" style={{color:'#5E7A0F'}}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}


