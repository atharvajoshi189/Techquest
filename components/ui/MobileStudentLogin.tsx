import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { db } from "@/app/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";

interface MobileStudentLoginProps {
    onLoginSuccess: (teamId: string, teamData: DocumentData) => void;
}

export function MobileStudentLogin({ onLoginSuccess }: MobileStudentLoginProps) {
    const [loading, setLoading] = useState(false);
    const teamIdRef = useRef<HTMLInputElement>(null);
    const passcodeRef = useRef<HTMLInputElement>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const inputName = teamIdRef.current?.value.trim() || "";
        const inputPass = passcodeRef.current?.value.trim() || "";

        try {
            const teamsRef = collection(db, "teams");
            const q = query(
                teamsRef,
                where("name", "==", inputName),
                where("passcode", "==", inputPass)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                const teamData = docSnap.data();
                const teamId = docSnap.id;

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

                onLoginSuccess(teamId, teamData);
            } else {
                alert("The Scroll rejects these words (Invalid Credentials).");
                setLoading(false);
            }

        } catch (err) {
            console.error("Firebase Login Error:", err);
            alert("The connection to the Network is severed.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 overflow-hidden font-cinzel">

            {/* 1. BACKGROUND: Cosmos + Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/admin.webp"
                    alt="Cosmos Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

                {/* Subtle Dust/Stars Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse-slow" />
            </div>

            {/* 3. MAIN CONTAINER: The Ancient Scroll */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6">

                {/* HEADER IMAGE */}
                <img
                    src="/Technex_26_name.webp"
                    alt="Technex 25"
                    className="w-64 mx-auto mt-2 mb-6 drop-shadow-[0_2px_10px_rgba(252,211,77,0.3)] relative z-20"
                />

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="w-full max-w-sm relative group"
                >
                    {/* Floating Animation Wrapper */}
                    <div className="animate-float">

                        {/* Glow Behind */}
                        <div className="absolute -inset-4 bg-[#daa520]/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-1000" />

                        {/* SCROLL BODY */}
                        <div className="relative bg-[#eaddcf] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#a1887f]">

                            {/* Texture & Burnt Edges */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-80 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-gradient-to-b from-[#5d4037]/20 via-transparent to-[#5d4037]/40 pointer-events-none" />
                            <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(62,39,35,0.4)] pointer-events-none rounded-xl" />

                            {/* Runes Background (Decor) */}
                            <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center overflow-hidden">
                                <span className="text-9xl text-[#3e2723] rotate-12 select-none">⚡</span>
                            </div>

                            {/* SCROLL CONTENT */}
                            <div className="relative z-20 p-8 flex flex-col items-center space-y-8">

                                {/* Title */}
                                <div className="text-center space-y-2">
                                    <div className="text-[#5d4037] text-4xl mb-2">📜</div>
                                    <h3 className="text-2xl font-bold text-[#3e2723] tracking-widest drop-shadow-sm border-b-2 border-[#8d6e63]/30 pb-2">
                                        CHAMPION LOGIN
                                    </h3>
                                    <p className="text-[#5d4037]/70 text-[10px] tracking-wider uppercase">
                                        Identify Thyself, Wizard
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleLogin} className="w-full space-y-6">

                                    {/* Input: Team Name */}
                                    <div className="relative group/input">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#8d6e63] group-focus-within/input:text-[#b45309] transition-colors">
                                            🛡️
                                        </div>
                                        <input
                                            ref={teamIdRef}
                                            className="w-full bg-[#3e2723]/5 border-b-2 border-[#a1887f] focus:border-[#b45309] text-[#3e2723] px-10 py-3 text-lg font-bold placeholder-[#8d6e63]/60 outline-none transition-all rounded-t bg-gradient-to-t from-[#3e2723]/5 to-transparent"
                                            placeholder="Team Name"
                                            required
                                        />
                                    </div>

                                    {/* Input: Secret Code */}
                                    <div className="relative group/input">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#8d6e63] group-focus-within/input:text-[#b45309] transition-colors">
                                            🗝️
                                        </div>
                                        <input
                                            ref={passcodeRef}
                                            type="password"
                                            className="w-full bg-[#3e2723]/5 border-b-2 border-[#a1887f] focus:border-[#b45309] text-[#3e2723] px-10 py-3 text-lg font-bold placeholder-[#8d6e63]/60 outline-none transition-all rounded-t bg-gradient-to-t from-[#3e2723]/5 to-transparent"
                                            placeholder="Secret Code"
                                            required
                                        />
                                    </div>

                                    {/* Spacer */}
                                    <div className="h-4" />

                                    {/* Button: Enchanted Amulet */}
                                    <div className="flex justify-center">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            disabled={loading}
                                            className="relative group/btn"
                                        >
                                            <div className="absolute inset-0 bg-[#daa520] blur-md opacity-40 group-hover/btn:opacity-70 transition-opacity" />

                                            <div className="relative px-8 py-3 bg-gradient-to-b from-[#fcd34d] to-[#b45309] rounded-full border-2 border-[#78350f] shadow-[0_4px_0_#5d4037] active:shadow-none active:translate-y-[4px] transition-all flex items-center gap-2">
                                                <span className="text-[#2d1b18] font-bold text-xl tracking-widest drop-shadow-sm">
                                                    ALOHOMORA
                                                </span>
                                                <span className="text-xl">✨</span>
                                            </div>
                                        </motion.button>
                                    </div>

                                </form>
                            </div>
                        </div>

                        {/* Bottom Decoration: Wax Seal */}
                        <div className="absolute -bottom-6 -right-4 w-16 h-16 bg-gradient-to-br from-[#ef4444] to-[#7f1d1d] rounded-full shadow-lg border-4 border-[#7f1d1d]/50 flex items-center justify-center transform rotate-12">
                            <div className="w-10 h-10 border border-[#7f1d1d] rounded-full flex items-center justify-center opacity-60">
                                <span className="text-2xl text-[#fca5a5] font-serif">T</span>
                            </div>
                        </div>

                    </div>
                </motion.div>

                {/* Footer text */}
                <div className="absolute bottom-6 text-white/30 text-[10px] tracking-widest font-sans">
                    SVPCET • TECHQUEST 2025
                </div>

            </div>
        </div>
    );
}
