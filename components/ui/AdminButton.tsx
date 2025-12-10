"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function AdminButton() {
    return (
        <Link href="/admin">
            <motion.button
                whileHover={{ scale: 1.1, textShadow: "0 0 8px rgb(255,255,255)" }}
                whileTap={{ scale: 0.95 }}
                className="fixed top-2 right-2 md:top-6 md:right-6 z-50 group w-10 h-10 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 border-2 md:border-4 border-slate-600 shadow-[0_0_20px_rgba(30,58,138,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-shadow duration-300"
            >
                {/* Inner Ring */}
                <div className="absolute inset-1 rounded-full border border-slate-500/50" />

                {/* Content */}
                <div className="flex flex-col items-center justify-center">
                    {/* Simple SVG icon for a shield/crest */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-8 md:h-8 text-nebula-400 group-hover:text-nebula-300 transition-colors">
                        <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 12c0 5.542 2.855 10.227 7.506 12.58a.75.75 0 00.749 0c4.65-2.353 7.505-7.038 7.505-12.58a12.74 12.74 0 00-.635-6.235.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden md:block text-[10px] font-cinzel font-bold text-slate-300 tracking-widest mt-1">ADMIN</span>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-colors" />
            </motion.button>
        </Link>
    );
}
