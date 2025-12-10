import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface PreloaderProps {
    onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
    const mobileVideoRef = useRef<HTMLVideoElement>(null);
    const pcVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Fallback: If videos fail to play or stall, force complete after a safety timeout (e.g., 10s)
        const timeout = setTimeout(() => {
            onComplete();
        }, 10000);

        return () => clearTimeout(timeout);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        >
            {/* Mobile Video */}
            <video
                ref={mobileVideoRef}
                src="/Mobile_loader.webm"
                className="absolute inset-0 w-full h-full object-cover block md:hidden"
                autoPlay
                muted
                playsInline
                onEnded={onComplete}
            />

            {/* Desktop Video */}
            <video
                ref={pcVideoRef}
                src="/Desktop_loader.webm"
                className="absolute inset-0 w-full h-full object-cover hidden md:block"
                autoPlay
                muted
                playsInline
                onEnded={onComplete}
            />
        </motion.div>
    );
}
