"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {AuthProvider, useAuth} from "../contex/contex"

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
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-indigo-200"
                        disabled={isLoading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-indigo-200"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:bg-indigo-300"
                        disabled={isLoading}
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-indigo-500 hover:underline">
                        Signup
                    </Link>
                </p>
            </div>
        </div>
    )
}


