"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ElderWandProps {
    currentStage: number; // 0 to 6
}

export function ElderWand({ currentStage }: ElderWandProps) {
    const totalFragments = 5;

    // Normalizing stage to unlock count (Stage 1 = 0 unlocked initially, or strictly based on "completed")
    // If currentStage is 1 (looking for clue 1), 0 items are unlocked.
    // If currentStage is 2 (looking for clue 2), 1 item is unlocked.
    // Display unlocks up to currentStage - 1.
    const unlockedCount = Math.max(0, currentStage - 1);

    return (
        <div className="relative p-6 rounded-2xl bg-[#0a0a0c]/60 border border-white/10 backdrop-blur-md overflow-hidden">
            {/* Ambient Wand Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none" />
            <h3 className="text-xs uppercase tracking-[0.3em] text-cyan-200/60 mb-6 text-center drop-shadow-sm font-cinzel">
                The Elder Wand Assembly
            </h3>

            {/* Wand Container */}
            <div className="relative flex items-center justify-center gap-4 py-8">

                {/* Connecting Line (Energy Stream) */}
                <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white/5 -translate-y-1/2 z-0">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 blur-[2px]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(unlockedCount / totalFragments) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-cyan-400"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(unlockedCount / totalFragments) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                </div>

                {/* Fragments */}
                {[...Array(totalFragments)].map((_, i) => {
                    const fragmentIndex = i + 1;
                    const isUnlocked = fragmentIndex <= unlockedCount;
                    const isNext = fragmentIndex === unlockedCount + 1;

                    return (
                        <div key={i} className="relative z-10 group">
                            {/* Fragment Node */}
                            <motion.div
                                className={`
                                    relative w-12 h-16 md:w-16 md:h-20 flex items-center justify-center rounded-xl border-2 transition-all duration-700
                                    ${isUnlocked
                                        ? "border-cyan-400/50 bg-black/40 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                                        : isNext
                                            ? "border-white/20 bg-white/5 animate-pulse"
                                            : "border-white/5 bg-transparent opacity-40"}
                                `}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                {/* Active Particle Emitter for Unlocked */}
                                {isUnlocked && (
                                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                            className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.1)_180deg,transparent_360deg)] opacity-50"
                                        />
                                    </div>
                                )}

                                {/* Icon / Image */}
                                <motion.img
                                    src={isUnlocked ? `/assets/frag${fragmentIndex}.png` : '/assets/lock.png'}
                                    alt={`Fragment ${fragmentIndex}`}
                                    className={`w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-lg transition-all duration-500 ${isUnlocked ? 'grayscale-0 scale-100' : 'grayscale opacity-50 scale-75'}`}
                                    animate={isUnlocked ? { y: [0, -5, 0] } : {}}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                                />

                                {/* Sparkle Effect on Unlock */}
                                <AnimatePresence>
                                    {isUnlocked && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="absolute inset-0 bg-cyan-400 rounded-full blur-xl"
                                        />
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Label */}
                            <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-widest uppercase transition-colors duration-500 ${isUnlocked ? 'text-cyan-400' : 'text-transparent'}`}>
                                Part {toRoman(fragmentIndex)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Status Text */}
            <div className="text-center mt-2">
                <p className="text-xs text-white/40 font-mono">
                    {unlockedCount === 5
                        ? <span className="text-cyan-400 font-bold animate-pulse">WAND ASSEMBLED - MASTER OF DEATH</span>
                        : `${5 - unlockedCount} FRAGMENTS REMAINING`
                    }
                </p>
            </div>
        </div>
    );
}

function toRoman(num: number): string {
    const roman = ["I", "II", "III", "IV", "V"];
    return roman[num - 1] || "";
}
