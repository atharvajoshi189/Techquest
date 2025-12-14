"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WandAssemblySequenceProps {
    onComplete: () => void;
}

export function WandAssemblySequence({ onComplete }: WandAssemblySequenceProps) {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        // Phase 1: Start (0s) - Already set
        // Phase 2: Flash (2s)
        const t1 = setTimeout(() => setPhase(1), 2000);
        // Phase 3: Show Full Wand (2.5s)
        const t2 = setTimeout(() => setPhase(2), 2500);
        // Phase 4: Show Text (4s)
        const t3 = setTimeout(() => setPhase(3), 4000);
        // Complete (6s) or wait for manual close? User didn't specify auto-close, 
        // but typically we'd wait for user interaction or auto-proceed. 
        // Let's add a button in Phase 3 or just auto-complete after some time?
        // User prompt says: "BEFORE redirecting or showing the result". 
        // So we should probably call onComplete after the text is shown for a bit.
        const t4 = setTimeout(onComplete, 7000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">

            {/* STAGE AREA */}
            <div className="relative w-full max-w-lg h-64 flex items-center justify-center">

                {/* FRAGMENTS ASSEMBLING */}
                <AnimatePresence>
                    {phase < 2 && (
                        <motion.div
                            className="flex items-center justify-center"
                            initial={{ gap: '1rem' }}
                            animate={{ gap: phase >= 1 ? '-1rem' : '1rem' }} // Reduce gap to overlap
                            transition={{ duration: 2, ease: "easeInOut" }}
                        >
                            {[1, 2, 3, 4, 5].map((i) => (
                                <motion.img
                                    key={i}
                                    src={`/assets/frag${i}.png`}
                                    alt={`Fragment ${i}`}
                                    className="w-12 h-16 object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] z-10"
                                    initial={{ scale: 1, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* THE FLASH */}
                <div
                    className={`absolute inset-0 bg-white mix-blend-screen pointer-events-none transition-opacity duration-500 ease-out ${phase === 1 ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* FULL WAND REVEAL */}
                <AnimatePresence>
                    {phase >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                            animate={{ opacity: 1, scale: 1.2, rotate: 0 }}
                            transition={{ duration: 1, type: "spring" }}
                            className="relative z-20"
                        >
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-400/50 to-yellow-500/0 blur-xl animate-pulse" />
                            <img
                                src="/assets/elder_wand_full.png"
                                alt="The Elder Wand"
                                className="w-64 h-auto drop-shadow-[0_0_30px_rgba(253,224,71,0.8)] relative z-20"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* TEXT REVEAL */}
            <AnimatePresence>
                {phase >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mt-12 space-y-4"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                            ROUND 1 COMPLETE
                        </h1>
                        <p className="text-white/80 text-xl font-cinzel tracking-[0.2em] animate-pulse">
                            The Wand is Yours.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
