"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
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
    score?: number; // Added score field
}

interface LiveLeaderboardProps {
    teams: Team[];
    currentTime: number;
    startTime: number | null; // Added global start time
}

const HOUSE_COLORS: Record<string, string> = {
    'Gryffindor': '#740001',
    'Slytherin': '#1a472a',
    'Ravenclaw': '#0e1a40',
    'Hufflepuff': '#ecb939'
};

const HOUSE_BG_GRADIENTS: Record<string, string> = {
    'Gryffindor': 'linear-gradient(90deg, rgba(116,0,1,0.2) 0%, rgba(0,0,0,0) 100%)',
    'Slytherin': 'linear-gradient(90deg, rgba(26,71,42,0.2) 0%, rgba(0,0,0,0) 100%)',
    'Ravenclaw': 'linear-gradient(90deg, rgba(14,26,64,0.4) 0%, rgba(0,0,0,0) 100%)',
    'Hufflepuff': 'linear-gradient(90deg, rgba(236,185,57,0.1) 0%, rgba(0,0,0,0) 100%)'
};

const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// --- TeamRow Component for Individual Animation Logic ---
const TeamRow = ({ team, index, currentTime, startTime }: { team: Team, index: number, currentTime: number, startTime: number | null }) => {
    const [scoreDelta, setScoreDelta] = React.useState<{ val: number, id: number } | null>(null);
    const prevScore = React.useRef(team.score || 0);

    React.useEffect(() => {
        const current = team.score || 0;
        const diff = current - prevScore.current;
        if (diff !== 0) {
            setScoreDelta({ val: diff, id: Date.now() });
            prevScore.current = current;
            // Clear bubble after animation
            setTimeout(() => setScoreDelta(null), 2000);
        }
    }, [team.score]);

    const isFinished = team.status === 'finished';
    const progress = (team.current_stage / 5) * 100;

    // Timer Logic: (Now - GlobalStart) OR (FinishedTime - GlobalStart)
    // If GlobalStart is null (not started), duration is 0.
    // If team has startedAt (legacy) we can ignore it or use it as fallback? 
    // Requirement says "Sets a global variable tournamentStartTime... All connected Student devices detect this change and START their timers".
    // So we rely on startTime.
    let duration = 0;
    if (startTime) {
        const end = team.finishedAt ? team.finishedAt.seconds * 1000 : currentTime;
        duration = end - startTime;
    }

    // Rank Styles
    let rankIcon = <span className="text-white/20 font-mono text-xl">#{index + 1}</span>;
    let cardBorder = "border-white/5";
    let cardGlow = "";

    if (index === 0) {
        rankIcon = <span className="text-3xl drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">👑</span>;
        cardBorder = "border-yellow-500/50";
        cardGlow = "shadow-[0_0_30px_rgba(255,215,0,0.15)]";
    } else if (index === 1) {
        rankIcon = <span className="text-2xl drop-shadow-[0_0_10px_rgba(192,192,192,0.8)]">🥈</span>;
        cardBorder = "border-slate-400/50";
    } else if (index === 2) {
        rankIcon = <span className="text-2xl drop-shadow-[0_0_10px_rgba(205,127,50,0.8)]">🥉</span>;
        cardBorder = "border-orange-700/50";
    }

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 45, damping: 12 }}
            className={`relative rounded-xl border ${cardBorder} ${cardGlow} bg-black/40 backdrop-blur-md overflow-hidden group`}
        >
            {/* House Gradient Background */}
            <div
                className="absolute inset-0 opacity-30 transition-opacity group-hover:opacity-50"
                style={{ background: HOUSE_BG_GRADIENTS[team.house] || HOUSE_BG_GRADIENTS['Gryffindor'] }}
            />

            <div className="relative z-10 p-4 flex items-center gap-6">

                {/* Rank */}
                <div className="w-12 flex justify-center flex-shrink-0">
                    {rankIcon}
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-white tracking-wide truncate">
                            {team.name}
                        </h3>
                        <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10 text-white/60"
                            style={{ color: HOUSE_COLORS[team.house] }}
                        >
                            {team.house}
                        </span>

                        {/* Score Bubble Animation */}
                        <AnimatePresence>
                            {scoreDelta && (
                                <motion.span
                                    key={scoreDelta.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.5 }}
                                    animate={{ opacity: 1, y: -20, scale: 1.2 }}
                                    exit={{ opacity: 0, y: -30 }} // Fade out upwards
                                    className={`ml-2 text-sm font-bold px-2 py-1 rounded-full ${scoreDelta.val > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                                >
                                    {scoreDelta.val > 0 ? '+' : ''}{scoreDelta.val}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Magical Progress Bar */}
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div
                            className="absolute top-0 left-0 h-full rounded-full"
                            style={{ backgroundColor: HOUSE_COLORS[team.house] || '#fff' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 1 }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-pulse" />
                        </motion.div>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-white/40 font-mono">
                        <span>Stage {Math.min(team.current_stage, 5)} / 5</span>
                        <span className="text-white/60 font-bold">SCORE: {team.score || 0}</span>
                        {isFinished && <span className="text-green-400 font-bold animate-pulse">FINISHED</span>}
                    </div>
                </div>

                {/* Timer (Runes) */}
                <div className="flex flex-col items-end flex-shrink-0 pl-4 border-l border-white/10">
                    <div className="font-mono text-2xl text-cyan-200 drop-shadow-[0_0_5px_rgba(34,211,238,0.6)] tracking-widest tabular-nums">
                        {formatDuration(duration)}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-cyan-700">Time Elapsed</div>
                </div>

            </div>
        </motion.li>
    );
};

export function LiveLeaderboard({ teams, currentTime, startTime }: LiveLeaderboardProps) {

    // --- 1. Sorting Logic ---
    // Primary: Score (Desc), Secondary: Stage (Desc), Tertiary: Time (Asc)
    const sortedTeams = useMemo(() => {
        return [...teams].sort((a, b) => {
            // Rule 1: Higher Stage is better (PRIMARY)
            if (a.current_stage !== b.current_stage) {
                return b.current_stage - a.current_stage;
            }

            // Rule 2: Higher Score is better (SECONDARY)
            const scoreA = a.score || 0;
            const scoreB = b.score || 0;
            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            // Rule 3: Lower Time is better (TERTIARY)
            // If startTime IS set:
            const getEnd = (t: Team) => t.finishedAt ? t.finishedAt.seconds * 1000 : currentTime;
            const timeA = getEnd(a);
            const timeB = getEnd(b);

            return timeA - timeB;
        });
    }, [teams, currentTime, startTime]);


    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">

            {/* --- Container: Enchanted Obsidian Slab --- */}
            <div className="relative bg-[#050505]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden min-h-[600px] flex flex-col">

                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-transparent to-purple-900/10 pointer-events-none" />

                {/* Header / Live Indicator */}
                <div className="relative z-10 p-6 flex justify-between items-center border-b border-white/5 bg-white/5">
                    <h2 className="text-3xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 tracking-widest drop-shadow-sm">
                        THE RACE
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                        <span className="text-xs font-mono text-green-400 tracking-widest uppercase">Live Sync</span>
                    </div>
                </div>

                {/* List Container */}
                <ul className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar-magic relative z-10">
                    <AnimatePresence>
                        {sortedTeams.map((team, index) => (
                            <TeamRow
                                key={team.id}
                                team={team}
                                index={index}
                                currentTime={currentTime}
                                startTime={startTime}
                            />
                        ))}
                    </AnimatePresence>
                </ul>

                {/* Footer Glow */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent blur-sm" />
            </div>
        </div>
    );
}
