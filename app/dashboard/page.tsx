"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { IntroVideo } from '@/components/IntroVideo';
import { Scanner } from '@yudiel/react-qr-scanner';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { QuestJournal } from '@/components/dashboard/QuestJournal';
import { InventoryPouch } from '@/components/dashboard/InventoryPouch';

// --- Types ---
interface UserSession {
    teamId: string;
    teamName: string;
    leader: string;
    house: string;
    path: 'alpha' | 'beta';
    currentStage: number;
}

interface QRPayload {
    path_id: string;
    stage: number;
}

// --- CONFIGURATION ---

const THEME_CONFIG: Record<string, { bgGradient: string; border: string; glow: string; accent: string }> = {
    'Ravenclaw': {
        bgGradient: "bg-gradient-to-br from-blue-900 via-indigo-900 to-black",
        border: "border-blue-400/50",
        glow: "shadow-blue-500/50",
        accent: "text-blue-200"
    },
    'Slytherin': {
        bgGradient: "bg-gradient-to-br from-green-900 via-teal-900 to-black",
        border: "border-green-400/50",
        glow: "shadow-green-500/50",
        accent: "text-green-200"
    },
    'Gryffindor': {
        bgGradient: "bg-gradient-to-br from-red-900 via-orange-900 to-black",
        border: "border-red-400/50",
        glow: "shadow-red-500/50",
        accent: "text-red-200"
    },
    'Hufflepuff': {
        bgGradient: "bg-gradient-to-br from-yellow-700 via-orange-800 to-black",
        border: "border-yellow-400/50",
        glow: "shadow-yellow-500/50",
        accent: "text-yellow-200"
    },
    'Default': {
        bgGradient: "bg-gradient-to-br from-gray-900 to-black",
        border: "border-white/20",
        glow: "shadow-white/20",
        accent: "text-white"
    }
};

const CLUE_DATA = {
    alpha: {
        1: "I used to zoom on the road, now I stand still and carry your food. Find me where wheels meet meals! ",
        2: "Standing proud for every techie, This place welcomes you politely. ",
        3: "Where answers end and marks begin — Seek the cell that judges if you lose or win. ",
        4: "Engines roar, then fall to hush, Here they wait without a rush. Find your clue among the lanes.",
        5: "Dribble, pass, shoot… and score! Find the place with a painted floor."
    } as Record<number, string>,
    beta: {
        1: "A plate of noodles and a drink so cool, A poster here makes you drool.",
        2: "I’m the hub where minds huddle — find me! ",
        3: "Where answers end and marks begin — Seek the cell that judges if you lose or win. ",
        4: "I stand by the road, round and tall, Show you yourself, no glass hall. Plants around me.",
        5: "Under my giant metal crown, Athletes cheer and never frown... Come here — where champions play! "
    } as Record<number, string>
};

// --- Main Component ---

