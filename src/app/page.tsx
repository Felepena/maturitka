import Image from "next/image";
import Link from "next/link";
import { ChefHat } from "lucide-react"
import Button from "./components/ui/button";
export default function Home() {

    return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-8 bg">
            <div className="max-w-2xl mx-auto text-center space-y-8">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mx-auto">
                    <ChefHat className="w-10 h-10 text-green-600" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 text-balance">
                        CheffAI - Your Smart Kitchen Assistant
                    </h1>
                    <p className="text-lg text-slate-600 text-pretty max-w-xl mx-auto">
                        AI-powered platform that helps you save food, reduce waste, and cook amazing meals with what you already
                        have!
                    </p>
                </div>




                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">

                    <Button style={"bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-medium"} text="Start Chating" path="/OpenAI"/>
                    <Button style={"bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-medium"} text="Login" path="/login"/>
                </div>
            </div>
        </div>
    )
}
