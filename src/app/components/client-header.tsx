"use client"

import UserMenu from "./user-menu"
import { useAuth } from "../contex/contex"
import Link from "next/link"
import Image from "next/image"
import { Playfair_Display } from "next/font/google"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], display: "swap" })

export default function navbar() {
  const { user, loading } = useAuth()

  return (
    <header className="fixed top-0 inset-x-0 h-[120px] z-50 border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-sm">
      <div className="mx-auto max-w-6xl h-full px-4 flex items-center">
        <div className="flex items-center flex-1">
          <Link href="/" className="flex items-center group" aria-label="Home">
            <Image
              src={encodeURI("/SmartChefAI logo with tech elements.png")}
              alt="SmartChef AI Logo"
              width={2800}
              height={840}
              className="h-[176px] sm:h-[176px] mt-4 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              priority
            />
          </Link>
        </div>
        <nav className="hidden sm:flex items-center gap-6 justify-center">
          <Link href="/protected/myproducts" className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors">Smart Fridge</Link>
          <Link href="/protected/uiopenai/chatPictures" className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors">Add Products</Link>
          <Link href="/protected/used-recipes" className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors">Used Recipes</Link>
        </nav>
        <div className="flex items-center gap-3 flex-1 justify-end">
          {!loading && !user && (
            <Link href="/protected/uiopenai/stream" className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white shadow-sm transition-colors bg-neutral-900 hover:bg-black">
              Get Started
            </Link>
          )}
          {!loading && user ? <UserMenu /> : null}
        </div>
      </div>
    </header>
  )
}
