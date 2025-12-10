"use client";
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface IntroVideoProps {
    house: string;
    videoSrc?: string;
    onComplete: () => void;
}

export function IntroVideo({ house, videoSrc, onComplete }: IntroVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(err => {
                console.warn("Autoplay failed", err);
                // If autoplay fails (browser policy), we might just autocomplete or show a play button.
                // For this immersive exp, let's just complete to avoid getting stuck.
                // Alternatively, user might interact.
                // Let's rely on the "Skip" button as a fallback.
            });
        }
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center"
        >
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                {/* Note: In a real app, ensure videoSrc exists or fallback to just text/image */}
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover opacity-80"
                    src={videoSrc}
                    muted
                    playsInline
                    onEnded={onComplete}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
            </div>

            {/* Overlay Text */}
            <div className="relative z-10 text-center space-y-4">
                <h2 className="text-4xl md:text-6xl font-cinzel font-bold text-white tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                    WELCOME TO {house.toUpperCase()}
                </h2>
                <p className="text-white/70 font-hand text-xl animate-pulse">Initializing Magical Uplink...</p>
            </div>

            {/* Skip Button */}
            <button
                onClick={onComplete}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 hover:text-white border border-white/30 px-6 py-2 rounded-full uppercase text-xs tracking-[0.2em] backdrop-blur-md transition-all hover:bg-white/10"
            >
                Skip Intro
            </button>
        </motion.div>
    );
}
