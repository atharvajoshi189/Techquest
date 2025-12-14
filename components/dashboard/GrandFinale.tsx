"use client";
import React, { useEffect, useState } from 'react';

export const GrandFinale = () => {
    const [phase, setPhase] = useState<'cosmos' | 'gathering' | 'impact' | 'reveal'>('cosmos');

    useEffect(() => {
        // Timeline Sequence
        const t1 = setTimeout(() => setPhase('gathering'), 1500);
        const t2 = setTimeout(() => setPhase('impact'), 3000); // 1.5s gathering time
        const t3 = setTimeout(() => setPhase('reveal'), 3500); // 0.5s impact time

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex items-center justify-center font-cinzel text-white">

            {/* 1. Spinning Galaxy Background */}
            <div className="absolute inset-0 bg-[url('https://assets.codepen.io/1948355/nebula.jpg')] bg-cover bg-center animate-spin-galaxy opacity-50 scale-150" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />

            {/* 2. Particle System (Stardust) */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-70 animate-float-particle"
                        style={{
                            width: Math.random() * 3 + 'px',
                            height: Math.random() * 3 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDuration: 5 + Math.random() * 10 + 's',
                            animationDelay: Math.random() * 5 + 's'
                        }}
                    />
                ))}
            </div>

            {/* 3. The Shockwave Ring (Impact Phase) */}
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full border-[20px] border-white/80 box-content ${phase === 'impact' ? 'animate-shockwave' : 'opacity-0'}`} />

            {/* 4. Fragments & Lightning (Before Reveal) */}
            {phase !== 'reveal' && (
                <div className={`relative flex items-center justify-center transition-all duration-[1500ms] ease-in-out
                    ${phase === 'gathering' || phase === 'impact' ? 'scale-50 gap-0' : 'scale-150 gap-96'}
                `}>
                    {/* Fragments */}
                    {[1, 2, 3, 4, 5].map((i) => {
                        // Calculate fly-in directions for "Cosmos" phase visual
                        // Keep it simple: they just start far apart (gap-96) and come to center (gap-0)
                        return (
                            <div key={i} className={`relative z-10 transition-transform duration-1000 ${phase === 'impact' ? 'shake-hard' : 'animate-float-calm'}`}>
                                <img
                                    src={`/assets/frag${i}.png`}
                                    className="w-16 md:w-32 object-contain drop-shadow-[0_0_15px_rgba(253,224,71,0.6)]"
                                    alt={`Fragment ${i}`}
                                />
                                {/* Lightning Connectors (Only during gathering) */}
                                {phase === 'gathering' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[200px] h-1 bg-blue-400 blur-md opacity-0 animate-lightning-flicker absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45" />
                                        <div className="w-[200px] h-1 bg-yellow-400 blur-md opacity-0 animate-lightning-flicker animation-delay-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 5. THE FULL WAND (After Reveal) */}
            {phase === 'reveal' && (
                <div className="z-20 flex flex-col items-center animate-fade-in-up">
                    {/* The Wand */}
                    <div className="relative animate-magical-float">
                        {/* The Aura */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-yellow-500/20 via-orange-500/10 to-transparent blur-3xl animate-pulse-slow" />

                        <img
                            src="/assets/elder_wand_full.png"
                            className="w-[90vw] md:w-[40vw] max-w-4xl object-contain drop-shadow-[0_0_50px_rgba(255,215,0,0.8)] filter brightness-110"
                            alt="The Elder Wand"
                        />
                    </div>

                    {/* The Text */}
                    <div className="mt-12 text-center space-y-4">
                        <h1 className="text-4xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-t from-yellow-600 via-yellow-200 to-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] animate-scale-up">
                            ROUND 1 COMPLETED
                        </h1>
                        <p className="text-white/60 tracking-[0.5em] uppercase text-xs md:text-lg animate-pulse">
                            Victory Achieved
                        </p>
                        <p className="text-white/40 tracking-widest text-xs md:text-sm pt-4 font-mono animate-fade-in delay-1000">
                            Results will be announced soon...
                        </p>
                    </div>
                </div>
            )}

            {/* Flash Overlay */}
            <div className={`absolute inset-0 bg-white z-[100] transition-opacity duration-300 ease-out pointer-events-none ${phase === 'impact' ? 'opacity-100' : 'opacity-0'}`} />

            {/* STYLES & KEYFRAMES */}
            <style jsx global>{`
                @keyframes spin-galaxy {
                    from { transform: rotate(0deg) scale(1.5); }
                    to { transform: rotate(360deg) scale(1.5); }
                }
                @keyframes float-particle {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
                }
                @keyframes shockwave {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; border-width: 50px; }
                    100% { transform: translate(-50%, -50%) scale(100); opacity: 0; border-width: 0px; }
                }
                @keyframes lightning-flicker {
                    0%, 100% { opacity: 0; }
                    10%, 90% { opacity: 1; }
                    30%, 70% { opacity: 0.2; }
                    50% { opacity: 0.8; }
                }
                @keyframes magical-float {
                    0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 30px rgba(255,215,0,0.5)); }
                    50% { transform: translateY(-20px); filter: drop-shadow(0 0 60px rgba(255,215,0,0.8)); }
                }
                .shake-hard {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scale-up {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                 .animate-spin-galaxy {
                    animation: spin-galaxy 120s linear infinite;
                }
                .animate-float-particle {
                    animation: float-particle 10s ease-in-out infinite;
                }
                .animate-shockwave {
                    animation: shockwave 0.6s ease-out forwards;
                }
                .animate-lightning-flicker {
                    animation: lightning-flicker 0.2s linear infinite;
                }
                .animate-magical-float {
                    animation: magical-float 4s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out forwards;
                }
                .animate-scale-up {
                    animation: scale-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </div>
    );
};
