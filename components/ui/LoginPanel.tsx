"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export function LoginPanel() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Login attempt:", { username, password });
        // TODO: Implement actual login logic
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative w-full max-w-md p-8 rounded-2xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-sm group"
        >
            {/* Background Image for Panel */}
            <div
                className="absolute inset-0 z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                    backgroundImage: "url('/public/admin.webp')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />

            {/* Dark Overlay for readability */}
            <div className="absolute inset-0 z-0 bg-black/40 mix-blend-multiply" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-3xl font-cinzel text-starlight mb-8 text-shadow tracking-widest uppercase">
                    Gatekeeper Access
                </h2>

                <form onSubmit={handleLogin} className="w-full space-y-6">
                    {/* Username Input - Magical Seal Style */}
                    <div className="relative group/input">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder=" "
                            className="w-full bg-transparent border-b-2 border-white/20 text-starlight py-2 px-4 focus:outline-none focus:border-nebula-400 transition-colors duration-300 font-orbitron placeholder-transparent peer"
                        />
                        <label className="absolute left-4 top-2 text-white/50 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-nebula-400 transition-all duration-300 pointer-events-none font-cinzel">
                            Magus Identity
                        </label>
                        <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-nebula-500 transition-all duration-500 peer-focus:w-full box-shadow-glow" />
                    </div>

                    {/* Password Input */}
                    <div className="relative group/input">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder=" "
                            className="w-full bg-transparent border-b-2 border-white/20 text-starlight py-2 px-4 focus:outline-none focus:border-nebula-400 transition-colors duration-300 font-orbitron placeholder-transparent peer"
                        />
                        <label className="absolute left-4 top-2 text-white/50 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-nebula-400 transition-all duration-300 pointer-events-none font-cinzel">
                            Secret Key
                        </label>
                        <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-nebula-500 transition-all duration-500 peer-focus:w-full box-shadow-glow" />
                    </div>

                    {/* Philosopher's Stone Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full mt-8 py-3 rounded-full bg-gradient-to-r from-red-900 to-red-600 text-starlight font-bold font-cinzel tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_rgba(220,38,38,0.8)] border border-red-400/30 relative overflow-hidden group/btn"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <span>Enter the Void</span>
                            {/* Simple particle effect could go here */}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
}
