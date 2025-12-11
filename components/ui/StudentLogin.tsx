"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/app/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import { DocumentData } from "firebase/firestore";

import useIsMobile from "@/hooks/useIsMobile";
import { MobileStudentLogin } from "./MobileStudentLogin";

// Candle component removed as per user request

// ---------------------------
// Main Component
// ---------------------------
export function StudentLogin({ onLoginSuccess }: { onLoginSuccess: (teamId: string, teamData: DocumentData) => void }) {
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Using Refs as requested for direct DOM access during submit
    const teamIdRef = React.useRef<HTMLInputElement>(null);
    const passcodeRef = React.useRef<HTMLInputElement>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // CRITICAL: Prevents page refresh
        setLoading(true);

        const inputName = teamIdRef.current?.value.trim() || "";
        const inputPass = passcodeRef.current?.value.trim() || "";

        console.log("Attempting Login via Firebase:", inputName);

        try {
            // 1. Create Firestore Query
            const teamsRef = collection(db, "teams");
            const q = query(
                teamsRef,
                where("name", "==", inputName),
                where("passcode", "==", inputPass)
            );

            // 2. Fetch Docs
            const querySnapshot = await getDocs(q);

            // 3. Validation Logic
            if (!querySnapshot.empty) {
                // SUCCESS
                const docSnap = querySnapshot.docs[0];
                const teamData = docSnap.data();
                const teamId = docSnap.id;

                console.log("Firebase Login Success!", teamData);

                // Save session for Dashboard persistence
                const sessionUser = {
                    teamId: teamId,
                    teamName: teamData.name,
                    leader: teamData.leader,
                    house: teamData.house,
                    path: teamData.path || 'alpha',
                    currentStage: teamData.current_stage || 0
                };
                localStorage.setItem('currentUser', JSON.stringify(sessionUser));

                // Sequence: Shake -> Open -> Trigger Parent Success
                setTimeout(() => {
                    setIsOpen(true);
                    setTimeout(() => {
                        onLoginSuccess(teamId, teamData);
                    }, 1000);
                }, 500);

            } else {
                // FAILURE
                alert("Invalid Credentials in Database! The Grimoire stays shut.");
                setLoading(false);
            }

        } catch (err) {
            console.error("Firebase Login Error:", err);
            alert("Connection to the Ether (Firebase) failed. Try again.");
            setLoading(false);
        }
    };

    if (isMobile) {
        return <MobileStudentLogin onLoginSuccess={onLoginSuccess} />;
    }

    return (
        <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">

            {/* 
        ==============================
        ATMOSPHERE: Swirling Mist
        ==============================
      */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                {/* Layer 1 */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-[100vw] h-[100vw] md:w-[800px] md:h-[800px] rounded-full bg-gradient-radial from-[#FFFDD0]/10 via-transparent to-transparent blur-[60px] md:blur-[80px] opacity-40 mix-blend-screen"
                />
                {/* Layer 2 (Counter-rotate) */}
                <motion.div
                    animate={{ rotate: -360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] rounded-full bg-gradient-radial from-[#fef3c7]/20 via-transparent to-transparent blur-[40px] md:blur-[60px] opacity-30 mix-blend-screen"
                />
            </div>

            {/* 
        ==============================
        ATMOSPHERE: Floating Candles (REMOVED)
        ==============================
      */}

            {/* 
        ==============================
        THE GRIMOIRE (3D Component)
        ==============================
      */}
            <div className="relative w-[90vw] md:w-[450px] h-[450px] md:h-[550px] perspective-1000 group z-20">
                <motion.div
                    className="relative w-full h-full transform-style-3d transition-transform duration-1000"
                    animate={isOpen ? { rotateY: -10, x: 10 } : { rotateY: 0, x: 0 }}
                    initial={{ rotateY: 0 }}
                >
                    {/* === BACK COVER / SPINE BASE === */}
                    <div className="absolute inset-0 bg-[#2d1b18] rounded-r-xl rounded-l-md shadow-2xl translate-z-[-25px] border-r border-[#1a100e]">
                        <motion.div
                            className="absolute inset-0 rounded-r-xl overflow-hidden flex items-center justify-center opacity-0 transition-opacity duration-1000 delay-500"
                            animate={{ opacity: isOpen ? 1 : 0 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-cyan-300 to-blue-600 animate-pulse-slow opacity-80" />
                        </motion.div>
                    </div>

                    {/* === BOOK SPINE === */}
                    <div className="absolute left-0 top-0 bottom-0 w-[30px] md:w-[40px] bg-gradient-to-r from-[#1a100e] via-[#3e2723] to-[#1a100e] transform rotateY(-90deg) translate-x-[-15px] md:translate-x-[-20px] rounded-l-sm flex flex-col justify-between py-8 items-center border-l border-r border-[#4e342e]">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-full h-[2px] bg-[#5d4037] shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                        ))}
                    </div>

                    {/* === FRONT COVER === */}
                    <motion.div
                        className="absolute inset-0 bg-[#3b2320] rounded-r-xl rounded-l-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] origin-left transform-style-3d backface-hidden"
                        animate={isOpen ? { rotateY: -180 } : { rotateY: 0 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                    >
                        {/* 1. Leather Texture */}
                        <div className="absolute inset-0 rounded-r-xl bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-40 mix-blend-multiply" />
                        <div className="absolute inset-0 rounded-r-xl bg-gradient-to-br from-transparent via-[#2d1b18]/50 to-black/60" />

                        {/* 2. Gold Filigree */}
                        <div className="absolute inset-2 md:inset-5 border-[2px] border-[#c5a059]/40 rounded-r-lg" />
                        <div className="absolute inset-4 md:inset-8 border-[1px] border-[#c5a059]/20 rounded-r-lg" />

                        {/* Corners */}
                        <div className="absolute top-4 right-4 w-8 h-8 md:w-16 md:h-16 border-t-2 border-r-2 border-[#daa520] rounded-tr-xl" />
                        <div className="absolute bottom-4 right-4 w-8 h-8 md:w-16 md:h-16 border-b-2 border-r-2 border-[#daa520] rounded-br-xl" />
                        <div className="absolute top-4 left-4 w-8 h-8 md:w-16 md:h-16 border-t-2 border-l-2 border-[#daa520] rounded-tl-sm" />
                        <div className="absolute bottom-4 left-4 w-8 h-8 md:w-16 md:h-16 border-b-2 border-l-2 border-[#daa520] rounded-bl-sm" />

                        {/* 3. CONTENT */}
                        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 md:p-12 space-y-4 md:space-y-8">

                            <div className="text-center mb-1 md:mb-2">
                                <h2 className="text-xl md:text-4xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#fcd34d] to-[#b45309] drop-shadow-sm tracking-widest">
                                    STUDENT<br />PORTAL
                                </h2>
                                <div className="w-16 md:w-32 h-[2px] bg-gradient-to-r from-transparent via-[#daa520] to-transparent mx-auto mt-2" />
                            </div>

                            <form onSubmit={handleLogin} className="w-full space-y-4 md:space-y-6">
                                {/* Parchment Input 1 */}
                                <div className="relative w-full group">
                                    <div className="absolute inset-0 bg-[#d7ccc8] transform rotate-[-1deg] rounded shadow-md translate-y-[2px]" />
                                    <div className="relative bg-[#f5f5f5] rounded border border-[#a1887f] shadow-inner p-1">
                                        <input
                                            ref={teamIdRef}
                                            className="w-full h-10 md:h-12 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-[#fffdf5] text-[#3e2723] font-cinzel text-sm md:text-xl px-2 py-1 md:px-4 md:py-2 outline-none placeholder-[#8d6e63]"
                                            placeholder="Team Name"
                                            required
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base md:text-2xl opacity-60">🪶</span>
                                    </div>
                                </div>

                                {/* Parchment Input 2 */}
                                <div className="relative w-full group">
                                    <div className="absolute inset-0 bg-[#d7ccc8] transform rotate-[1deg] rounded shadow-md translate-y-[2px]" />
                                    <div className="relative bg-[#f5f5f5] rounded border border-[#a1887f] shadow-inner p-1">
                                        <input
                                            ref={passcodeRef}
                                            type="password"
                                            className="w-full h-10 md:h-12 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-[#fffdf5] text-[#3e2723] font-cinzel text-sm md:text-xl px-2 py-1 md:px-4 md:py-2 outline-none placeholder-[#8d6e63]"
                                            placeholder="Secret Code"
                                            required
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base md:text-2xl opacity-60">🗝️</span>
                                    </div>
                                </div>

                                {/* Alohomora Clasp Button */}
                                <div className="pt-2 md:pt-6 flex justify-center">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        className="relative py-2 px-8 md:py-4 md:px-12 bg-gradient-to-b from-[#fcd34d] to-[#b45309] text-[#2d1b18] font-cinzel font-bold text-lg md:text-2xl rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#78350f]"
                                        disabled={loading}
                                    >
                                        <div className="absolute inset-1 border border-[#78350f]/30 rounded-full" />
                                        <div className="flex items-center gap-2">
                                            <span className="drop-shadow-sm">Alohomora</span>
                                        </div>
                                    </motion.button>
                                </div>
                            </form>
                        </div>

                        {/* Metal Clasp */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[50%] w-8 h-12 md:w-16 md:h-24 bg-gradient-to-b from-[#78350f] via-[#fcd34d] to-[#78350f] rounded-l shadow-lg flex items-center justify-center border-l border-[#5d4037]">
                            <div className="w-8 h-8 md:w-16 md:h-16 bg-[#2d1b18] rounded-full flex items-center justify-center transform scale-75 border-2 border-[#daa520]">
                                <div className="w-1.5 h-1.5 md:w-3 md:h-3 bg-[#daa520] rotate-45" />
                            </div>
                        </div>

                    </motion.div>
                </motion.div>
            </div>

            {/* Burst of Light Emitter */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full pointer-events-none z-50 text-white mix-blend-screen"
                animate={
                    isOpen
                        ? { scale: [1, 60, 250], opacity: [0, 1, 0] }
                        : { scale: 1, opacity: 0 }
                }
                transition={{ duration: 1.8, ease: "circIn", delay: 0.1 }}
                style={{ boxShadow: "0 0 100px 50px rgba(255, 253, 208, 0.9)" }}
            />

        </div>
    );
}
