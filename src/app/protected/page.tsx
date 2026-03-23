export default function ProtectedIndexPage() {
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">Protected</h1>
      <ul className="list-disc list-inside space-y-1">
        <li><a className="text-blue-600 underline" href="/protected/myproducts">My Products</a></li>
        <li><a className="text-blue-600 underline" href="/protected/receipts">Receipts</a></li>
        <li><a className="text-blue-600 underline" href="/protected/uiopenai/stream">AI Recipes</a></li>
      </ul>
    </div>
  )
}

