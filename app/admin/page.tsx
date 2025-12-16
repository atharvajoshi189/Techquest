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
    setDoc,
    writeBatch,
    where,
    updateDoc,
    getDocs // Added for Smart Allocation
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

    path?: 'alpha' | 'beta' | 'gamma' | 'delta' | 'charlie' | 'bravo' | 'theta' | 'omega';
    score?: number;
}



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
    const [activeTab, setActiveTab] = useState<'registration' | 'race' | 'runes'>('registration');
    const [teams, setTeams] = useState<Team[]>([]);
    const [newTeam, setNewTeam] = useState({ name: '', leader: '', passcode: '' });
    const [isGameActive, setIsGameActive] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [tournamentStartTime, setTournamentStartTime] = useState<number | null>(null);
    const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
    const [runePath, setRunePath] = useState<'alpha' | 'beta' | 'gamma' | 'delta' | 'charlie' | 'bravo' | 'theta' | 'omega'>('alpha');
    const [runeStage, setRuneStage] = useState(1);

    // --- Authentication State ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminPasswordInput, setAdminPasswordInput] = useState('');

    // --- Effects (Logic Preserved) ---
    useEffect(() => {
        if (!isAuthenticated) return; // Only subscribe if authenticated

        // Listen to Config Metadata (Session Management)
        const unsubConfig = onSnapshot(doc(db, "config", "metadata"), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setIsGameActive(data.isStarted);
                setTournamentStartTime(data.startTime ? data.startTime.toMillis() : null);
                setActiveTournamentId(data.activeTournamentId);
            }
        });

        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);

        return () => {
            unsubConfig();
            clearInterval(timer);
        };
    }, [isAuthenticated]);

    // Separate Effect for Teams (Depends on Tournament ID)
    useEffect(() => {
        if (!isAuthenticated || !activeTournamentId) return;

        const q = query(collection(db, "teams"), where("tournamentId", "==", activeTournamentId));
        const unsubTeams = onSnapshot(q, (snapshot) => {
            const teamsData: Team[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Team));
            setTeams(teamsData);
        });

        return () => unsubTeams();
    }, [isAuthenticated, activeTournamentId]);

    const sortedTeams = [...teams].sort((a, b) => {
        if (a.current_stage !== b.current_stage) {
            return b.current_stage - a.current_stage;
        }
        const aTime = a.last_updated?.seconds || Number.MAX_SAFE_INTEGER;
        const bTime = b.last_updated?.seconds || Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
    });

    const handleStartGame = async () => {
        if (teams.length === 0) return;
        if (!confirm("Are you sure you want to BEGIN THE TOURNAMENT?")) return;
        try {
            await updateDoc(doc(db, "config", "metadata"), {
                isStarted: true,
                startTime: serverTimestamp()
            });
            alert("The Tournament has begun!");
        } catch (e: unknown) {
            console.error(e);
            alert("Failed to start game.");
        }
    };

    const handleNewTournament = async () => {
        if (!confirm("START NEW SESSION? This will clear the current board (Data is saved).")) return;

        const newTourneyId = "T_" + Date.now();
        console.log("Generating New Tournament Session:", newTourneyId);

        try {
            await setDoc(doc(db, "config", "metadata"), {
                activeTournamentId: newTourneyId,
                isStarted: false,
                startTime: null // Explicitly wipe start time
            });
            alert(`New Session Started: ${newTourneyId}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create new session.");
        }
    };

    const handleAddTeam = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation Logic
        if (!newTeam.name || !newTeam.leader || !newTeam.passcode) {
            alert("Please fill in all details.");
            return;
        }



        try {
            if (!activeTournamentId) {
                alert("No Active Tournament Session! Click 'New Tournament' first.");
                return;
            }

            // 2. The Sorting Hat (Smart Balanced Allocation - Equal Distribution)
            const HOUSES = ['Gryffindor', 'Slytherin', 'Ravenclaw', 'Hufflepuff'];
            const ALL_PATHS: ('alpha' | 'beta' | 'gamma' | 'delta' | 'charlie' | 'bravo' | 'theta' | 'omega')[] = ['alpha', 'beta', 'gamma', 'delta', 'charlie', 'bravo', 'theta', 'omega'];

            // A. Fetch existing teams in this tournament
            const q = query(collection(db, 'teams'), where('tournamentId', '==', activeTournamentId));
            const snapshot = await getDocs(q);
            const existingTeams = snapshot.docs.map(doc => doc.data() as Team);

            // B. Count House Usage (Balanced Distribution)
            const houseCounts: Record<string, number> = { Gryffindor: 0, Slytherin: 0, Ravenclaw: 0, Hufflepuff: 0 };
            existingTeams.forEach(t => {
                if (t.house && houseCounts[t.house] !== undefined) {
                    houseCounts[t.house]++;
                }
            });

            // C. Find Minimum House Count
            const minHouseCount = Math.min(...Object.values(houseCounts));

            // D. Get Least Used Houses (for balanced distribution)
            const leastUsedHouses = HOUSES.filter(h => houseCounts[h] === minHouseCount);

            // E. Pick Randomly from Least Used Houses
            const randomHouseIndex = Math.floor(Math.random() * leastUsedHouses.length);
            const assignedHouse = leastUsedHouses[randomHouseIndex];

            // F. Count Path Usage (Balanced Distribution)
            const pathCounts: Record<string, number> = { alpha: 0, beta: 0, gamma: 0, delta: 0, charlie: 0, bravo: 0, theta: 0, omega: 0 };
            existingTeams.forEach(t => {
                if (t.path && pathCounts[t.path] !== undefined) {
                    pathCounts[t.path]++;
                }
            });

            console.log("Current House Distribution:", houseCounts);
            console.log("Current Path Distribution:", pathCounts);

            // G. Find Minimum Path Count
            const minPathCount = Math.min(...Object.values(pathCounts));

            // H. Get Least Used Paths
            const leastUsedPaths = ALL_PATHS.filter(p => pathCounts[p] === minPathCount);

            // I. Pick Randomly from Least Used Paths
            const randomPathIndex = Math.floor(Math.random() * leastUsedPaths.length);
            const assignedPath = leastUsedPaths[randomPathIndex];

            console.log(`Allocation Roll -> House: ${assignedHouse} (from ${leastUsedHouses.join(', ')}), Path: ${assignedPath} (from ${leastUsedPaths.join(', ')})`);


            const now = Date.now();

            // 3. Create Team Object
            await addDoc(collection(db, "teams"), {
                name: newTeam.name,
                leader: newTeam.leader,
                passcode: newTeam.passcode,

                current_stage: 1, // Start at Stage 1
                status: "active",
                house: assignedHouse,
                path: assignedPath,
                startedAt: now,
                createdAt: serverTimestamp(), // Added for accurate Late Joiner Logic
                score: 0,
                last_updated: serverTimestamp(),
                tournamentId: activeTournamentId // Session Link
            });

            setNewTeam({ name: '', leader: '', passcode: '' });
            alert("Team Saved to Firebase Cloud!");
        } catch (err: unknown) {
            console.error(err);
            alert("Failed to enroll team.");
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminPasswordInput === 'Techquest_25') {
            setIsAuthenticated(true);
        } else {
            alert("Access Denied: The spell was incorrect.");
            setAdminPasswordInput('');
        }
    };


    if (!isAuthenticated) {
        return (
            <div className="min-h-screen relative overflow-hidden font-cinzel text-starlight flex items-center justify-center bg-black">
                {/* Background: Deep Space Nebula (Unsplash) */}
                <div className="absolute inset-0 z-0 opacity-60">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=3872&auto=format&fit=crop')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                <div className="relative z-10 p-8 rounded-2xl bg-[#0a0a0c]/80 backdrop-blur-md border border-[#c5a059]/30 shadow-[0_0_50px_rgba(197,160,89,0.2)] text-center space-y-6 max-w-md w-full mx-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fcd34d] via-[#fef3c7] to-[#b45309]">
                        RESTRICTED AREA
                    </h1>
                    <p className="text-[#a8a29e] tracking-widest text-sm">HEADMASTER AUTHORIZATION REQUIRED</p>

                    <form onSubmit={handleLogin} className="space-y-4 pt-4">
                        <input
                            type="password"
                            value={adminPasswordInput}
                            onChange={(e) => setAdminPasswordInput(e.target.value)}
                            placeholder="Speak the Password"
                            className="w-full bg-black/50 border border-[#c5a059]/40 rounded p-3 text-center text-[#fcd34d] placeholder-[#c5a059]/30 focus:border-[#fcd34d] outline-none transition-colors"
                        />
                        <button type="submit" className="w-full bg-[#c5a059]/10 hover:bg-[#c5a059]/20 border border-[#c5a059]/50 text-[#fcd34d] py-3 rounded font-bold tracking-widest transition-all uppercase text-sm">
                            Unlock Portal
                        </button>
                    </form>
                </div>
            </div>
        );
    }

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
            <div className="relative z-10 w-full min-h-screen p-2 md:p-4 flex flex-col items-center">

                {/* Header Section */}
                <header className="w-full max-w-7xl flex flex-col items-center mb-4 md:mb-8 mt-2 md:mt-4 px-4 py-4 md:px-8 md:py-6 rounded-2xl bg-[#0a0a0c]/80 backdrop-blur-md border border-[#c5a059]/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] border-t-[#c5a059]/50">
                    <div className="w-full flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-4 md:gap-0">
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fcd34d] via-[#fef3c7] to-[#b45309] drop-shadow-sm tracking-wide">
                                THE TRIWIZARD TOURNAMENT
                            </h1>
                            <p className="text-[#a8a29e] text-xs md:text-lg tracking-[0.2em] font-orbitron mt-1">
                                HEADMASTER&apos;S CONTROL PANEL
                            </p>
                        </div>

                        {/* Crystal Orb Status */}
                        <div className="relative group cursor-pointer" onClick={isGameActive ? undefined : handleStartGame}>
                            {/* Pulsing Start Button */}
                            {teams.length > 0 && !isGameActive ? (
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-green-500 bg-green-900/50 shadow-[0_0_30px_#22c55e] flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105 active:scale-95 animate-pulse">
                                    <span className="text-2xl md:text-3xl">🚀</span>
                                </div>
                            ) : (
                                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-4 ${isGameActive ? 'border-green-500 bg-green-900/50' : 'border-red-500 bg-red-900/50'} shadow-[0_0_20px_currentColor] flex items-center justify-center relative overflow-hidden transition-all duration-500`}>
                                    <div className={`absolute inset-0 ${isGameActive ? 'bg-green-400' : 'bg-red-500'} blur-xl opacity-40 animate-pulse`} />
                                    {/* Crystal Reflection */}
                                    <div className="absolute top-2 right-3 w-4 h-3 bg-white/40 rounded-full blur-[2px]" />
                                    <span className="relative z-10 text-lg md:text-2xl">{isGameActive ? '⚡' : '🔒'}</span>
                                </div>
                            )}

                            <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold tracking-widest uppercase whitespace-nowrap px-2 py-1 rounded bg-black/80 border ${isGameActive ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
                                {isGameActive ? "Active" : teams.length === 0 ? "No Teams" : "Start Race"}
                            </div>
                        </div>
                    </div>

                    {/* New Tournament Button */}
                    <button
                        onClick={handleNewTournament}
                        className="mt-4 md:mt-0 md:ml-6 px-4 py-2 border border-blue-500/50 bg-blue-900/20 text-blue-400 text-xs font-bold tracking-widest hover:bg-blue-900/40 rounded transition-colors uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    >
                        New Tournament
                    </button>


                    {/* TAB NAVIGATION */}
                    <div className="flex gap-4 md:gap-8 border-b border-white/10 w-full justify-center md:justify-start overflow-x-auto pb-1">
                        <button
                            onClick={() => setActiveTab('registration')}
                            className={`pb-2 md:pb-3 text-sm md:text-lg font-bold tracking-wider transition-all duration-300 relative whitespace-nowrap ${activeTab === 'registration'
                                ? 'text-[#fcd34d] drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            The Great Hall
                            {activeTab === 'registration' && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-[#fcd34d] shadow-[0_0_10px_#fcd34d]" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('race')}
                            className={`pb-2 md:pb-3 text-sm md:text-lg font-bold tracking-wider transition-all duration-300 relative whitespace-nowrap ${activeTab === 'race'
                                ? 'text-[#fcd34d] drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            The Race (Live)
                            {activeTab === 'race' && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-[#fcd34d] shadow-[0_0_10px_#fcd34d]" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('runes')}
                            className={`pb-2 md:pb-3 text-sm md:text-lg font-bold tracking-wider transition-all duration-300 relative whitespace-nowrap ${activeTab === 'runes'
                                ? 'text-[#fcd34d] drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            Rune Forge
                            {activeTab === 'runes' && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-[#fcd34d] shadow-[0_0_10px_#fcd34d]" />
                            )}
                        </button>
                    </div>
                </header>


                {/* Main Content Area */}
                <div className="w-full max-w-7xl h-full pb-10">
                    <AnimatePresence mode="wait">
                        {activeTab === 'registration' ? (
                            <motion.div
                                key="registration"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12"
                            >
                                {/* LEFT PANEL: The Grimoire (Enroll Form) */}
                                <div className="relative">
                                    <div
                                        className="bg-[#2d1b18] rounded-r-3xl rounded-l-md p-4 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-r-4 md:border-r-8 border-[#1a100e] relative min-h-[500px] md:min-h-[600px] flex flex-col"
                                        style={{
                                            backgroundImage: "linear-gradient(to right, #1a100e 0%, #2d1b18 5%, #3e2723 100%)"
                                        }}
                                    >
                                        {/* Leather Texture */}
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30 mix-blend-multiply rounded-r-3xl pointer-events-none" />
                                        {/* Gold Corners */}
                                        <div className="absolute top-4 right-4 w-12 h-12 md:w-16 md:h-16 border-t-4 border-r-4 border-[#b45309] rounded-tr-2xl" />
                                        <div className="absolute bottom-4 right-4 w-12 h-12 md:w-16 md:h-16 border-b-4 border-r-4 border-[#b45309] rounded-br-2xl" />

                                        <h2 className="text-2xl md:text-3xl font-bold text-[#f97316] mb-6 md:mb-8 text-center drop-shadow-md border-b-2 border-[#f97316]/20 pb-4 mx-4 md:mx-8 relative z-10">
                                            Enroll Champions
                                        </h2>

                                        <form onSubmit={handleAddTeam} className="space-y-4 md:space-y-6 relative z-10 px-2 md:px-4">
                                            {/* Floating Parchment Inputs */}
                                            {['name', 'leader', 'passcode'].map((field) => (
                                                <div key={field} className="relative group">
                                                    <div className="absolute inset-0 bg-white/10 blur-sm rounded translate-y-1" />
                                                    <input
                                                        value={newTeam[field as keyof typeof newTeam]}
                                                        onChange={(e) => setNewTeam({ ...newTeam, [field]: e.target.value })}
                                                        placeholder={field === 'name' ? 'House/Team Name' : field.charAt(0).toUpperCase() + field.slice(1)}
                                                        className="w-full bg-[#f5e6c8] text-[#3e2723] font-hand placeholder-[#8d6e63] text-lg md:text-xl p-3 rounded shadow-md border-2 border-[#d7ccc8] focus:border-[#f97316] outline-none transform transition-transform focus:-translate-y-1 focus:shadow-lg"
                                                        style={{ fontFamily: 'cursive' }} // Fallback/Basic handwriting feel
                                                        required
                                                    />
                                                </div>
                                            ))}



                                            {/* Brass Plaque Button */}
                                            <motion.button
                                                whileHover={{ scale: 1.02, textShadow: "0 0 8px #fcd34d" }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-3 md:py-4 mt-4 md:mt-6 bg-gradient-to-b from-[#b45309] to-[#78350f] rounded-lg border-2 border-[#fcd34d] shadow-[0_4px_0_#451a03] active:shadow-none active:translate-y-1 transition-all relative overflow-hidden group"
                                            >
                                                <div className="absolute inset-0 bg-[#fcd34d]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center justify-center gap-3 text-[#fef3c7] font-bold text-lg md:text-xl uppercase tracking-widest">
                                                    <span className="text-xl md:text-2xl">🦁</span> Enroll & Sort
                                                    <span className="text-xl md:text-2xl">🦁</span>
                                                </div>
                                            </motion.button>
                                        </form>
                                    </div>
                                </div>

                                {/* RIGHT PANEL: The Magic Scroll (List) */}
                                <div className="h-[500px] md:h-[750px] relative">
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
                                                            className="relative bg-[#d7ccc8] p-3 md:p-4 rounded-md shadow-md border border-[#a1887f] flex justify-between items-center group overflow-hidden"
                                                        >
                                                            {/* Burnt edges effect using simple gradients */}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-[#3e2723]/20 via-transparent to-[#3e2723]/20 pointer-events-none" />

                                                            <div className="flex items-center gap-2 md:gap-4 relative z-10">
                                                                {/* House Crest */}
                                                                <div
                                                                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-2xl shadow-inner border-2 border-opacity-50"
                                                                    style={{
                                                                        backgroundColor: HOUSE_COLORS[team.house] + '20', // Low opacity bg
                                                                        borderColor: HOUSE_COLORS[team.house]
                                                                    }}
                                                                >
                                                                    {HOUSE_ICONS[team.house] || '✨'}
                                                                </div>

                                                                <div>
                                                                    <h4 className="font-bold text-[#3e2723] text-sm md:text-lg">{team.name}</h4>
                                                                    <p className="text-[10px] md:text-xs text-[#5d4037] font-sans uppercase tracking-wide">
                                                                        {team.leader} • <span style={{ color: HOUSE_COLORS[team.house] }} className="font-bold">{team.house}</span>
                                                                        <span className="ml-2 text-[10px] md:text-xs font-bold text-yellow-500/80 tracking-widest">
                                                                            • PATH: {team.path?.toUpperCase() || 'N/A'}
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="text-right relative z-10">
                                                                <div className="font-mono text-sm md:text-lg font-bold text-[#3e2723] bg-[#efebe9] px-2 py-1 rounded inline-block shadow-inner mb-1">
                                                                    {team.startedAt ? formatDuration(timeElapsed) : "WAITING"}
                                                                </div>
                                                                <div className="flex flex-col gap-1 text-[8px] md:text-[10px] uppercase font-bold text-[#8d6e63]">
                                                                    <span>Code: {team.passcode}</span>

                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    </MagicScroll>
                                </div>
                                <details className="mt-12 opacity-50 hover:opacity-100 transition-opacity open:opacity-100">
                                    <summary className="text-[#a8a29e] text-sm uppercase tracking-widest mb-4 border-b border-white/10 pb-2 cursor-pointer select-none">Previous Tournaments</summary>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {teams.filter(t => t.status === 'archived').map(t => (
                                            <div key={t.id} className="bg-white/5 px-3 py-1 rounded text-xs text-[#a8a29e] border border-white/10">
                                                {t.name} ({t.score || 0} pts)
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </motion.div>
                        ) : activeTab === 'race' ? (
                            <motion.div
                                key="race"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <LiveLeaderboard teams={teams} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="runes"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="w-full flex flex-col items-center justify-center p-4 md:p-8"
                            >
                                <div className="bg-[#2d1b18] p-8 rounded-2xl border-4 border-[#b45309] shadow-[0_0_50px_rgba(180,83,9,0.3)] max-w-2xl w-full text-center relative overflow-hidden">
                                    {/* Background Texture */}
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20" />

                                    <h2 className="text-3xl md:text-4xl font-bold text-[#fcd34d] mb-8 font-cinzel relative z-10">Rune Forge</h2>

                                    <div className="flex flex-col md:flex-row gap-6 justify-center mb-8 relative z-10">
                                        <div className="flex flex-col text-left">
                                            <label className="text-[#a8a29e] mb-2 text-xs uppercase tracking-widest">Path</label>
                                            <select
                                                value={runePath}
                                                onChange={(e) => setRunePath(e.target.value as any)}
                                                className="bg-black/40 border border-[#b45309] text-[#fcd34d] p-3 rounded text-lg outline-none focus:border-[#fcd34d] font-cinzel"
                                            >
                                                <option value="alpha">Alpha Path</option>
                                                <option value="beta">Beta Path</option>
                                                <option value="gamma">Gamma Path</option>
                                                <option value="delta">Delta Path</option>
                                                <option value="charlie">Charlie Path</option>
                                                <option value="bravo">Bravo Path</option>
                                                <option value="theta">Theta Path</option>
                                                <option value="omega">Omega Path</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col text-left">
                                            <label className="text-[#a8a29e] mb-2 text-xs uppercase tracking-widest">Stage</label>
                                            <select
                                                value={runeStage}
                                                onChange={(e) => setRuneStage(Number(e.target.value))}
                                                className="bg-black/40 border border-[#b45309] text-[#fcd34d] p-3 rounded text-lg outline-none focus:border-[#fcd34d] font-cinzel"
                                            >
                                                {[1, 2, 3, 4, 5].map(nu => (
                                                    <option key={nu} value={nu}>Stage {nu}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="relative z-10 bg-white p-4 rounded-xl inline-block shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(JSON.stringify({ path_id: runePath, stage: runeStage }))}`}
                                            alt="Rune QR"
                                            className="w-48 h-48 md:w-64 md:h-64"
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="mt-8 relative z-10">
                                        <p className="text-[#a8a29e] text-xs uppercase tracking-widest mb-2">Rune Essence (Payload)</p>
                                        <code className="bg-black/50 p-4 rounded border border-[#b45309]/30 text-[#fcd34d] font-mono text-sm block">
                                            {JSON.stringify({ path_id: runePath, stage: runeStage }, null, 2)}
                                        </code>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div >

            {/* Ambient Particles */}
            < div className="absolute inset-0 z-0 pointer-events-none" >
                {
                    [...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-amber-200 rounded-full animate-pulse"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDuration: `${Math.random() * 3 + 2}s`
                            }}
                        />
                    ))
                }
            </div >

        </div >
    );
}

