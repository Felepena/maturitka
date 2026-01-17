import Image from "next/image";
import Link from "next/link";
import { ChefHat, MessageSquare, Utensils, ChefHat as Hat, Clock, DollarSign, BookOpen } from "lucide-react";
import Button from "./components/ui/button";
export default function Home() {

    return (
        <main className="min-h-[calc(100vh-56px)] px-4 py-10">

            <section className="max-w-3xl mx-auto text-center space-y-8">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-olive-700/90 mx-auto shadow-sm" style={{backgroundColor:'#5E7A0F'}}>
                    <ChefHat className="w-10 h-10 text-[#F5F0D7]" />
                </div>
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900">
                        CheffAI – Your Smart Kitchen Assistant
                    </h1>
                    <p className="text-lg text-neutral-700 max-w-xl mx-auto">
                        Save time, reduce waste, and cook better with AI guidance.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button style={"bg-[#5E7A0F] hover:bg-[#4F680D] text-white px-8 py-3 rounded-xl font-medium shadow-sm"} text="Start Chatting" path="/protected/uiopenai/stream"/>
                    <Button style={"bg-gray-300 text-neutral-900 px-8 py-3 rounded-xl font-medium border border-neutral-300"} text="Login" path="/login"/>
                </div>
            </section>


            <div className="max-w-6xl mx-auto my-10 h-px bg-neutral-300/40" />


            <section className="max-w-6xl mx-auto py-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 mb-10">How CheffAI Helps You Cook</h2>
                <div className="grid md:grid-cols-3 gap-8 justify-items-center">
                    {[
                        { Icon: MessageSquare, title: 'AI-Powered Chat', desc: 'Get personalized recipe ideas and cooking advice.' , tint:'#C7D39E', icon:'#5E7A0F'},
                        { Icon: Utensils, title: 'Reduce Food Waste', desc: 'Tell us your ingredients—get recipes that use them.' , tint:'#F1C8B8', icon:'#D46B54'},
                        { Icon: Hat, title: 'Cooking Guidance', desc: 'Step-by-step instructions to build confidence in the kitchen.' , tint:'#D7E5CF', icon:'#628A6A'},
                    ].map(({Icon,title,desc,tint,icon},i)=> (
                        <div key={i} className="text-center px-4 max-w-sm">
                            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5" style={{backgroundColor:tint}}>
                                <Icon className="w-10 h-10" style={{color:icon}} />
                            </div>
                            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
                            <p className="text-neutral-700 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="max-w-6xl mx-auto my-10 h-px bg-neutral-300/40" />

            <section className="max-w-6xl mx-auto py-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 mb-10">Why Choose CheffAI</h2>
                <div className="grid md:grid-cols-3 gap-8 justify-items-center">
                    {[
                        { Icon: Clock, title: 'Save Time', desc: 'Instant recipe ideas—no endless searching.' , tint:'#C7D39E', icon:'#5E7A0F'},
                        { Icon: DollarSign, title: 'Save Money', desc: 'Use what you have and cut food waste.' , tint:'#F1C8B8', icon:'#D46B54'},
                        { Icon: BookOpen, title: 'Learn New Skills', desc: 'Improve techniques with tips and guidance.' , tint:'#D7E5CF', icon:'#628A6A'},
                    ].map(({Icon,title,desc,tint,icon},i)=> (
                        <div key={i} className="text-center px-4 max-w-sm">
                            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full flex items-center justify-center mb-5" style={{backgroundColor:tint}}>
                                <Icon className="w-8 h-8 md:w-10 md:h-10" style={{color:icon}} />
                            </div>
                            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
                            <p className="text-neutral-700 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Divider */}
            <div className="max-w-6xl mx-auto my-10 h-px bg-neutral-300/40" />

            {/* CTA */}
            <section className="max-w-3xl mx-auto text-center py-10">
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Ready to Transform Your Cooking?</h2>
                <p className="text-neutral-700 mb-8">Join CheffAI and discover the joy of cooking with your personal AI kitchen assistant.</p>
                <Button style={"bg-[#5E7A0F] hover:bg-[#4F680D] text-white px-8 py-3 rounded-xl font-medium shadow-sm"} text="Get Started" path="/protected/uiopenai/stream"/>
            </section>
        </main>
    )
}
