"use client";

import React from "react";
import { motion } from "framer-motion";

interface InventoryPouchProps {
    revealedPassword: string;
}

export function InventoryPouch({ revealedPassword }: InventoryPouchProps) {
    const chars = revealedPassword.split(' ');

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-2xl mx-auto mt-8 bg-[#263238] rounded-xl p-6 border-4 border-[#37474f] shadow-2xl relative"
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30 mix-blend-overlay rounded-xl" />

            {/* Pouch Header */}
            <div className="text-center mb-6 relative z-10">
                <h3 className="font-cinzel text-starlight text-lg tracking-widest uppercase text-shadow-glow">Collected Fragments</h3>
                <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#cfd8dc] to-transparent mx-auto mt-2" />
            </div>

            {/* Fragment Slots */}
            <div className="grid grid-cols-8 gap-2 relative z-10">
                {chars.map((char, index) => {
                    const isRevealed = char !== "?" && char !== "_";
                    const isLocked = char === "_";

                    return (
                        <motion.div
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`aspect-square rounded border-2 flex items-center justify-center text-xl md:text-2xl font-bold shadow-inner transition-colors duration-500
                            ${isRevealed
                                    ? "bg-amber-100 border-amber-300 text-amber-900 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                                    : isLocked
                                        ? "bg-black/40 border-white/10 text-white/10"
                                        : "bg-white/5 border-white/20 text-white/30"
                                }
                        `}
                        >
                            {isRevealed ? char : isLocked ? '🔒' : '?'}
                        </motion.div>
                    )
                })}
            </div>

            {/* Decorative Drawstring */}
            <div className="absolute -top-4 w-full left-0 flex justify-center pointer-events-none">
                <div className="w-32 h-4 bg-[#37474f] rounded-full shadow-md" />
            </div>

        </motion.div>
    );
}
