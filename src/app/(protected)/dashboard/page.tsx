import SignOutButton from "../../components/signout/sign-out-button"

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <SignOutButton />
      </div>
    </main>
  )
}
