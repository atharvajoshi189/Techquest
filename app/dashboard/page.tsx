"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { MagicCard } from '@/components/ui/MagicCard';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { IntroVideo } from '@/components/IntroVideo';
import { Scanner } from '@yudiel/react-qr-scanner';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

interface ScanResult {
    rawValue: string;
}

const CLUES = [
    "Start where the characters fly on Sundays.",
    "Platform 9 3/4 awaits. Don't be late for the Express.",
    "Beneath the trapdoor, the devil's snare lies.",
    "The Chamber has been opened. Enemies of the heir, beware.",
    "I solemnly swear that I am up to no good.",
    "You have won! The Triwizard Cup is yours!"
];

const HOUSE_THEMES: Record<string, { bg: string, text: string, accent: string, border: string }> = {
    'Gryffindor': { bg: 'bg-red-950', text: 'text-amber-400', accent: 'bg-red-700', border: 'border-amber-500' },
    'Slytherin': { bg: 'bg-emerald-950', text: 'text-slate-300', accent: 'bg-emerald-800', border: 'border-slate-400' },
    'Ravenclaw': { bg: 'bg-blue-950', text: 'text-amber-100', accent: 'bg-blue-800', border: 'border-amber-200' },
    'Hufflepuff': { bg: 'bg-yellow-900', text: 'text-black', accent: 'bg-yellow-600', border: 'border-black' },
};

// Video Mapping
const HOUSE_VIDEOS: Record<string, string> = {
    'Gryffindor': '/videos_g.mp4',
    'Slytherin': '/videos_s.mp4',
    'Ravenclaw': '/videos_r.mp4',
    'Hufflepuff': '/videos_h.mp4'
};


