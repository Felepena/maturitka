import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/lib/config"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import sampleReceipt from "../../../../sample_receipt.json"

type ReceiptItem = {
  name: string
  quantity: number
  price: number
  expiryDate: string | null
}

type Receipt = {
  items: ReceiptItem[]
  total: number
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json(
        { error: "Missing 'uid' query parameter" },
        { status: 400 }
      )
    }

    // Optionally allow overriding the payload via request body; otherwise use sample.
    let payload: Receipt | null = null
    try {
      const bodyText = await request.text()
      if (bodyText) {
        payload = JSON.parse(bodyText) as Receipt
      }
    } catch {
    }

    const data: Receipt = payload ?? (sampleReceipt as Receipt)

    // Basic validation
    if (!data || !Array.isArray(data.items) || typeof data.total !== "number") {
      return NextResponse.json(
        { error: "Invalid receipt payload" },
        { status: 400 }
      )
    }

    const receiptsCol = collection(db, "users", uid, "receipts")
    const docRef = await addDoc(receiptsCol, {
      ...data,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({ id: docRef.id, uid, count: data.items.length })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to save receipt" },
      { status: 500 }
    )
  }
}
