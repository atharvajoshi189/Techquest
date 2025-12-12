import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Scanner } from '@yudiel/react-qr-scanner';
import { db } from '../../app/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { QuestJournal } from '@/components/dashboard/QuestJournal';

// --- Types (Reused) ---
interface UserSession {
    teamId: string;
    teamName: string;
    leader: string;
    house: string;
    path: 'alpha' | 'beta' | 'gamma';
    currentStage: number;
    score?: number;
}

interface QRPayload {
    path_id: string;
    stage: number;
}

// --- Theming ---
const MOBILE_THEMES: Record<string, { bg: string; accent: string; text: string }> = {
    'Ravenclaw': { bg: 'bg-slate-900', accent: 'border-blue-500', text: 'text-blue-200' },
    'Slytherin': { bg: 'bg-emerald-950', accent: 'border-green-600', text: 'text-green-200' },
    'Gryffindor': { bg: 'bg-red-950', accent: 'border-red-600', text: 'text-red-200' },
    'Hufflepuff': { bg: 'bg-yellow-950', accent: 'border-yellow-600', text: 'text-yellow-200' },
    'Default': { bg: 'bg-gray-900', accent: 'border-gray-600', text: 'text-gray-200' }
};

const formatTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
        3: "Not a classroom, not a mall, yet many dreams begin here small, wehere help is granted to those who try your treassure moves where futures fly. ",
        4: "I stand by the road, round and tall, Show you yourself, no glass hall. Plants around me.",
        5: "Under my giant metal crown, Athletes cheer and never frown... Come here — where champions play! "
    } as Record<number, string>,
    gamma: {
        1: "Always stand in front of canteen but only get waste to eat.",
        2: "I point the way but never walked , I speak direction without talk. ",
        3: "A stage with screen where we showcase your talent/n find where I am!",
        4: "I am marked with lines but not a notebook I hold two nets yet catch no fish./n Seek me where whistle rule the air , here clue awaits where players dare!",
        5: "I give shadow in the sun and place to sit and to cheer like audience and have fun! "
    } as Record<number, string>,
};

