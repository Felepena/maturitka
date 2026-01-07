import Image from "next/image";
import Link from "next/link";
import { ChefHat } from "lucide-react"
import Button from "./components/ui/button";
export default function Home() {

    return (
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10">
            <div className="max-w-2xl mx-auto text-center space-y-8">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-neutral-900 mx-auto">
                    <ChefHat className="w-10 h-10 text-white" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 text-balance">
                        CheffAI - Your Smart Kitchen Assistant
                    </h1>
                    <p className="text-lg text-neutral-600 text-pretty max-w-xl mx-auto">
                        AI-powered platform that helps you save food, reduce waste, and cook amazing meals with what you already
                        have!
                    </p>
                </div>




                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button style={"bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-3 rounded-xl font-medium"} text="Start Chatting" path="/protected/uiopenai/stream"/>
                    <Button style={"bg-white hover:bg-neutral-50 text-neutral-900 px-8 py-3 rounded-xl font-medium border border-neutral-200"} text="Login" path="/login"/>
                </div>
            </div>
        </div>
    )
}
