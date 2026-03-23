import Link from "next/link"

export default function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-20 bg-[#211A14] text-neutral-200">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="text-2xl font-semibold" style={{ color: '#6EE26B' }}>SmartChef AI</h3>
            <p className="mt-4 text-sm text-neutral-300/90 leading-6">
              Your kitchen co‑pilot — track ingredients, see when items might expire,
              and cook smarter with AI suggestions tailored to what you already have.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-100">Product</h4>
            <ul className="mt-4 space-y-3 text-sm text-neutral-300/90">
              <li><Link href="/protected/uiopenai/chatPictures" className="hover:text-white">Add Products</Link></li>
              <li><Link href="/protected/used-recipes" className="hover:text-white">Used Recipes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-100">Guides</h4>
            <ul className="mt-4 space-y-3 text-sm text-neutral-300/90">
              <li><Link href="/protected/uiopenai/stream" className="hover:text-white">AI Cooking Guide</Link></li>
              <li><Link href="/protected/uiopenai/stream" className="hover:text-white">Plan with Expiry</Link></li>
              <li><Link href="/protected/uiopenai/stream" className="hover:text-white">Quick Start</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-100">Legal</h4>
            <ul className="mt-4 space-y-3 text-sm text-neutral-300/90">
              <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
            </ul>
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-neutral-100">Connect</h4>
              <p className="mt-3 text-sm text-neutral-300/90">Join our community soon</p>
            </div>
          </div>
        </div>

        <div className="mt-10 h-px w-full bg-white/10" />
        <p className="text-xs text-neutral-400 mt-6">© {year} SmartChef AI. All rights reserved.</p>
      </div>
    </footer>
  )
}