export default function StudentDashboard() {
    const router = useRouter();

    // State
    const [user, setUser] = useState<UserSession | null>(null);
    const [currentStage, setCurrentStage] = useState(0);
    const [gameStatus, setGameStatus] = useState('active');
    const [round2Password, setRound2Password] = useState('');
    const [isGameActive, setIsGameActive] = useState(false);

    // UI State
    const [showIntro, setShowIntro] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error' | 'idle', msg: string }>({ type: 'idle', msg: '' });
    const [gatekeeperInput, setGatekeeperInput] = useState('');

    // 1. Initialize User from LocalStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            router.push('/'); // Redirect to Login
            return;
        }
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setCurrentStage(parsedUser.currentStage); // Initial load
        } catch (e) {
            console.error("Failed to parse user session", e);
            router.push('/');
        }
    }, [router]);

    // 2. Real-time Listeners
    useEffect(() => {
        if (!user?.teamId) return;

        // Game Settings
        const unsubConfig = onSnapshot(doc(db, "config", "game_settings"), (d) => {
            if (d.exists()) setIsGameActive(d.data().isGameActive);
        });

        // Team Progress
        const unsubTeam = onSnapshot(doc(db, "teams", user.teamId), (d) => {
            if (d.exists()) {
                const data = d.data();
                setCurrentStage(data.current_stage || 0);
                setGameStatus(data.status || 'active');
                setRound2Password(data.round2_password || '');
            }
        });

        return () => { unsubConfig(); unsubTeam(); };
    }, [user?.teamId]);

    // 3. Derived State
    const theme = THEME_CONFIG[user?.house || 'Default'] || THEME_CONFIG['Default'];

    // Get Clue based on Path & Stage
    // Note: Clue 1 corresponds to Stage 0 initially or Stage 1? 
    // Usually Stage 0 means "Not Started", so imply "Go to Location 1".
    // If currentStage is 0, we show clue for 1. If 1, show clue for 2? 
    // Let's assume current_stage means "Completed Stages". So Stage 0 means working on Clue 1.
    const displayStage = currentStage + 1;
    const currentClue = user?.path
        ? (CLUE_DATA[user.path][displayStage] || "Wait for the next instruction...")
        : "Loading Destiny...";

    // Reveal Password Fragments Logic
    const getRevealedPassword = () => {
        if (!round2Password) return "????????";
        // Reveal 2 chars per stage completed
        // Stage 0 -> 0 chars
        // Stage 1 -> 2 chars
        // Stage 2 -> 4 chars...
        const revealCount = Math.min(currentStage * 2, 8);
        return round2Password.substring(0, revealCount).padEnd(8, '_').split('').join(' ');
    };

    // Handlers
    const handleScan = async (rawValue: string) => {
        if (!rawValue || !user || !isGameActive) return;

        try {
            // 1. Attempts to Parse JSON (Strict Requirement)
            let payload: QRPayload;
            try {
                payload = JSON.parse(rawValue);
            } catch {
                console.error("QR Parse Failed:", rawValue);
                setScanFeedback({ type: 'error', msg: 'Invalid Rune Format!' });
                return;
            }

            // 2. CHECK PATH (Must match User's Path)
            // e.g. "alpha" vs "alpha"
            if (payload.path_id !== user.path) {
                setScanFeedback({ type: 'error', msg: `Wrong Path! This rune belongs to ${payload.path_id}.` });
                return;
            }

            // 3. CHECK STAGE (Must be the NEXT stage)
            // User currentStage is "Completed Stages" (e.g. 0).
            // We are looking for Stage 1.
            const targetStage = currentStage + 1;

            // Allow re-scanning the current stage ?? No, strictly next.
            // But if user scans Stage 1 when they are at 0, it matches.
            if (payload.stage !== targetStage) {
                setScanFeedback({ type: 'error', msg: `Wrong Clue! You are looking for Stage ${targetStage}, found ${payload.stage}.` });
                return;
            }

            // --- SUCCESS ---
            setScanFeedback({ type: 'success', msg: 'Rune Deciphered! Accessing Memory...' });

            // Wait a moment for the user to see success
            setTimeout(async () => {
                setIsScanning(false);

                // Update Firestore
                try {
                    const teamRef = doc(db, "teams", user.teamId);
                    await updateDoc(teamRef, {
                        current_stage: increment(1),
                        last_updated: serverTimestamp()
                    });
                } catch (updateErr) {
                    console.error("Firestore Update Failed", updateErr);
                    alert("Network Error: Could not save progress.");
                }
            }, 1500);

        } catch (err) {
            console.error("Scan Error", err);
            setScanFeedback({ type: 'error', msg: 'The Lens is clouded... Try again.' });
        }
    };

    const handleGatekeeper = async (e: React.FormEvent) => {
        e.preventDefault();
        if (gatekeeperInput.toUpperCase() === round2Password.toUpperCase()) {
            await updateDoc(doc(db, "teams", user!.teamId), { status: 'finished', finishedAt: serverTimestamp() });
        } else {
            alert("The Gate remains shut.");
        }
    };

    const handleStartScanning = () => {
        setScanFeedback({ type: 'idle', msg: '' });
        setIsScanning(true);
    };

    if (!user) return <div className="bg-black text-white h-screen flex items-center justify-center">Summoning Wizard...</div>;

    return (
        <div className={`min-h-screen relative overflow-hidden font-cinzel text-white transition-all duration-1000 ${theme.bgGradient}`}>

            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />

            {/* Intro Video (One time) */}
            <AnimatePresence>
                {showIntro && (
                    <IntroVideo
                        house={user.house}
                        // Simplified video logic: just pass house, component handles fallback if needed or we assume standard naming
                        videoSrc={`/videos_${user.house.charAt(0).toLowerCase()}.webm`}
                        onComplete={() => setShowIntro(false)}
                    />
                )}
            </AnimatePresence>

            {/* Main Content */}
            {!showIntro && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-4 md:gap-6 pb-20 md:pb-8"
                >

                    {/* Header Card */}
                    <div className={`p-4 md:p-6 rounded-2xl backdrop-blur-md bg-black/40 border-2 ${theme.border} ${theme.glow} flex justify-between items-center`}>
                        <div>
                            <h2 className="text-[10px] md:text-xs uppercase tracking-widest opacity-70">Welcome Champion</h2>
                            <h1 className={`text-xl md:text-4xl font-bold ${theme.accent} drop-shadow-md`}>
                                {user.teamName}
                            </h1>
                        </div>
                        <div className="text-right">
                            <div className={`inline-block px-2 py-1 md:px-3 rounded-full border ${theme.border} bg-black/50 text-[10px] md:text-xs font-bold uppercase tracking-widest`}>
                                {user.house}
                            </div>
                            <div className="text-[10px] md:text-xs mt-1 text-white/50">{user.path.toUpperCase()} PATH</div>
                        </div>
                    </div>

                    {/* Game Status or content */}
                    {!isGameActive ? (
                        <div className="text-center py-10 md:py-20">
                            <h2 className="text-xl md:text-3xl font-bold animate-pulse text-yellow-500">The Tournament is Paused</h2>
                            <p className="opacity-60 mt-2 text-sm md:text-base">The Headmaster is speaking...</p>
                        </div>
                    ) : gameStatus === 'finished' ? (
                        <div className="p-4 md:p-8 rounded-2xl bg-black/60 border border-yellow-500 text-center space-y-4 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                            <h1 className="text-3xl md:text-5xl font-bold text-yellow-400">VICTORY</h1>
                            <p className="text-base md:text-xl">You have completed the Triwizard Quest.</p>
                        </div>
                    ) : currentStage >= 5 ? (
                        // GATEKEEPER MODE
                        <div className={`p-4 md:p-8 rounded-2xl bg-black/60 border-2 ${theme.border} ${theme.glow} text-center space-y-6`}>
                            <h2 className="text-2xl md:text-3xl text-red-500 tracking-[0.2em] font-bold">THE FINAL PORTAL</h2>
                            <p className="text-white/70 text-sm md:text-base">Enter the 8-character Secret Password to claim victory.</p>
                            <div className="font-mono text-2xl md:text-3xl tracking-[0.3em] md:tracking-[0.5em] text-white my-4 break-all">{getRevealedPassword()}</div>
                            <form onSubmit={handleGatekeeper} className="max-w-md mx-auto flex flex-col md:flex-row gap-2">
                                <input
                                    className="flex-1 bg-black/50 border border-white/30 p-3 rounded text-center outline-none focus:border-red-500"
                                    placeholder="PASSWORD"
                                    value={gatekeeperInput}
                                    onChange={e => setGatekeeperInput(e.target.value)}
                                />
                                <button type="submit" className="bg-red-600 px-6 py-2 rounded font-bold hover:bg-red-700">UNLOCK</button>
                            </form>
                        </div>
                    ) : (
                        // NORMAL GAMEPLAY
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                            {/* Left: Quest Journal */}
                            <div className="space-y-4 md:space-y-6">
                                <div className="w-full">
                                    <QuestJournal
                                        clue={currentClue}
                                        stage={displayStage}
                                        house={user.house}
                                    />
                                </div>
                                <InventoryPouch revealedPassword={getRevealedPassword()} />
                            </div>

                            {/* Right: Actions / Scanner */}
                            <div className="flex flex-col gap-4 md:gap-6">
                                <div className={`flex-1 min-h-[200px] md:min-h-[300px] rounded-2xl bg-black/30 border ${theme.border} flex items-center justify-center relative overflow-hidden group hover:bg-black/40 transition-colors cursor-pointer active:scale-95 duration-200`}
                                    onClick={handleStartScanning}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-t from-${theme.accent.split('-')[1]}-900/20 to-transparent`} />
                                    <div className="text-center z-10 space-y-2 md:space-y-4 p-4">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                                            <span className="text-3xl md:text-4xl">📷</span>
                                        </div>
                                        <h3 className="text-lg md:text-xl font-bold tracking-widest">SCAN RUNE</h3>
                                        <p className="text-[10px] md:text-xs opacity-50 px-4 md:px-8">Find the QR code at location #{displayStage} <br /> ({user.path.toUpperCase()} PATH)</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </motion.div>
            )}

            {/* FULL SCREEN SCANNER OVERLAY */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
                    >
                        {/* Close Button Top Right */}
                        <button
                            onClick={() => setIsScanning(false)}
                            className="absolute top-8 right-8 text-white/80 hover:text-white transition-colors p-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-xl md:text-2xl mb-4 md:mb-8 tracking-[0.3em] text-white/80 font-cinzel text-center mt-8">ALIGN THE RUNE</h2>

                        {/* Scanner Container */}
                        <div className={`relative w-full max-w-[300px] md:max-w-sm aspect-square rounded-xl overflow-hidden border-4 ${theme.border} shadow-[0_0_50px_rgba(255,255,255,0.1)]`}>
                            <Scanner
                                onScan={(res) => {
                                    if (res && res.length > 0) {
                                        handleScan(res[0].rawValue);
                                    }
                                }}
                                paused={scanFeedback.type === 'success'}
                            />

                            {/* Overlay Frame (Magical Lens) */}
                            <div className="absolute inset-0 border-[30px] md:border-[40px] border-black/60 z-10 pointer-events-none" />

                            {/* Corner Markers */}
                            <div className="absolute inset-4 pointer-events-none z-20 opacity-60">
                                <div className={`absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t-4 border-l-4 ${theme.border.replace('border-', 'border-')}`} />
                                <div className={`absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-t-4 border-r-4 ${theme.border.replace('border-', 'border-')}`} />
                                <div className={`absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-b-4 border-l-4 ${theme.border.replace('border-', 'border-')}`} />
                                <div className={`absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b-4 border-r-4 ${theme.border.replace('border-', 'border-')}`} />
                            </div>

                            {/* Scanning Laser Line */}
                            <motion.div
                                animate={{ top: ['10%', '90%', '10%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute left-[10%] right-[10%] h-[2px] bg-red-500/80 shadow-[0_0_10px_red] z-20 pointer-events-none"
                            />
                        </div>

                        {/* Close Button Bottom (Mobile Friendly) */}
                        <button
                            onClick={() => setIsScanning(false)}
                            className="mt-8 px-8 py-3 bg-white/10 border border-white/20 rounded-full font-bold tracking-widest hover:bg-white/20 transition-all uppercase text-xs md:text-sm"
                        >
                            Close Magical Lens
                        </button>

                        {/* Feedback Text */}
                        <div className="mt-8 h-12 text-center px-4">
                            {scanFeedback.type === 'idle' && <p className="animate-pulse text-white/50 text-base md:text-lg">Searching for Signal...</p>}
                            {scanFeedback.type === 'success' && <p className="text-green-400 text-lg md:text-xl font-bold font-cinzel drop-shadow-md">✨ {scanFeedback.msg}</p>}
                            {scanFeedback.type === 'error' && <p className="text-red-400 text-sm md:text-xl font-bold font-cinzel drop-shadow-md whitespace-pre-wrap">⚠️ {scanFeedback.msg}</p>}
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
