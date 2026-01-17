"use client"
import { useRouter } from "next/navigation"  // for router
import {AuthProvider, useAuth} from "../contex/contex"
import React, { useState, useEffect } from "react"
import { ChefHat } from "lucide-react"
import Link from "next/link"


export default function SignupPage() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loading, setIsLoading] = useState(false)
    const { signUp, user } = useAuth()
    const router = useRouter()

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
            await signUp(email, password)
            setSuccess("Account created successfully! You can now log in.")
            setEmail("")
            setPassword("")
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

        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden border border-neutral-300/40">
                <div className="px-6 pt-8 pb-6 text-center bg-white">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{backgroundColor:'#D7E5CF'}}>
                        <ChefHat className="w-8 h-8" style={{color:'#5E7A0F'}} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900">Create Account</h1>
                    <p className="text-neutral-600 mt-2">Join CheffAI to start cooking smarter</p>
                </div>

                <div className="h-px bg-neutral-300/60" />

                {error && <p className="text-red-600 text-sm px-6 pt-4">{error}</p>}
                {success && <p className="text-green-700 text-sm px-6 pt-4">{success}</p>}
                <form onSubmit={handleSignup} className="px-6 py-6 space-y-4">
                    <label className="block text-sm font-medium text-neutral-800">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-md bg-neutral-900 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#5E7A0F]"
                        disabled={loading}
                    />

                    <label className="block text-sm font-medium text-neutral-800">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-md bg-neutral-900 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#5E7A0F]"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="w-full px-4 py-2 rounded-md text-white font-semibold shadow-sm disabled:opacity-70"
                        style={{backgroundColor:'#5E7A0F'}}
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Sign up"}
                    </button>
                </form>

                <div className="h-px bg-neutral-300/60" />
                <p className="px-6 py-6 text-center text-neutral-700">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold hover:underline" style={{color:'#5E7A0F'}}>
                        Log in
                    </Link>
                </p>
            </div>
        </div>

    )

}
