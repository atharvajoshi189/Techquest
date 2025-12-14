"use client";
import React, { useEffect, useState } from 'react';

export const GrandFinale = () => {
    const [stage, setStage] = useState<'summon' | 'rumble' | 'snap' | 'reveal'>('summon');

    useEffect(() => {
        // Orchestrate the timeline
        // 0s: Summon (Fade in black, particles rising)
        // 1s: Rumble (Fragments appear and shake)
        // 3s: Snap (Fragments merge rapidly, screen flash starts)
        // 3.5s: Reveal (Flash fades, full wand appears)

        const t1 = setTimeout(() => setStage('rumble'), 1000);
        const t2 = setTimeout(() => setStage('snap'), 3000); // The Implosion
        const t3 = setTimeout(() => setStage('reveal'), 3500); // The Reveal (Flash peak)

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    // Generate balanced random particles
    // Memoizing or static generating to prevent hydration mismatch is ideal, 
    // but simplified here for effects.
    const particles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        bottom: `-${Math.random() * 20}%`, // Start below screen
        size: Math.random() < 0.3 ? 'w-2 h-2' : 'w-1 h-1',
        animationDuration: `${3 + Math.random() * 5}s`,
        animationDelay: `${Math.random() * 2}s`
    }));

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">

            {/* 1. Ambient Golden Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className={`absolute bg-yellow-400 rounded-full opacity-0 ${p.size}`}
                        style={{
                            left: p.left,
                            bottom: p.bottom,
                            animation: `float-up ${p.animationDuration} cubic-bezier(0.4, 0, 0.2, 1) infinite`,
                            animationDelay: p.animationDelay
                        }}
                    />
                ))}
            </div>

            {/* 2. THE BLINDING FLASH OVERLAY */}
            {/* It hits opacity-100 exactly when stage switches to 'reveal', then fades out. */}
            {/* Logic: 
                - 'snap': Flash STARTS rising (opacity 0 -> 1)
                - 'reveal': Flash STARTS falling (opacity 1 -> 0) 
            */}
            <div
                className={`absolute inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-300 ease-in
                    ${stage === 'snap' ? 'opacity-100 delay-[400ms]' : '' /* Flash bomb at the end of snap */}
                    ${stage === 'reveal' ? 'opacity-0 duration-[1500ms]' : '' /* Long fade out */}
                    ${stage === 'summon' || stage === 'rumble' ? 'opacity-0' : ''}
                `}
            />

            {/* 3. FRAGMENTS (The Assembly) */}
            {/* Visible until the reveal phase completes the swap */}
            {stage !== 'reveal' && (
                <div
                    className={`relative z-10 flex items-center justify-center transition-all duration-500 ease-in-out
                        ${stage === 'summon' ? 'opacity-0 scale-90 translate-y-10' : 'opacity-100 scale-100 translate-y-0'}
                        ${stage === 'snap' ? 'gap-0 scale-50 opacity-100' : 'gap-4 md:gap-8'}
                    `}
                >
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`relative
                            ${stage === 'rumble' ? 'animate-rumble' : ''}
                        `}>
                            <img
                                src={`/assets/frag${i}.png`}
                                className={`w-12 md:w-32 object-contain drop-shadow-[0_0_15px_rgba(253,224,71,0.4)]
                                    ${stage === 'snap' ? `transition-transform duration-300 ${i === 1 || i === 5 ? 'scale-150' : ''}` : ''}
                                `}
                                alt={`Fragment ${i}`}
                            />
                            {/* Energy Arcs during rumble */}
                            {stage === 'rumble' && (
                                <div className="absolute inset-0 border-2 border-yellow-300/30 rounded-full animate-ping opacity-20" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 4. THE REVEAL (Full Wand + Text) */}
            {stage === 'reveal' && (
                <div className="relative z-10 flex flex-col items-center animate-[fade-in-up_1s_ease-out_forwards]">
                    {/* The Artifact */}
                    <div className="relative animate-levitate">
                        {/* Divine Glow Background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-yellow-500/30 to-transparent blur-3xl animate-pulse" />

                        <img
                            src="/assets/elder_wand_full.png"
                            className="w-[70vw] md:w-[35vw] object-contain drop-shadow-[0_0_50px_rgba(255,215,0,0.8)] filter brightness-110"
                            alt="The Elder Wand"
                        />
                    </div>

                    {/* Victory Text */}
                    <div className="mt-12 text-center space-y-2 opacity-0 animate-[fade-in-up_1s_ease-out_0.5s_forwards]">
                        <h1 className="text-4xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-t from-yellow-600 via-yellow-200 to-white drop-shadow-sm font-cinzel tracking-wider">
                            VICTORY
                        </h1>
                        <p className="text-yellow-100/60 tracking-[0.4em] uppercase text-xs md:text-lg font-cinzel">
                            Round 1 Completed
                        </p>
                    </div>
                </div>
            )}

            {/* CSS ANIMATIONS */}
            <style jsx global>{`
                @keyframes float-up {
                    0% { transform: translateY(0) scale(0); opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { transform: translateY(-120vh) scale(1); opacity: 0; }
                }
                @keyframes rumble {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                @keyframes levitate {
                    0%, 100% { transform: translateY(0); filter: brightness(1); }
                    50% { transform: translateY(-20px); filter: brightness(1.2); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
