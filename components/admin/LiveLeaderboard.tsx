"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '@/app/firebase'; // Adjust path if needed, assuming it's exposed here or passed down. If not I need to check where db is initialized.
// checking previous file content... it was importing db from '../firebase' in admin/page.tsx. 
// In components/admin/LiveLeaderboard.tsx, relative path to app/firebase might be different. 
// frontend/components/admin/LiveLeaderboard.tsx -> ../../app/firebase ? 
// Let's assume standard alias usage or relative path. 
// Actually, let's check the imports in admin/page.tsx: "import { db } from '../firebase';" which means frontend/app/firebase.ts ? 
// component is in frontend/components/admin/. So path to frontend/app/firebase is ../../app/firebase 
// BUT, usually firebase config is in a utils folder or lib. 
// Let's look at admin/page.tsx again. line 5: "import { db } from '../firebase';" 
// admin/page.tsx is in frontend/app/admin/. So db is in frontend/app/firebase.ts/js? or frontend/app/firebase/index.ts?
// Wait, "import { db } from '../firebase'" inside "app/admin/page.tsx" means "app/firebase".
// So for "components/admin/LiveLeaderboard.tsx", it needs to go "../../app/firebase".

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
    createdAt?: { seconds: number }; // Added for Late Joiner Logic
    finishedAt?: { seconds: number };
    round2_password?: string;
    score?: number;
}

interface LiveLeaderboardProps {
    teams: Team[];
    // Removed explicit time props as we calculate internally now
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

// --- TeamRow Component ---
const TeamRow = ({ team, index, formattedTime }: { team: Team, index: number, formattedTime: string }) => {
    const [scoreDelta, setScoreDelta] = React.useState<{ val: number, id: number } | null>(null);
    const prevScore = React.useRef(team.score || 0);

    useEffect(() => {
        const current = team.score || 0;
        const diff = current - prevScore.current;
        if (diff !== 0) {
            setScoreDelta({ val: diff, id: Date.now() });
            prevScore.current = current;
            setTimeout(() => setScoreDelta(null), 2000);
        }
    }, [team.score]);

    const isFinished = team.status === 'finished';
    const progress = (team.current_stage / 5) * 100;

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
            <div
                className="absolute inset-0 opacity-30 transition-opacity group-hover:opacity-50"
                style={{ background: HOUSE_BG_GRADIENTS[team.house] || HOUSE_BG_GRADIENTS['Gryffindor'] }}
            />

            <div className="relative z-10 p-4 flex items-center gap-6">
                <div className="w-12 flex justify-center flex-shrink-0">
                    {rankIcon}
                </div>

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

                        <AnimatePresence>
                            {scoreDelta && (
                                <motion.span
                                    key={scoreDelta.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.5 }}
                                    animate={{ opacity: 1, y: -20, scale: 1.2 }}
                                    exit={{ opacity: 0, y: -30 }}
                                    className={`ml-2 text-sm font-bold px-2 py-1 rounded-full ${scoreDelta.val > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                                >
                                    {scoreDelta.val > 0 ? '+' : ''}{scoreDelta.val}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

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

                <div className="flex flex-col items-end flex-shrink-0 pl-4 border-l border-white/10">
                    <div className="font-mono text-2xl text-cyan-200 drop-shadow-[0_0_5px_rgba(34,211,238,0.6)] tracking-widest tabular-nums">
                        {formattedTime}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-cyan-700">Time Elapsed</div>
                </div>
            </div>
        </motion.li>
    );
};

export function LiveLeaderboard({ teams }: LiveLeaderboardProps) {
    const [now, setNow] = useState(Date.now());
    const [tournamentStartTime, setTournamentStartTime] = useState<number | null>(null);
    const [isStarted, setIsStarted] = useState(false);

    // 1. Subscribe to Config
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "config", "metadata"), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setTournamentStartTime(data.startTime ? data.startTime.toMillis() : null);
                setIsStarted(data.isStarted);
            }
        });
        return () => unsub();
    }, []);

    // 2. Timer Loop
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // 3. Process Teams with Hybrid Timer Logic
    const processedTeams = useMemo(() => {
        const globalStartMs = tournamentStartTime || 0;

        return teams.map(team => {
            // Hybrid Logic: Max(GlobalStart, TeamJoin_CreatedAt)
            const teamJoinMs = team.createdAt?.seconds ? team.createdAt.seconds * 1000 : 0;
            const effectiveStartTime = Math.max(globalStartMs, teamJoinMs);

            let diff = 0;
            if (isStarted && effectiveStartTime > 0) {
                diff = now - effectiveStartTime;
            }

            if (team.status === 'finished' && team.finishedAt) {
                const finishMs = team.finishedAt.seconds * 1000;
                diff = finishMs - effectiveStartTime;
            }

            // Safety clamp
            if (diff < 0) diff = 0;

            return {
                ...team,
                timeElapsedFormatted: formatDuration(diff),
                rawDuration: diff // used for sorting
            };
        });
    }, [teams, now, tournamentStartTime, isStarted]);

    // 4. Sorting
    const sortedTeams = useMemo(() => {
        return [...processedTeams].sort((a, b) => {
            // Rule 1: Higher Stage
            if (a.current_stage !== b.current_stage) {
                return b.current_stage - a.current_stage;
            }
            // Rule 2: Higher Score
            const scoreA = a.score || 0;
            const scoreB = b.score || 0;
            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }
            // Rule 3: Lower Time (Faster is better)
            return a.rawDuration - b.rawDuration;
        });
    }, [processedTeams]);


    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <div className="relative bg-[#050505]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden min-h-[600px] flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-transparent to-purple-900/10 pointer-events-none" />

                <div className="relative z-10 p-6 flex justify-between items-center border-b border-white/5 bg-white/5">
                    <h2 className="text-3xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 tracking-widest drop-shadow-sm">
                        THE RACE
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isStarted ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'} animate-pulse`} />
                        <span className={`text-xs font-mono ${isStarted ? 'text-green-400' : 'text-red-400'} tracking-widest uppercase`}>
                            {isStarted ? "Live Sync" : "Waiting for Start"}
                        </span>
                    </div>
                </div>

                <ul className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar-magic relative z-10">
                    <AnimatePresence>
                        {sortedTeams.map((team, index) => (
                            <TeamRow
                                key={team.id}
                                team={team}
                                index={index}
                                formattedTime={team.timeElapsedFormatted}
                            />
                        ))}
                    </AnimatePresence>
                </ul>
                <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent blur-sm" />
            </div>
        </div>
    );
}
