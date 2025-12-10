"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    // orderBy, 
    serverTimestamp,
    doc,
    setDoc
} from "firebase/firestore";
import { MagicScroll } from '@/components/admin/MagicScroll';
import { LiveLeaderboard } from '@/components/admin/LiveLeaderboard';

// --- Interfaces & Constants ---

interface Team {
    id: string;
    name: string;
    leader: string;
    passcode: string;
    current_stage: number;
    status: string;
    house: string;
    last_updated?: { seconds: number };
    startedAt?: number;
    finishedAt?: { seconds: number };
    round2_password?: string;
    path?: 'alpha' | 'beta';
}

const HOUSES = ['Gryffindor', 'Slytherin', 'Hufflepuff', 'Ravenclaw'];

const HOUSE_COLORS: Record<string, string> = {
    'Gryffindor': '#740001',
    'Slytherin': '#1a472a',
    'Ravenclaw': '#0e1a40',
    'Hufflepuff': '#ecb939'
};

const HOUSE_ICONS: Record<string, string> = {
    'Gryffindor': '🦁',
    'Slytherin': '🐍',
    'Ravenclaw': '🦅',
    'Hufflepuff': '🦡'
};

const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// --- Main Component ---

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'registration' | 'race'>('registration');
    const [teams, setTeams] = useState<Team[]>([]);
    const [newTeam, setNewTeam] = useState({ name: '', leader: '', passcode: '', round2_password: '' });
    const [isGameActive, setIsGameActive] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    // --- Effects (Logic Preserved) ---
    useEffect(() => {
        const unsubConfig = onSnapshot(doc(db, "config", "game_settings"), (doc) => {
            if (doc.exists()) {
                setIsGameActive(doc.data().isGameActive);
            }
        });

        const q = query(collection(db, "teams"));
        const unsubTeams = onSnapshot(q, (snapshot) => {
            const teamsData: Team[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Team));
            setTeams(teamsData);
        });

        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);

        return () => {
            unsubConfig();
            unsubTeams();
            clearInterval(timer);
        };
    }, []);

    const sortedTeams = [...teams].sort((a, b) => {
        if (a.current_stage !== b.current_stage) {
            return b.current_stage - a.current_stage;
        }
        const aTime = a.last_updated?.seconds || Number.MAX_SAFE_INTEGER;
        const bTime = b.last_updated?.seconds || Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
    });

    const handleStartGame = async () => {
        if (!confirm("Are you sure you want to BEGIN THE TOURNAMENT?")) return;
        try {
            await setDoc(doc(db, "config", "game_settings"), { isGameActive: true }, { merge: true });
            alert("The Tournament has begun!");
        } catch (e: unknown) {
            console.error(e);
            alert("Failed to start game.");
        }
    };

    const handleAddTeam = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation Logic
        if (!newTeam.name || !newTeam.leader || !newTeam.passcode) {
            alert("Please fill in all details.");
            return;
        }

        if (newTeam.round2_password.length !== 8) {
            alert("Round 2 Password MUST be exactly 8 characters.");
            return;
        }

        try {
            // 2. The Sorting Hat (Random House Allocation)
            const HOUSES = ['Gryffindor', 'Slytherin', 'Ravenclaw', 'Hufflepuff'];
            const randomIndex = Math.floor(Math.random() * HOUSES.length);
            const assignedHouse = HOUSES[randomIndex];

            const assignedPath = Math.random() < 0.5 ? 'alpha' : 'beta';

            const now = Date.now();

            // 3. Create Team Object
            await addDoc(collection(db, "teams"), {
                name: newTeam.name,
                leader: newTeam.leader,
                passcode: newTeam.passcode,
                round2_password: newTeam.round2_password,
                current_stage: 0,
                status: "active",
                house: assignedHouse,
                path: assignedPath, // Saved to Firestore
                startedAt: now,
                last_updated: serverTimestamp()
            });

            setNewTeam({ name: '', leader: '', passcode: '', round2_password: '' });
            alert("Team Saved to Firebase Cloud!");
        } catch (err: unknown) {
            console.error(err);
            alert("Failed to enroll team.");
        }
    };


    return (
        <div className="min-h-screen relative overflow-hidden font-cinzel text-starlight">

            {/* 1. Background: Deep Space Nebula (Unsplash) */}
            <div className="absolute inset-0 z-0 bg-black">
                <div
                    className="absolute inset-0 z-0 opacity-80"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=3872&auto=format&fit=crop')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 mix-blend-multiply" />
            </div>

            {/* 2. Floating Obsidian Tablet Container */}
            <div className="relative z-10 w-full min-h-screen p-4 flex flex-col items-center">

                {/* Header Section */}
                <header className="w-full max-w-7xl flex flex-col items-center mb-8 mt-4 px-8 py-6 rounded-2xl bg-[#0a0a0c]/80 backdrop-blur-md border border-[#c5a059]/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] border-t-[#c5a059]/50">
                    <div className="w-full flex justify-between items-center mb-6">
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fcd34d] via-[#fef3c7] to-[#b45309] drop-shadow-sm tracking-wide">
                                THE TRIWIZARD TOURNAMENT
                            </h1>
                            <p className="text-[#a8a29e] text-lg tracking-[0.2em] font-orbitron mt-1">
                                HEADMASTER&apos;S CONTROL PANEL
                            </p>
                        </div>

                        {/* Crystal Orb Status */}
                        <div className="relative group cursor-pointer" onClick={isGameActive ? undefined : handleStartGame}>
                            <div className={`w-16 h-16 rounded-full border-4 ${isGameActive ? 'border-green-500 bg-green-900/50' : 'border-red-500 bg-red-900/50'} shadow-[0_0_20px_currentColor] flex items-center justify-center relative overflow-hidden transition-all duration-500`}>
                                <div className={`absolute inset-0 ${isGameActive ? 'bg-green-400' : 'bg-red-500'} blur-xl opacity-40 animate-pulse`} />
                                {/* Crystal Reflection */}
                                <div className="absolute top-2 right-3 w-4 h-3 bg-white/40 rounded-full blur-[2px]" />
                                <span className="relative z-10 text-2xl">{isGameActive ? '⚡' : '🔒'}</span>
                            </div>
                            <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest uppercase whitespace-nowrap px-2 py-1 rounded bg-black/80 border ${isGameActive ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
                                {isGameActive ? "Active" : "Paused"}
                            </div>
                        </div>
                    </div>

                    {/* TAB NAVIGATION */}
                    <div className="flex gap-8 border-b border-white/10 w-full justify-center md:justify-start">
                        <button
                            onClick={() => setActiveTab('registration')}
                            className={`pb-3 text-lg font-bold tracking-wider transition-all duration-300 relative ${activeTab === 'registration'
                                ? 'text-[#fcd34d] drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            The Great Hall (Registration)
                            {activeTab === 'registration' && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-[#fcd34d] shadow-[0_0_10px_#fcd34d]" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('race')}
                            className={`pb-3 text-lg font-bold tracking-wider transition-all duration-300 relative ${activeTab === 'race'
                                ? 'text-[#fcd34d] drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            The Race (Live)
                            {activeTab === 'race' && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-[#fcd34d] shadow-[0_0_10px_#fcd34d]" />
                            )}
                        </button>
                    </div>
                </header>


                {/* Main Content Area */}
                <div className="w-full max-w-7xl h-full">
                    <AnimatePresence mode="wait">
                        {activeTab === 'registration' ? (
                            <motion.div
                                key="registration"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-12"
                            >
                                {/* LEFT PANEL: The Grimoire (Enroll Form) */}
                                <div className="relative">
                                    <div
                                        className="bg-[#2d1b18] rounded-r-3xl rounded-l-md p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-r-8 border-[#1a100e] relative min-h-[600px] flex flex-col"
                                        style={{
                                            backgroundImage: "linear-gradient(to right, #1a100e 0%, #2d1b18 5%, #3e2723 100%)"
                                        }}
                                    >
                                        {/* Leather Texture */}
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30 mix-blend-multiply rounded-r-3xl pointer-events-none" />
                                        {/* Gold Corners */}
                                        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#b45309] rounded-tr-2xl" />
                                        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#b45309] rounded-br-2xl" />

                                        <h2 className="text-3xl font-bold text-[#f97316] mb-8 text-center drop-shadow-md border-b-2 border-[#f97316]/20 pb-4 mx-8 relative z-10">
                                            Enroll Champions
                                        </h2>

                                        <form onSubmit={handleAddTeam} className="space-y-6 relative z-10 px-4">
                                            {/* Floating Parchment Inputs */}
                                            {['name', 'leader', 'passcode'].map((field) => (
                                                <div key={field} className="relative group">
                                                    <div className="absolute inset-0 bg-white/10 blur-sm rounded translate-y-1" />
                                                    <input
                                                        // @ts-ignore
                                                        value={newTeam[field as keyof typeof newTeam]}
                                                        // @ts-ignore
                                                        onChange={(e) => setNewTeam({ ...newTeam, [field]: e.target.value })}
                                                        placeholder={field === 'name' ? 'House/Team Name' : field.charAt(0).toUpperCase() + field.slice(1)}
                                                        className="w-full bg-[#f5e6c8] text-[#3e2723] font-hand placeholder-[#8d6e63] text-xl p-3 rounded shadow-md border-2 border-[#d7ccc8] focus:border-[#f97316] outline-none transform transition-transform focus:-translate-y-1 focus:shadow-lg"
                                                        style={{ fontFamily: 'cursive' }} // Fallback/Basic handwriting feel
                                                        required
                                                    />
                                                </div>
                                            ))}

                                            {/* Secret Field */}
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-red-500/10 blur-sm rounded translate-y-1" />
                                                <input
                                                    value={newTeam.round2_password}
                                                    onChange={(e) => setNewTeam({ ...newTeam, round2_password: e.target.value })}
                                                    placeholder="Round 2 Secret (8 chars)"
                                                    className="w-full bg-[#ffccbc] text-[#bf360c] font-hand placeholder-[#ffab91] text-xl p-3 rounded shadow-md border-2 border-[#ffab91] focus:border-[#d84315] outline-none transform transition-transform focus:-translate-y-1 focus:shadow-lg"
                                                    style={{ fontFamily: 'cursive' }}
                                                    maxLength={8}
                                                    minLength={8}
                                                    required
                                                />
                                            </div>

                                            {/* Warning Embers */}
                                            <div className="text-center text-[#fca5a5] text-sm italic font-sans bg-black/20 p-2 rounded animate-pulse">
                                                ⚠️ The Secret is the key to the final mystery.
                                            </div>

                                            {/* Brass Plaque Button */}
                                            <motion.button
                                                whileHover={{ scale: 1.02, textShadow: "0 0 8px #fcd34d" }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-4 mt-6 bg-gradient-to-b from-[#b45309] to-[#78350f] rounded-lg border-2 border-[#fcd34d] shadow-[0_4px_0_#451a03] active:shadow-none active:translate-y-1 transition-all relative overflow-hidden group"
                                            >
                                                <div className="absolute inset-0 bg-[#fcd34d]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center justify-center gap-3 text-[#fef3c7] font-bold text-xl uppercase tracking-widest">
                                                    <span className="text-2xl">🦁</span> Enroll & Sort
                                                    <span className="text-2xl">🦁</span>
                                                </div>
                                            </motion.button>
                                        </form>
                                    </div>
                                </div>

                                {/* RIGHT PANEL: The Magic Scroll (List) */}
                                <div className="h-[750px] relative">
                                    <MagicScroll title="Scroll of Participants">
                                        {teams.length === 0 && (
                                            <div className="text-center py-10 opacity-50 italic text-[#5d4037]">
                                                The scroll awaits its first name...
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-4">
                                            <AnimatePresence>
                                                {sortedTeams.map((team) => {
                                                    const timeElapsed = team.startedAt ? currentTime - team.startedAt : 0;
                                                    return (
                                                        <motion.div
                                                            key={team.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            className="relative bg-[#d7ccc8] p-4 rounded-md shadow-md border border-[#a1887f] flex justify-between items-center group overflow-hidden"
                                                        >
                                                            {/* Burnt edges effect using simple gradients */}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-[#3e2723]/20 via-transparent to-[#3e2723]/20 pointer-events-none" />

                                                            <div className="flex items-center gap-4 relative z-10">
                                                                {/* House Crest */}
                                                                <div
                                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-opacity-50"
                                                                    style={{
                                                                        backgroundColor: HOUSE_COLORS[team.house] + '20', // Low opacity bg
                                                                        borderColor: HOUSE_COLORS[team.house]
                                                                    }}
                                                                >
                                                                    {HOUSE_ICONS[team.house] || '✨'}
                                                                </div>

                                                                <div>
                                                                    <h4 className="font-bold text-[#3e2723] text-lg">{team.name}</h4>
                                                                    <p className="text-xs text-[#5d4037] font-sans uppercase tracking-wide">
                                                                        {team.leader} • <span style={{ color: HOUSE_COLORS[team.house] }} className="font-bold">{team.house}</span>
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="text-right relative z-10">
                                                                <div className="font-mono text-lg font-bold text-[#3e2723] bg-[#efebe9] px-2 py-1 rounded inline-block shadow-inner mb-1">
                                                                    {team.startedAt ? formatDuration(timeElapsed) : "WAITING"}
                                                                </div>
                                                                <div className="flex flex-col gap-1 text-[10px] uppercase font-bold text-[#8d6e63]">
                                                                    <span>Code: {team.passcode}</span>
                                                                    <span>Secret: {team.round2_password}</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    </MagicScroll>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="race"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <LiveLeaderboard teams={teams} currentTime={currentTime} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Ambient Particles */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-amber-200 rounded-full animate-pulse"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${Math.random() * 3 + 2}s`
                        }}
                    />
                ))}
            </div>

        </div>
    );
}
