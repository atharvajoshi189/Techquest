"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagicCard } from '@/components/ui/MagicCard';
import { twMerge } from 'tailwind-merge';
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
    round2_password?: string; // New field
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

// --- Helper Functions ---
const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={twMerge(
                "px-8 py-3 font-cinzel font-bold text-lg transition-all duration-300 border-b-4",
                active
                    ? "text-burgundy border-burgundy bg-parchment/50"
                    : "text-ink-black/50 border-transparent hover:text-burgundy/70"
            )}
        >
            {children}
        </button>
    );
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'hall' | 'race'>('hall');
    const [teams, setTeams] = useState<Team[]>([]);
    const [newTeam, setNewTeam] = useState({ name: '', leader: '', passcode: '', round2_password: '' }); // Added field
    const [isGameActive, setIsGameActive] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

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
            const msg = e instanceof Error ? e.message : "Unknown error";
            alert("Failed to start game: " + msg);
        }
    };

    const handleAddTeam = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation for fixed length 8
        if (newTeam.round2_password.length !== 8) {
            alert("Round 2 Password MUST be exactly 8 characters.");
            return;
        }

        try {
            const randomHouse = HOUSES[Math.floor(Math.random() * HOUSES.length)];
            const now = Date.now();

            await addDoc(collection(db, "teams"), {
                name: newTeam.name,
                leader: newTeam.leader,
                passcode: newTeam.passcode,
                round2_password: newTeam.round2_password, // Save secret
                current_stage: 0,
                status: "active",
                house: randomHouse,
                startedAt: now,
                last_updated: serverTimestamp()
            });
            setNewTeam({ name: '', leader: '', passcode: '', round2_password: '' });
            alert(`Team Enrolled and Sorted into ${randomHouse}!`);
        } catch (err: unknown) {
            console.error(err);
            alert("Failed to enroll team: " + (err instanceof Error ? err.message : "Unknown error"));
        }
    };

    return (
        <div className="min-h-screen p-8 font-cinzel bg-parchment bg-parchment-texture text-ink-black overflow-x-hidden">
            <header className="text-center mb-10 relative">
                <h1 className="text-5xl md:text-6xl font-bold text-burgundy drop-shadow-md mb-2 text-shadow-gold">
                    The Triwizard Tournament
                </h1>
                <p className="text-xl italic font-hand opacity-80">Headmaster&apos;s Control Panel</p>

                <div className="absolute top-0 right-0 p-4">
                    <div className={`px-4 py-2 rounded-full border-2 font-bold ${isGameActive ? 'bg-green-100 border-green-600 text-green-800' : 'bg-red-100 border-red-600 text-red-800'}`}>
                        {isGameActive ? "TOURNAMENT ACTIVE" : "TOURNAMENT PAUSED"}
                    </div>
                </div>
            </header>

            <div className="flex justify-center mb-8 border-b-2 border-burgundy/20">
                <TabButton active={activeTab === 'hall'} onClick={() => setActiveTab('hall')}>
                    The Great Hall (Registration)
                </TabButton>
                <TabButton active={activeTab === 'race'} onClick={() => setActiveTab('race')}>
                    The Race (Live)
                </TabButton>
            </div>

            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode='wait'>
                    {activeTab === 'hall' ? (
                        <motion.div
                            key="hall"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                            {!isGameActive && (
                                <div className="flex justify-center py-6">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleStartGame}
                                        className="px-12 py-6 bg-gradient-to-r from-burgundy to-red-600 text-gold text-3xl font-bold border-4 border-gold rounded-lg shadow-[0_0_40px_rgba(116,0,1,0.6)] hover:shadow-[0_0_60px_rgba(212,175,55,0.8)] transition-all"
                                    >
                                        BEGIN TOURNAMENT
                                    </motion.button>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Registration Form */}
                                <MagicCard title="Enroll Champions">
                                    <form onSubmit={handleAddTeam} className="space-y-4 font-sans">
                                        <div className="grid grid-cols-1 gap-4">
                                            <input
                                                placeholder="Team Name"
                                                className="w-full p-4 bg-white/60 border-2 border-burgundy/20 rounded focus:border-gold outline-none"
                                                value={newTeam.name}
                                                onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
                                                required
                                            />
                                            <input
                                                placeholder="Leader Name"
                                                className="w-full p-4 bg-white/60 border-2 border-burgundy/20 rounded focus:border-gold outline-none"
                                                value={newTeam.leader}
                                                onChange={e => setNewTeam({ ...newTeam, leader: e.target.value })}
                                                required
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    placeholder="Login Passcode"
                                                    className="w-full p-4 bg-white/60 border-2 border-burgundy/20 rounded focus:border-gold outline-none"
                                                    value={newTeam.passcode}
                                                    onChange={e => setNewTeam({ ...newTeam, passcode: e.target.value })}
                                                    required
                                                />
                                                <input
                                                    placeholder="Round 2 Secret (8 chars)"
                                                    className="w-full p-4 bg-white/60 border-2 border-burgundy/20 rounded focus:border-gold outline-none"
                                                    value={newTeam.round2_password}
                                                    maxLength={8}
                                                    minLength={8}
                                                    onChange={e => setNewTeam({ ...newTeam, round2_password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 italic text-center">
                                            ⚠️ Round 2 Secret is critical! It will be revealed piece by piece.
                                        </div>
                                        <button className="w-full py-4 bg-ink-black text-parchment font-bold text-lg rounded shadow-lg hover:bg-ink-black/80 border-2 border-gold/50">
                                            Enroll & Sort Team
                                        </button>
                                    </form>
                                </MagicCard>

                                {/* Registered Teams List */}
                                <MagicCard title="Scroll of Participants">
                                    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                        {teams.length === 0 && <p className="text-center italic opacity-50 py-10">The scroll is blank...</p>}
                                        {sortedTeams.map(team => {
                                            const timeElapsed = team.startedAt ? currentTime - team.startedAt : 0;
                                            // Strict styling based on house
                                            const listStyle = {
                                                'Gryffindor': 'border-l-4 border-red-800 bg-red-50 hover:bg-red-100',
                                                'Slytherin': 'border-l-4 border-green-800 bg-green-50 hover:bg-green-100',
                                                'Ravenclaw': 'border-l-4 border-blue-800 bg-blue-50 hover:bg-blue-100',
                                                'Hufflepuff': 'border-l-4 border-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                                            }[team.house] || 'border-l-4 border-gray-400 bg-gray-50';

                                            return (
                                                <div key={team.id} className={`flex justify-between items-center p-4 rounded shadow-sm transition-colors ${listStyle}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-3xl" title={team.house}>{HOUSE_ICONS[team.house] || '🎓'}</div>
                                                        <div>
                                                            <div className="font-bold text-xl text-black/80">
                                                                {team.name}
                                                            </div>
                                                            <div className="text-sm opacity-70 font-sans">
                                                                {team.leader} • <span className="italic">{team.house}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-1">
                                                        <div className="font-mono text-lg font-bold text-black/60 bg-white/50 px-2 rounded">
                                                            {team.startedAt ? formatDuration(timeElapsed) : "Waiting..."}
                                                        </div>
                                                        <div className="font-mono text-xs opacity-60 bg-black/5 px-2 py-1 rounded">
                                                            Login: {team.passcode}
                                                        </div>
                                                        <div className="font-mono text-xs opacity-60 bg-red-100/50 text-red-800 px-2 py-1 rounded">
                                                            Secret: {team.round2_password}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </MagicCard>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="race"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="relative bg-black rounded-xl border-4 border-gold shadow-2xl overflow-hidden min-h-[700px] p-8"
                        >
                            <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80"></div>

                            <h2 className="relative z-10 text-4xl text-gold font-cinzel text-center mb-12 drop-shadow-lg text-shadow-gold">
                                Live Tracking: The Forbidden Forest
                            </h2>

                            <div className="relative z-10 flex flex-col gap-6">
                                {sortedTeams.map((team, index) => {
                                    const progress = (team.current_stage / 5) * 100;
                                    const houseColor = HOUSE_COLORS[team.house] || '#740001';

                                    let timeDisplay = "00:00:00";
                                    if (team.startedAt) {
                                        const start = team.startedAt;
                                        const end = team.finishedAt ? team.finishedAt.seconds * 1000 : currentTime;
                                        timeDisplay = formatDuration(end - start);
                                    }

                                    let borderColor = "border-white/10";
                                    let glow = "";
                                    if (index === 0) { borderColor = "border-yellow-400"; glow = "shadow-[0_0_20px_rgba(250,204,21,0.5)]"; }
                                    if (index === 1) { borderColor = "border-slate-300"; glow = "shadow-[0_0_15px_rgba(203,213,225,0.4)]"; }
                                    if (index === 2) { borderColor = "border-amber-700"; glow = "shadow-[0_0_10px_rgba(180,83,9,0.4)]"; }

                                    return (
                                        <motion.div
                                            key={team.id}
                                            layout
                                            transition={{ type: "spring", stiffness: 40 }}
                                            className="relative group"
                                        >
                                            <div className={`h-16 bg-black/50 backdrop-blur-sm rounded-full border ${borderColor} ${glow} flex items-center relative overflow-hidden box-content transition-colors duration-500`}>
                                                <div className="absolute left-4 z-20 text-gold font-bold text-xl drop-shadow-md w-8">
                                                    #{index + 1}
                                                </div>

                                                <div className="absolute right-4 z-20 font-mono text-white/80 text-lg bg-black/40 px-3 py-1 rounded backdrop-blur-md border border-white/5">
                                                    ⏱️ {timeDisplay}
                                                </div>

                                                <motion.div
                                                    className="absolute top-0 left-0 h-full opacity-80"
                                                    style={{ backgroundColor: houseColor }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(progress, 100)}%` }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                />

                                                <motion.div
                                                    className="absolute h-14 w-14 bg-parchment rounded-full border-2 border-gold flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.5)] z-30 text-2xl"
                                                    initial={{ left: 0 }}
                                                    animate={{ left: `calc(${Math.min(progress, 100)}% - 3.5rem)` }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                >
                                                    <span className="transform -translate-y-1">{HOUSE_ICONS[team.house] || '🧙‍♂️'}</span>
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-gold text-xs px-2 py-1 rounded border border-gold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-sans">
                                                        {team.name}
                                                    </div>
                                                </motion.div>

                                                <div className="absolute left-16 z-20 text-white font-bold tracking-wide drop-shadow-md flex items-center gap-2">
                                                    {team.name}
                                                    <span className="opacity-70 text-xs font-normal">({team.house})</span>
                                                    {team.status === 'finished' && <span className="text-emerald-400 text-xs animate-pulse">✨ FINISHED!</span>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