export default function MobileStudentDashboard() {
    const router = useRouter();

    // State
    const [user, setUser] = useState<UserSession | null>(null);
    const [currentStage, setCurrentStage] = useState(0);
    const [gameStatus, setGameStatus] = useState('active');
    const [round2Password, setRound2Password] = useState('');
    const [isGameActive, setIsGameActive] = useState(false);
    const [globalStartTime, setGlobalStartTime] = useState<any>(null);
    const [teamJoinedAt, setTeamJoinedAt] = useState<number | null>(null);
    const [timer, setTimer] = useState("00:00:00");

    // UI State
    const [isScanning, setIsScanning] = useState(false);
    const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error' | 'idle', msg: string }>({ type: 'idle', msg: '' });
    const [gatekeeperInput, setGatekeeperInput] = useState('');
    const [showFinalModal, setShowFinalModal] = useState(false);

    // Load User
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            router.push('/');
            return;
        }
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setCurrentStage(parsedUser.currentStage);
        } catch (e) {
            router.push('/');
        }
    }, [router]);

    // Real-time Listeners
    useEffect(() => {
        if (!user?.teamId) return;

        const unsubConfig = onSnapshot(doc(db, "config", "metadata"), (d) => {
            if (d.exists()) {
                const data = d.data();
                setIsGameActive(data.isStarted);
                setGlobalStartTime(data.startTime);
            }
            else {
                setIsGameActive(false);
                setGlobalStartTime(null);
            }
        });

        const unsubTeam = onSnapshot(doc(db, "teams", user.teamId), (d) => {
            if (d.exists()) {
                const data = d.data();
                setCurrentStage(data.current_stage || 0);
                setGameStatus(data.status || 'active');
                setRound2Password(data.round2_password || '');
                if (data.createdAt || data.startedAt) {
                    setTeamJoinedAt(data.createdAt || data.startedAt);
                }
                // Check if already finished to show modal if refreshing? 
                // Suggestion: Only show modal on explicit action or if status is newly finished?
                // For now, let's keep it manual trigger via gatekeeper for the "Wow" effect, unless already finished.
                // If finished, maybe show smaller victory card as currently implemented.
            }
        });

        return () => { unsubConfig(); unsubTeam(); };
    }, [user?.teamId]);

    // Timer Logic (Late Joiner Fix - Math.max Logic)
    useEffect(() => {
        // 1. If tournament not started, force 00:00:00
        if (!isGameActive || !globalStartTime) {
            setTimer("00:00:00");
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();

            // Convert Firestore Timestamps to Milliseconds
            const globalStartMs = globalStartTime?.seconds ? globalStartTime.seconds * 1000 : globalStartTime.toDate().getTime();
            
            // Handle case where createdAt might be null (legacy teams) or pending
            let teamJoinMs = 0;
            if (teamJoinedAt) {
                // @ts-ignore - Handle flexible type (Timestamp or number)
                teamJoinMs = teamJoinedAt.seconds ? teamJoinedAt.seconds * 1000 : teamJoinedAt;
            }

            // CORE LOGIC: Take the LATEST time as the effective start
            // If Global(10:00) vs Team(11:00) -> Use Team(11:00)
            // This means: If team was already there -> Timer starts from globalStartTime
            //            If team joins LATE -> Timer starts from THEIR createdAt time
            const effectiveStartTime = Math.max(globalStartMs, teamJoinMs);

            const diff = now - effectiveStartTime;

            // Prevent negative values (if logic sync lags)
            if (diff < 0) {
                setTimer("00:00:00");
            } else {
                setTimer(formatTime(diff));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isGameActive, globalStartTime, teamJoinedAt]);

    const theme = MOBILE_THEMES[user?.house || 'Default'] || MOBILE_THEMES['Default'];
    const displayStage = currentStage + 1;
    const currentClue = user?.path ? (CLUE_DATA[user.path][displayStage] || "Wait for the next instruction...") : "Loading...";

    const getRevealedPassword = () => {
        if (!round2Password) return "????????".split('');
        const revealCount = Math.min(currentStage * 2, 8);
        return round2Password.substring(0, revealCount).padEnd(8, '_').split('');
    };

    // --- HANDLERS ---
    const handleScan = async (rawValue: string) => {
        if (!rawValue || !user || !isGameActive) return;

        try {
            let payload: QRPayload;
            try {
                payload = JSON.parse(rawValue);
            } catch {
                setScanFeedback({ type: 'error', msg: 'Invalid Rune!' });
                return;
            }

            if (payload.path_id !== user.path) {
                setScanFeedback({ type: 'error', msg: 'Wrong Path!' });
                if (currentStage > 0) {
                    updateDoc(doc(db, "teams", user.teamId), { score: increment(-10) });
                }
                return;
            }

            // STRICT SEQUENCE ENFORCEMENT
            if (payload.stage !== currentStage) {
                setScanFeedback({
                    type: 'error',
                    msg: `Wrong Sequence! You are on Stage ${currentStage}, but scanned Stage ${payload.stage}.`
                });
                // Optional: Keep penalty, or remove if user implies "stop immediately" without penalty. 
                // Maintaining penalty for consistency with "Wrong Clue" behavior, but blocking execution.
                if (currentStage > 0) {
                    updateDoc(doc(db, "teams", user.teamId), { score: increment(-10) });
                }
                return;
            }

            setScanFeedback({ type: 'success', msg: 'Rune Deciphered!' });

            setTimeout(async () => {
                setIsScanning(false);
                const teamRef = doc(db, "teams", user.teamId);
                await updateDoc(teamRef, {
                    current_stage: increment(1),
                    score: increment(20),
                    last_updated: serverTimestamp()
                });
            }, 1000);

        } catch (err) {
            setScanFeedback({ type: 'error', msg: 'Scan Failed' });
        }
    };

    const handleGatekeeper = async (e: React.FormEvent) => {
        e.preventDefault();
        if (gatekeeperInput.toUpperCase() === round2Password.toUpperCase()) {
            await updateDoc(doc(db, "teams", user!.teamId), { status: 'finished', finishedAt: serverTimestamp() });
            setShowFinalModal(true);
        } else {
            alert("The Gate remains shut.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        router.push('/');
    };

    if (!user) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className={`min-h-screen ${theme.bg} text-white font-cinzel relative pb-24`}>

            {/* Top Bar */}
            <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full border-2 ${theme.accent} bg-black flex items-center justify-center text-lg`}>
                        {user.house.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-wider">{user.teamName}</h2>
                        <p className={`text-[10px] ${theme.text} opacity-80`}>{user.house} • Stage {currentStage}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`font-mono font-bold text-lg ${theme.text} drop-shadow-[0_0_5px_currentColor]`}>
                        {timer}
                    </div>
                </div>
            </header>

            {/* Main Content Scroll */}
            <main className="p-4 space-y-6">

                {/* Game Inactive State */}
                {!isGameActive && (
                    <div className="bg-yellow-900/40 border border-yellow-600 rounded-lg p-6 text-center animate-pulse">
                        <h3 className="font-bold text-lg">Paused</h3>
                        <p className="text-sm opacity-80">Await the Headmaster.</p>
                    </div>
                )}

                {/* Victory Card (Shown if finished but modal closed/refreshed) */}
                {gameStatus === 'finished' && !showFinalModal && (
                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-900 rounded-xl p-8 text-center shadow-lg border-2 border-yellow-400">
                        <h1 className="text-4xl font-bold mb-2">VICTORY</h1>
                        <p>Quest Completed!</p>
                        <button
                            onClick={() => window.location.href = 'https://kahoot.it/'}
                            className="mt-4 px-6 py-2 bg-black/30 rounded-full border border-yellow-200 text-sm hover:bg-black/50"
                        >
                            Proceed to Round 2
                        </button>
                    </div>
                )}

                {/* Gatekeeper Mode */}
                {isGameActive && gameStatus !== 'finished' && currentStage >= 5 && (
                    <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-6 text-center space-y-4">
                        <h2 className="text-xl font-bold text-red-400">FINAL PORTAL</h2>
                        <p className="text-sm">Enter the Secret Password</p>
                        <form onSubmit={handleGatekeeper} className="flex flex-col gap-3">
                            <input
                                className="bg-black/50 border border-white/20 p-3 rounded text-center text-xl tracking-[0.2em]"
                                value={gatekeeperInput}
                                onChange={e => setGatekeeperInput(e.target.value)}
                                placeholder="PASSWORD"
                            />
                            <button type="submit" className="bg-red-600 py-3 rounded font-bold">UNLOCK</button>
                        </form>
                    </div>
                )}

                {/* Quest Card (Hide if finished or passed stage 5) */}
                {isGameActive && gameStatus !== 'finished' && currentStage < 5 && (
                    <section className="relative">
                        <QuestJournal
                            clue={currentClue}
                            stage={displayStage}
                            house={user.house}
                        />
                    </section>
                )}

                {/* Collected Fragments - Horizontal Scroll */}
                <section>
                    <h3 className="text-xs uppercase tracking-widest opacity-60 mb-3 ml-1">Collected Fragments</h3>
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                        {getRevealedPassword().map((char, i) => (
                            <div key={i} className={`flex-shrink-0 w-12 h-14 rounded border flex items-center justify-center text-xl font-bold shadow-sm
                                ${char !== '_'
                                    ? 'bg-[#fffdf5] text-black border-[#d7ccc8]'
                                    : 'bg-white/5 border-white/10 text-white/20'}
                            `}>
                                {char === '_' ? '?' : char}
                            </div>
                        ))}
                        {/* Placeholder for spacing */}
                        <div className="w-2 flex-shrink-0" />
                    </div>
                </section>

            </main>

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-40 flex items-center justify-between gap-4">

                {/* Logout - Small */}
                <button
                    onClick={handleLogout}
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
                >
                    <span className="text-xl">🚪</span>
                </button>

                {/* SCAN BUTTON - Conditionally Rendered */}
                {/* Condition: Stage <= 5 AND Not Finished AND Modal Not Open */}
                {isGameActive && gameStatus !== 'finished' && currentStage < 5 && !showFinalModal && (
                    <button
                        onClick={() => { setScanFeedback({ type: 'idle', msg: '' }); setIsScanning(true); }}
                        className={`flex-1 h-14 rounded-full bg-gradient-to-r ${theme.accent.includes('red') ? 'from-red-900 to-red-600' : 'from-indigo-900 to-blue-600'} flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/20 active:scale-95 transition-transform`}
                    >
                        <span className="text-2xl">📷</span>
                        <span className="font-bold tracking-widest text-lg">SCAN RUNE</span>
                    </button>
                )}
            </div>

            {/* Full Screen Scanner Overlay */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                    >
                        <div className="p-4 flex justify-end">
                            <button onClick={() => setIsScanning(false)} className="px-4 py-2 bg-white/10 rounded-full text-sm">Close</button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
                            <h2 className="text-2xl tracking-[0.2em] opacity-80 text-center">DECIPHER RUNE</h2>

                            {/* Scanner Box */}
                            <div className="relative w-full aspect-square max-w-[300px] border-2 border-white/50 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                                <Scanner
                                    onScan={(res) => {
                                        if (res && res.length > 0) handleScan(res[0].rawValue);
                                    }}
                                // paused={scanFeedback.type === 'success'} // Optional optimization
                                />
                                <motion.div
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_10px_red] z-10"
                                />
                            </div>

                            {/* Feedback */}
                            <div className="h-10 text-center">
                                {scanFeedback.type === 'success' && <p className="text-green-400 font-bold text-xl">{scanFeedback.msg}</p>}
                                {scanFeedback.type === 'error' && <p className="text-red-400 font-bold text-xl">{scanFeedback.msg}</p>}
                                {scanFeedback.type === 'idle' && <p className="text-white/50 animate-pulse">Align the QR Code...</p>}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FINAL CONGRATULATIONS MODAL */}
            <AnimatePresence>
                {showFinalModal && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-8"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-yellow-500 to-[#b45309] bg-clip-text text-transparent"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold tracking-widest drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                                CONGRATULATIONS!
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-white/80 text-lg md:text-xl leading-relaxed max-w-md"
                        >
                            Round 1 Completed. <br />
                            <span className="text-yellow-200">You have proven your worth.</span>
                        </motion.p>

                        <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ delay: 1, type: "spring" }}
                            onClick={() => window.location.href = 'https://kahoot.it/'}
                            className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-800 rounded-full border-2 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.6)] text-white text-xl font-bold tracking-[0.2em] relative overflow-hidden group"
                        >
                            <span className="relative z-10">ENTER ROUND 2</span>
                            <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>

                        {/* Confetti or Decor could go here later */}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );

}

// Add CSS animation for scanner line manually or in global css, but for now simple framer motion or standard css is fine.
// I used `animate-[scan_2s_infinite]` which implies a tailwind config, I should fallback to standard style or framer if not present.
// Let's replace the laser line with Framer Motion to be safe.