export default function DashboardPage() {
    const router = useRouter();
    const [teamName, setTeamName] = useState<string>("");
    const [teamId, setTeamId] = useState<string | null>(null);
    const [teamHouse, setTeamHouse] = useState<string>("Gryffindor");

    // Config
    const [showIntro, setShowIntro] = useState(true);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);

    // Live Data
    const [currentStage, setCurrentStage] = useState(0);
    const [clue, setClue] = useState("Loading clue...");
    const [round2Password, setRound2Password] = useState<string>("");
    const [gameStatus, setGameStatus] = useState<string>("active");

    // Scanner
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [feedbackMsg, setFeedbackMsg] = useState('');

    // Gatekeeper (Round 2)
    const [gatekeeperInput, setGatekeeperInput] = useState("");
    const [gatekeeperError, setGatekeeperError] = useState("");

    const theme = HOUSE_THEMES[teamHouse] || HOUSE_THEMES['Gryffindor'];

    // --- Listeners ---
    useEffect(() => {
        const storedTeamId = localStorage.getItem('teamId');
        if (!storedTeamId) { router.push('/login'); return; }

        setTeamName(localStorage.getItem('teamName') || "");
        setTeamId(storedTeamId);
        setTeamHouse(localStorage.getItem('teamHouse') || "Gryffindor");

        const unsubConfig = onSnapshot(doc(db, "config", "game_settings"), (doc) => {
            if (doc.exists()) setIsGameActive(doc.data().isGameActive);
        });

        const unsubTeam = onSnapshot(doc(db, "teams", storedTeamId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                const stage = data.current_stage || 0;

                setCurrentStage(stage);
                setGameStatus(data.status);
                setRound2Password(data.round2_password || "");

                setClue(CLUES[Math.min(stage, CLUES.length - 1)]);
            }
        });

        return () => { unsubConfig(); unsubTeam(); };
    }, [router]);

    // Helper: Reveal Password Fragments logic
    const getRevealedPassword = () => {
        const revealCount = Math.min(currentStage * 2, 8);
        if (!round2Password) return "????????";

        let display = "";
        for (let i = 0; i < 8; i++) {
            if (i < revealCount) display += round2Password[i];
            else display += "_";
        }
        return display.split('').join(' ');
    };


    // 2. Handle Scan
    const handleScan = useCallback(async (result: string) => {
        if (!result || !teamId) return;
        if (scanStatus === 'success') return; // Debounce

        if (!isGameActive) {
            setScanStatus('error');
            setFeedbackMsg("Tournament not active!");
            setTimeout(() => setScanStatus('idle'), 3000);
            return;
        }

        // Check against Wrong House
        // Pattern: [HouseName]_Stage_[X]
        const housePattern = /^(Gryffindor|Slytherin|Ravenclaw|Hufflepuff)_Stage_(\d+)$/;
        const match = result.match(housePattern);

        if (match) {
            const scannedHouse = match[1];
            if (scannedHouse !== teamHouse) {
                setScanStatus('error');
                setFeedbackMsg("Wrong House! Stick to your path.");
                setTimeout(() => setScanStatus('idle'), 3000);
                return;
            }
        }

        // Expected QR
        const nextStageNum = currentStage + 1;
        const expectedSecret = `${teamHouse}_Stage_${nextStageNum}`;

        if (result === expectedSecret) {
            try {
                // If this is stage 5 scan (reaching 5), we just increment. 
                // The UI will then show the Gatekeeper. We do NOT finish yet.
                await updateDoc(doc(db, "teams", teamId), {
                    current_stage: increment(1),
                    last_updated: serverTimestamp()
                });

                setScanStatus('success');
                setFeedbackMsg("Clue Found! Check your Notebook.");

                setTimeout(() => {
                    setIsScanning(false);
                    setScanStatus('idle');
                    setFeedbackMsg('');
                }, 2000);
            } catch (e) {
                console.error(e);
                setScanStatus('error');
                setFeedbackMsg("Spell Fizzled (Error)");
            }
        } else {
            // Only show generic error if it wasn't a "Wrong House" error
            setScanStatus('error');
            setFeedbackMsg("Wrong QR Code!");
            setTimeout(() => setScanStatus('idle'), 3000);
        }
    }, [teamId, isGameActive, currentStage, scanStatus, teamHouse]);

    // 3. Handle Gatekeeper Submit (End Game)
    const handleGatekeeperSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (gatekeeperInput.toUpperCase() === round2Password.toUpperCase()) {
            // WINNER!
            if (teamId) {
                await updateDoc(doc(db, "teams", teamId), {
                    status: 'finished',
                    finishedAt: serverTimestamp()
                });
            }
        } else {
            setGatekeeperError("Incorrect Passcode! The Gate remains shut.");
        }
    };


    if (!teamName) return null;

    // --- RENDER STATES ---
    const showWinnerScreen = gameStatus === 'finished';
    const showGatekeeper = !showWinnerScreen && currentStage >= 5;

    // Select Video
    const videoSrc = HOUSE_VIDEOS[teamHouse] || '/videos_g.mp4';

    return (
        <div className={`min-h-screen transition-colors duration-1000 ${theme.bg}`}>
            <AnimatePresence>
                {showIntro && (
                    <IntroVideo
                        house={teamHouse}
                        videoSrc={videoSrc}
                        onComplete={() => setShowIntro(false)}
                    />
                )}
            </AnimatePresence>

            <div className="p-6 md:p-12 flex flex-col items-center max-w-4xl mx-auto pb-32">

                {/* Header */}
                <header className={`w-full flex justify-between items-center mb-6 border-b-2 ${theme.border} pb-4`}>
                    <h1 className={`text-2xl md:text-3xl font-cinzel font-bold ${theme.text}`}>{teamName}</h1>
                    <div className={`${theme.accent} ${theme.text} px-4 py-2 rounded-full font-bold border ${theme.border} text-sm shadow-md`}>
                        {isGameActive ? "Active" : "Waiting"}
                    </div>
                </header>

                {!isGameActive ? (
                    <MagicCard className="w-full text-center py-20 animate-pulse bg-white/10 border-white/20">
                        <h2 className={`text-3xl font-cinzel ${theme.text} mb-4`}>The Tournament Has Not Started</h2>
                    </MagicCard>
                ) : showWinnerScreen ? (
                    // --- 1. WINNER SCREEN ---
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full text-center space-y-8"
                    >
                        <h1 className="text-5xl md:text-7xl font-cinzel text-gold drop-shadow-lg mb-4">ROUND 2 UNLOCKED!</h1>
                        <p className="text-white text-xl font-hand">The Goblet of Fire accepts your entry.</p>

                        <a
                            href="https://app.easyevaluate.com/attendee/test/COL4U2onYy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-12 py-6 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-3xl rounded-lg shadow-[0_0_50px_rgba(250,204,21,0.6)] animate-pulse hover:scale-105 transition-transform"
                        >
                            ENTER ROUND 2
                        </a>
                    </motion.div>
                ) : showGatekeeper ? (
                    // --- 2. GATEKEEPER UI (Stage 5 Reached) ---
                    <MagicCard title="The Final Gate" className="w-full text-center py-10">
                        <p className="text-xl mb-6 font-hand">You have collected all fragments. Speak the password to enter.</p>

                        <div className="bg-black/10 p-6 rounded mb-6 font-mono text-3xl tracking-widest font-bold">
                            {getRevealedPassword()}
                        </div>

                        <form onSubmit={handleGatekeeperSubmit} className="max-w-md mx-auto space-y-4">
                            <input
                                value={gatekeeperInput}
                                onChange={e => { setGatekeeperInput(e.target.value); setGatekeeperError(""); }}
                                placeholder="Enter Secret Password"
                                className="w-full p-4 text-center text-2xl font-bold bg-white border-2 border-black rounded uppercase"
                            />
                            {gatekeeperError && <p className="text-red-500 font-bold">{gatekeeperError}</p>}

                            <button className="w-full py-4 bg-black text-white font-bold text-xl rounded shadow-lg hover:bg-gray-800">
                                UNLOCK GATE
                            </button>
                        </form>
                    </MagicCard>
                ) : (
                    // --- 3. NORMAL GAMEPLAY ---
                    <>
                        {/* Secret Notebook */}
                        <div className="w-full mb-6">
                            <div className={`p-4 rounded-lg bg-black/20 border ${theme.border} flex justify-between items-center`}>
                                <span className={`font-cinzel font-bold ${theme.text}`}>Secret Notebook:</span>
                                <span className="font-mono text-xl tracking-[0.5em] font-bold bg-white/10 px-4 py-1 rounded">
                                    {getRevealedPassword()}
                                </span>
                            </div>
                        </div>

                        <MagicCard className="w-full mb-8 relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center bg-white/90">
                            <div className="absolute top-4 left-4 text-black/40 text-sm font-cinzel">Current Hint</div>

                            {/* Progress Bar */}
                            <div className="w-full h-1 bg-black/10 rounded-full mb-8 max-w-md mx-auto mt-6">
                                <div className={`h-full ${theme.accent} rounded-full transition-all duration-1000`} style={{ width: `${(Math.min(currentStage, 5) / 5) * 100}%` }}></div>
                            </div>

                            <div className={`absolute top-4 right-4 w-10 h-10 border-2 ${theme.border} rounded-full flex items-center justify-center font-bold ${theme.text} ${theme.bg}`}>
                                {Math.min(currentStage + 1, 5)}
                            </div>

                            <p className="text-3xl md:text-5xl font-hand text-center leading-relaxed max-w-2xl px-4 py-8 text-black">
                                &quot;{clue}&quot;
                            </p>
                        </MagicCard>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsScanning(true)}
                            className={`fixed bottom-10 right-10 md:static md:mt-8 w-20 h-20 md:w-32 md:h-32 rounded-full ${theme.accent} border-4 ${theme.border} shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center z-40 group`}
                        >
                            <div className="text-4xl md:text-6xl group-hover:rotate-180 transition-transform duration-500">🪄</div>
                        </motion.button>
                    </>
                )}

                {/* Scanner Modal */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
                        >
                            <button onClick={() => setIsScanning(false)} className="absolute top-6 right-6 text-white text-4xl hover:text-red-500">&times;</button>
                            <h2 className={`${theme.text} font-cinzel text-2xl mb-4`}>Cast Your Spell</h2>
                            <div className={`w-full max-w-md aspect-square border-4 ${theme.border} rounded-lg overflow-hidden relative`}>
                                <Scanner
                                    onScan={(result: ScanResult[]) => { if (result && result.length > 0) handleScan(result[0].rawValue); }}
                                    onError={(error: unknown) => console.log(error)} // eslint-disable-line @typescript-eslint/no-explicit-any
                                    components={{ onOff: true, torch: true }}
                                />
                            </div>
                            <div className="mt-8 h-20 flex items-center justify-center w-full">
                                {scanStatus === 'success' && <div className="bg-green-600 text-white px-6 py-3 rounded-full font-cinzel text-xl border-2 border-white">✨ {feedbackMsg} ✨</div>}
                                {scanStatus === 'error' && <div className="bg-red-600 text-white px-6 py-3 rounded-full font-cinzel text-xl border-2 border-red-300">❌ {feedbackMsg}</div>}
                                {scanStatus === 'idle' && <p className="text-white/50 font-hand text-xl">Find: {teamHouse}_Stage_{currentStage + 1}</p>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
