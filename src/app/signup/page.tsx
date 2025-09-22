"use client"
import { useRouter } from "next/navigation"  // for router
import {AuthProvider, useAuth} from "../contex/contex"
import React, { useState, useEffect } from "react"
import Link from "next/link"


export default function SignupPage() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loading, setIsLoading] = useState(false)
    const { signUp, user } = useAuth()
    const router = useRouter()
    const [username, setUsername] = useState("")

    useEffect(() => {
        if (!loading && user) {
            router.push("/")
        }
    }, [loading, user, router])



    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        setIsLoading(true)

        try {
            await signUp(email, password, username || undefined)
            setSuccess("Account created successfully! You can now log in.")
            setEmail("")
            setPassword("")
            setUsername("")
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("An error occurred. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }



    return (

        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold mb-8 text-center text-indigo-600">Create Account</h1>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
                <form onSubmit={handleSignup} className="space-y-6">
                    <div className="flex" >
                        <label htmlFor="Username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:outline-none"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:outline-none"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:outline-none"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition disabled:bg-indigo-300"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-indigo-500 hover:underline">
                        Log In
                    </Link>
                </p>
            </div>
        </div>

    )

}
