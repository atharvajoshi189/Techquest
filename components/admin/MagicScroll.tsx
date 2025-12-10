"use client";

import React from "react";
import { motion } from "framer-motion";

interface MagicScrollProps {
    children: React.ReactNode;
    title?: string;
}

export function MagicScroll({ children, title }: MagicScrollProps) {
    return (
        <div className="relative w-full h-full flex flex-col items-center">
            {/* Scroll Top Roll (Decorative) */}
            <div className="w-[110%] h-12 bg-[#d7ccc8] rounded-full shadow-lg relative z-20 flex items-center justify-center border-b-4 border-[#a1887f]">
                <div className="w-[98%] h-full border-t border-white/30 rounded-full" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-40 mix-blend-multiply" />
                {/* Golden Ends */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-l-full shadow-inner" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-l from-amber-600 to-yellow-500 rounded-r-full shadow-inner" />
            </div>

            {/* Main Papyrus Body */}
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-[95%] flex-1 bg-[#f5e6c8] relative overflow-hidden shadow-2xl border-x-8 border-[#eefeeba]"
            >
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-60 mix-blend-multiply pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />

                {/* Content Container */}
                <div className="relative z-10 p-6 h-full flex flex-col">
                    {title && (
                        <div className="text-center mb-6">
                            <h3 className="font-cinzel text-3xl font-bold text-[#3e2723] tracking-wider drop-shadow-sm border-b-2 border-[#5d4037]/30 pb-2 inline-block">
                                {title}
                            </h3>
                        </div>
                    )}

                    {/* Scrollable Area with Custom Scrollbar */}
                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-magic space-y-4 pb-12">
                        {children}
                    </div>
                </div>

            </motion.div>

            {/* Scroll Bottom Roll (Decorative) */}
            <div className="w-[110%] h-12 bg-[#d7ccc8] rounded-full shadow-lg relative z-20 flex items-center justify-center border-t-4 border-[#a1887f] -mt-2">
                <div className="w-[98%] h-full border-b border-black/10 rounded-full" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-40 mix-blend-multiply" />
                {/* Golden Ends */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-l-full shadow-inner" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-l from-amber-600 to-yellow-500 rounded-r-full shadow-inner" />
            </div>

            <style jsx global>{`
        .custom-scrollbar-magic::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar-magic::-webkit-scrollbar-track {
          background: rgba(93, 64, 55, 0.1);
          border-radius: 5px;
        }
        .custom-scrollbar-magic::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8d6e63, #5d4037);
          border-radius: 5px;
          border: 1px solid #3e2723;
        }
        .custom-scrollbar-magic::-webkit-scrollbar-thumb:hover {
          background: #3e2723;
        }
      `}</style>
        </div>
    );
}
