"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroVideoProps {
    onComplete: () => void;
    house: string;
    videoSrc: string; // New prop for local video file
}

const HOUSE_COLORS: Record<string, string> = {
    'Gryffindor': 'text-red-500',
    'Slytherin': 'text-green-500',
    'Ravenclaw': 'text-blue-500',
    'Hufflepuff': 'text-yellow-500'
};

export function IntroVideo({ onComplete, house, videoSrc }: IntroVideoProps) {
    const [showButton, setShowButton] = useState(false);

    const colorClass = HOUSE_COLORS[house] || 'text-gold';

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowButton(true);
        }, 3000); // Shorter wait for better UX
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
        >
            {/* Local Video Background */}
            <div className="absolute inset-0 w-full h-full pointer-events-none opacity-80">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src={videoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>

            <div className="relative z-10 flex flex-col items-center text-center p-8">
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className={`text-5xl md:text-7xl font-cinzel ${colorClass} drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-4`}
                >
                    {house ? `Welcome to ${house}` : "The Tournament Begins"}
                </motion.h1>

                <AnimatePresence>
                    {showButton && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onComplete}
                            className="mt-12 px-12 py-4 bg-burgundy/80 border-2 border-gold text-gold font-cinzel font-bold text-xl md:text-2xl rounded-sm shadow-[0_0_30px_rgba(116,0,1,0.5)] hover:bg-burgundy hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] transition-all duration-300 backdrop-blur-sm"
                        >
                            ENTER THE ARENA
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

        </motion.div>
    );
}
