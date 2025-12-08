"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MagicCard } from '@/components/ui/MagicCard';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1547756536-cde3673fa2e5?q=80&w=2041&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat bg-fixed relative overflow-hidden">

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">

        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-cinzel font-bold text-gold drop-shadow-lg mb-4 text-shadow-gold">
            TechQuest
          </h1>
          <p className="text-3xl md:text-4xl font-hand text-parchment/90">
            The Triwizard Tournament
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 w-full">

          <Link href="/login" className="transform hover:scale-105 transition-transform duration-300">
            <MagicCard className="h-full flex flex-col items-center justify-center text-center hover:bg-parchment/90 cursor-pointer">
              <div className="text-6xl mb-6">⚡</div>
              <h2 className="text-4xl font-cinzel font-bold text-ink-black mb-4">Witches & Wizards</h2>
              <p className="text-xl font-hand text-ink-black/80">
                Enter the arena. Prove your worth.
                <br />
                (Student Login)
              </p>
            </MagicCard>
          </Link>

          <Link href="/admin" className="transform hover:scale-105 transition-transform duration-300">
            <MagicCard className="h-full flex flex-col items-center justify-center text-center hover:bg-parchment/90 cursor-pointer border-burgundy/60">
              <div className="text-6xl mb-6">🏰</div>
              <h2 className="text-4xl font-cinzel font-bold text-burgundy mb-4">Dumbledore</h2>
              <p className="text-xl font-hand text-burgundy/80">
                Oversee the tournament.
                <br />
                (Admin Panel)
              </p>
            </MagicCard>
          </Link>

        </div>
      </div>
    </main>
  );
}
