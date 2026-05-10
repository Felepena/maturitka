"use client"

import { useEffect, useRef, useState } from "react"
import UserMenu from "./user-menu"
import { useAuth } from "../contex/contex"
import Link from "next/link"
import Image from "next/image"
import { Playfair_Display } from "next/font/google"
import { Menu, X } from "lucide-react"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], display: "swap" })

export default function navbar() {
  const { user, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!mobileMenuRef.current) return
      if (!mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [mobileMenuOpen])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [user])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="fixed top-0 inset-x-0 h-[120px] z-50 border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-sm">
      <div className="mx-auto max-w-6xl h-full px-4 flex items-center relative">
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
          {!loading && user ? <div className="hidden sm:block"><UserMenu /></div> : null}
          {!loading && user ? (
            <div className="sm:hidden relative" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-black"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
                aria-haspopup="menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
                  <nav className="flex flex-col py-2">
                    <Link
                      href="/protected/myproducts"
                      className="px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                      onClick={closeMobileMenu}
                    >
                      Smart Fridge
                    </Link>
                    <Link
                      href="/protected/uiopenai/chatPictures"
                      className="px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                      onClick={closeMobileMenu}
                    >
                      Add Products
                    </Link>
                    <Link
                      href="/protected/used-recipes"
                      className="px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                      onClick={closeMobileMenu}
                    >
                      Used Recipes
                    </Link>
                    <div className="my-1 h-px bg-neutral-200" />
                    <Link
                      href="/settingsPage"
                      className="px-4 py-3 text-sm text-neutral-800 hover:bg-neutral-50"
                      onClick={closeMobileMenu}
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu()
                        void signOut()
                      }}
                      className="px-4 py-3 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                    >
                      Sign out
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
