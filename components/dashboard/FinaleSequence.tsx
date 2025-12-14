"use client";
import React, { useEffect, useState } from 'react';

export const FinaleSequence = () => {
    const [phase, setPhase] = useState<'merging' | 'flash' | 'done'>('merging');

    useEffect(() => {
        // Timeline:
        // 0s: Fragments start moving (merging)
        // 2s: Flash triggers, switch to Full Wand
        // 2.5s: Reveal wand and text

        const t1 = setTimeout(() => setPhase('flash'), 2000);
        const t2 = setTimeout(() => setPhase('done'), 2200); // Quick flash

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    // Generate random particles
    const particles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${2 + Math.random() * 3}s`
    }));

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">

            {/* Golden Particles Layer */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute w-1 h-1 md:w-2 md:h-2 bg-yellow-400 rounded-full animate-pulse"
                        style={{
                            left: p.left,
                            top: p.top,
                            animation: `float ${p.duration} ease-in-out infinite`,
                            animationDelay: p.delay,
                            opacity: 0.6
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
                    50% { transform: translateY(-20px) scale(1.5); opacity: 1; }
                }
                @keyframes flash {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>

            {/* Flash Overlay */}
            {phase === 'flash' && (
                <div className="absolute inset-0 bg-white z-[110] animate-[flash_0.5s_ease-out_forwards]" />
            )}

            {/* WAND ANIMATION */}
            <div className={`relative z-10 transition-all duration-1000 flex items-center justify-center h-64 w-full`}>
                {phase === 'done' ? (
                    <div className="flex flex-col items-center animate-[fadeIn_1s_ease-out]">
                        <img
                            src="/assets/elder_wand_full.png"
                            className="w-64 md:w-96 drop-shadow-[0_0_30px_rgba(234,179,8,0.8)] animate-pulse object-contain"
                            alt="The Elder Wand"
                        />
                    </div>
                ) : (
                    <div className={`flex items-center transition-all duration-[2000ms] ease-in-out ${phase === 'merging' ? 'gap-0 scale-100' : 'gap-12 md:gap-24'}`}>
                        {/* 5 Fragments collapsing to center */}
                        {/* Using explicit translates to mock the "crash" effect */}
                        <img
                            src="/assets/frag1.png"
                            className={`w-12 md:w-16 object-contain transition-transform duration-[2000ms] ease-in-out ${phase === 'merging' ? 'translate-x-full rotate-12' : '-translate-x-full'}`}
                        />
                        <img
                            src="/assets/frag2.png"
                            className={`w-12 md:w-16 object-contain transition-transform duration-[2000ms] ease-in-out ${phase === 'merging' ? 'translate-x-1/2 -rotate-12' : '-translate-x-1/2'}`}
                        />
                        <img
                            src="/assets/frag3.png"
                            className={`w-12 md:w-16 object-contain z-10 ${phase === 'merging' ? 'scale-110' : 'scale-100'}`}
                        />
                        <img
                            src="/assets/frag4.png"
                            className={`w-12 md:w-16 object-contain transition-transform duration-[2000ms] ease-in-out ${phase === 'merging' ? '-translate-x-1/2 rotate-12' : 'translate-x-1/2'}`}
                        />
                        <img
                            src="/assets/frag5.png"
                            className={`w-12 md:w-16 object-contain transition-transform duration-[2000ms] ease-in-out ${phase === 'merging' ? '-translate-x-full -rotate-12' : 'translate-x-full'}`}
                        />
                    </div>
                )}
            </div>

            {/* TEXT (Only in 'done' phase) */}
            {phase === 'done' && (
                <div className="mt-8 md:mt-12 text-center animate-[fadeInUp_1s_ease-out_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <h1 className="text-4xl md:text-6xl font-bold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                        CONGRATULATIONS
                    </h1>
                    <p className="text-gray-400 mt-4 text-lg md:text-xl tracking-[0.3em] font-cinzel">ROUND 1 CLEARED</p>
                </div>
            )}

            <style jsx global>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};
