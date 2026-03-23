"use client";

import Link from "next/link";
import { ChefHat, FileUp, Wand2, Timer } from "lucide-react";
import SiteFooter from "@/app/components/site-footer";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "./contex/contex";

export default function Home() {
  const { user } = useAuth();

  return (
      <div>
          <main className="min-h-[calc(100vh-56px)] px-4 py-10">

              <section className="max-w-3xl mx-auto text-center space-y-8">
                  <div
                      className="flex items-center justify-center w-24 h-24 rounded-full mx-auto shadow-sm ring-1 ring-black/5"
                      style={{backgroundColor: '#5E7A0F'}}>
                      <ChefHat className="w-12 h-12 text-[#F5F0D7]"/>
                  </div>
                  <div className="space-y-4">
                      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 to-[#5E7A0F] bg-clip-text text-transparent">
                          SmartChef AI
                      </h1>
                      <p className="text-lg text-neutral-700 max-w-xl mx-auto">Track ingredients. Prevent waste. Ask for
                          recipes.</p>
                  </div>

              </section>

              <div className="max-w-6xl mx-auto my-10 h-px bg-neutral-300/40"/>

              <section className="max-w-6xl mx-auto py-8 text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 mb-10">How To Use SmartChef
                      AI</h2>
                  <div className="grid md:grid-cols-3 gap-8 justify-items-center">
                      {[
                          {
                              Icon: FileUp,
                              title: '1) Load your receipt',
                              desc: 'Upload a photo or file of your shopping receipt so we can parse your ingredients.',
                              tint: '#D7E5CF',
                              icon: '#5E7A0F'
                          },
                          {
                              Icon: Wand2,
                              title: '2) Let AI create recipes',
                              desc: 'SmartChef AI suggests recipes tailored to what you bought and your preferences.',
                              tint: '#C7D39E',
                              icon: '#628A6A'
                          },
                          {
                              Icon: Timer,
                              title: '3) Use items expiring soon',
                              desc: 'Cook with ingredients that expire first to save food and money.',
                              tint: '#F1C8B8',
                              icon: '#D46B54'
                          },
                      ].map(({Icon, title, desc, tint, icon}, i) => (
                          <div key={i} className="text-center px-4 max-w-sm">
                              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5"
                                   style={{backgroundColor: tint}}>
                                  <Icon className="w-10 h-10" style={{color: icon}}/>
                              </div>
                              <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
                              <p className="text-neutral-700 leading-relaxed">{desc}</p>
                          </div>
                      ))}
                  </div>
              </section>

              <div className="max-w-6xl mx-auto my-10 h-px bg-neutral-300/40"/>

              <section className="max-w-6xl mx-auto py-12">
                  <div className="max-w-3xl mx-auto text-center">
                      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900">What Is SmartChef AI?</h2>
                      <div className="mx-auto mt-4 h-1 w-24 rounded-full" style={{backgroundColor: '#5E7A0F'}}/>
                      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                          <p className="text-lg text-neutral-700 leading-8">
                              SmartChef AI is an assistant that knows your <span className="font-semibold">ingredients</span> and when they could
                              <span className="font-semibold"> expire</span>. It gives you a live view of your fridge online so before cooking you can quickly
                              check what’s available and what should be used first.
                          </p>
                          <p className="text-lg text-neutral-700 leading-8 mt-6">
                              Not sure what to cook? Just ask. SmartChef AI already has your ingredients and expiration info, so it can
                              suggest recipes that use what you own right now, reducing waste and making dinner decisions easier.
                          </p>
                      </div>
                  </div>
              </section>

              <div className="max-w-6xl mx-auto my-10 h-px bg-neutral-300/40"/>

              <section className="max-w-3xl mx-auto text-center py-10">
                  <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Ready to Transform Your
                      Cooking?</h2>
                  <Link href="/protected/uiopenai/stream">
                      <Button
                          className="bg-[#5E7A0F] hover:bg-[#4F680D] text-white px-8 py-3 rounded-xl font-medium shadow-sm">
                          Get Started
                      </Button>
                  </Link>
              </section>
          </main>
          <SiteFooter/>
      </div>
  );
}
