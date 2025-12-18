import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Scanner } from '@yudiel/react-qr-scanner';
import { db } from '../../app/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment, runTransaction } from 'firebase/firestore';
import { QuestJournal } from '@/components/dashboard/QuestJournal';
import { GrandFinale } from '@/components/dashboard/GrandFinale';
import { ElderWand } from '@/components/dashboard/ElderWand';

// --- Types (Reused) ---
interface UserSession {
    teamId: string;
    teamName: string;
    leader: string;
    house: string;
    path: 'alpha' | 'beta' | 'charlie' | 'bravo' | 'theta' | 'omega';
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
        5: "A Christmas tree standing tall and bright,\nOutside Block B, a festive sight.\nWith lights and gifts in branches free,\nFind the clue where it loves to be"
    } as Record<number, string>,
    beta: {
        1: "A plate of noodles and a drink so cool, A poster here makes you drool.",
        2: "I’m the hub where minds huddle — find me! ",
        3: "Not a classroom, not a mall, yet many dreams begin here small, wehere help is granted to those who try your treassure moves where futures fly. ",
        4: "I stand by the road, round and tall, Show you yourself, no glass hall. Plants around me.",
        5: "Under my giant metal crown, Athletes cheer and never frown... Come here — where champions play! "
    } as Record<number, string>,
    charlie: {
        1: "Where guiding hearts quietly stay, The home of our fathers leads the way. Not inside—your clue is just outside— Seek the spot where wisdom seems to reside.",
        2: "Between Block A and Block B lies a lawn of green, Guarded by a board that keeps it clean. No footsteps allowed on this quiet ground— Your next clue waits just at its boundary found.",
        3: "Where Civil minds plan stone and steel, Their staff room holds ideas real. But your clue is not inside that door— It waits just outside, on the corridor floor.",
        4: "Where engines rest and duties start, Faculty park with careful art. Not inside the cars you’ll roam— Your next clue waits where they call home.",
        5: "Where numbers rule and records stay, The Accounts Section leads the way. Not inside, but near this place— Your next clue waits in silent grace."
    } as Record<number, string>,
    bravo: {
        1: "Beneath the yellow Lipton sign, Where orange walls and queues align, A tiny window serves its taste— Find this stall, your clue’s in place.",
        2: "Where tools ring loud and sparks may fly, Where ideas are built, not just passed by. Seek the place where machines awake— Your next clue waits where makers make",
        3: "I watch the space where A meets B, A frame of red in walls of yellow glee. I look upon the corner where you sit, With many dark glass squares, the shadows knit.",
        4: "Where data and achievements proudly stand, A colourful board made by a clever hand. Right outside the DS staffroom door, That’s the place you’re looking for.",
        5: "Look for the little pink box on the wall, It sits beneath the dark window for all. It holds a long hose to help put out flame, Find this spot between Block A and B for the game."
    } as Record<number, string>,
    theta: {
        1: "Close to tools but calm and neat, A never-ending place to sit. Search the sign that has no end— Your next clue waits where curves bend.",
        2: "I rise in steps but carry none, I lead somewhere yet lead to none. Search Block B where knowledge stays— Your treasure waits on unused ways.",
        3: "Behind a desk of calm command, A guiding force for every plan. Look for the place where wisdom leads— Your treasure moves where order breeds",
        4: "No chalk, no class, yet teachers stand, Captured still by a careful hand. Seek the wall where wisdom stays— Your next clue waits in framed displays",
        5: "Resumes rise and interviews start, This place prepares you for your part. Seek the room where goals align— Your next clue waits where careers shine"
    } as Record<number, string>,
    omega: {
        1: "A computer science branch that deals with bussiness management system .",
        2: "a frame in block A that sync with theme of technex.",
        3: "I go up and down but never walk, I carry many without a talk. Find your clue where buttons decide— The silent helper by your side.",
        4: "Relativity and E=mc^2 once he taught, Through time and space his ideas fought. Look for the face that changed the view— Your next clue waits where thoughts break through",
        5: "Where signals travel and circuits speak, Where logic flows both strong and sleek. Find your clue where waves are sent— The ETC wing is where you’re meant."
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
    const [teamFinishedAt, setTeamFinishedAt] = useState<any>(null);
    const [timer, setTimer] = useState("00:00:00");

    // UI State
    const [isScanning, setIsScanning] = useState(false);
    const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error' | 'idle', msg: string }>({ type: 'idle', msg: '' });

    const [showFinalModal, setShowFinalModal] = useState(false);
    const [showFinale, setShowFinale] = useState(false);

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

        // PRELOAD ASSETS FOR FINALE
        const preloadImages = [
            "/assets/frag1.png", "/assets/frag2.png", "/assets/frag3.png",
            "/assets/frag4.png", "/assets/frag5.png", "/assets/elder_wand_full.png",
            "/assets/space-bg.jpg"
        ];
        preloadImages.forEach((src) => {
            const img = new Image();
            img.src = src;
        });

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
                if (data.finishedAt) {
                    setTeamFinishedAt(data.finishedAt);
                }

                // FORCE REFRESH IF DISQUALIFIED
                if (data.isDisqualified) {
                    // If we want the parent to handle it, we can just rely on state?
                    // But MobileDashboard seems standalone in logic sometimes.
                    // Parent page.tsx will unmount us if it detects it.
                    // But let's be safe.
                }
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

        const updateTimer = () => {
            const now = teamFinishedAt ? (teamFinishedAt.seconds ? teamFinishedAt.seconds * 1000 : teamFinishedAt.toDate().getTime()) : Date.now();

            // Convert Firestore Timestamps to Milliseconds
            const globalStartMs = globalStartTime?.seconds ? globalStartTime.seconds * 1000 : globalStartTime.toDate().getTime();

            // Handle case where createdAt might be null (legacy teams) or pending
            let teamJoinMs = 0;
            if (teamJoinedAt) {
                // @ts-ignore - Handle flexible type (Timestamp or number)
                teamJoinMs = teamJoinedAt.seconds ? teamJoinedAt.seconds * 1000 : teamJoinedAt;
            }

            // CORE LOGIC: Take the LATEST time as the effective start
            const effectiveStartTime = Math.max(globalStartMs, teamJoinMs);

            const diff = now - effectiveStartTime;

            // Prevent negative values (if logic sync lags)
            if (diff < 0) {
                setTimer("00:00:00");
            } else {
                setTimer(formatTime(diff));
            }
        };

        // Initial call
        updateTimer();

        // If finished, stop updating
        if (teamFinishedAt) return;

        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [isGameActive, globalStartTime, teamJoinedAt, teamFinishedAt]);

    // 4. ANTI-CHEAT: THREE-STRIKE SYSTEM (Mobile)
    const violationCount = useRef(0);

    useEffect(() => {
        // User check
        if (!user?.teamId) return;

        // A. TAB SWITCH LISTENER
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                violationCount.current += 1;

                if (violationCount.current === 1) {
                    toast.error("⚠️ WARNING: Don't switch tabs/apps! Next violation = DISQUALIFICATION.", { duration: 5000, icon: '🚨' });
                } else if (violationCount.current >= 2) {
                    try {
                        await updateDoc(doc(db, 'teams', user.teamId), { isDisqualified: true });
                    } catch (e) { console.error(e); }
                }
            }
        };

        // B. BACK BUTTON LISTENER
        const handleBackAttempt = async () => {
            try {
                await updateDoc(doc(db, 'teams', user.teamId), { isDisqualified: true });
            } catch (e) { console.error(e); }
        };

        const lockNavigation = () => {
            window.history.pushState(null, document.title, window.location.href);
        };
        lockNavigation();

        window.addEventListener('popstate', handleBackAttempt);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Prevent Context Menu
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);


        return () => {
            window.removeEventListener('popstate', handleBackAttempt);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [user?.teamId]);

    const theme = MOBILE_THEMES[user?.house || 'Default'] || MOBILE_THEMES['Default'];
    // Normalize Stage: If 0 (Legacy/Not Started), treat as 1 (Start).
    const logicalStage = currentStage && currentStage > 0 ? currentStage : 1;
    const displayStage = logicalStage;
    const normalizedPath = user?.path?.toLowerCase() as keyof typeof CLUE_DATA;
    const currentClue = (normalizedPath && CLUE_DATA[normalizedPath]) ? (CLUE_DATA[normalizedPath][displayStage] || "Wait for the next instruction...") : "Loading...";



    // --- HANDLERS ---
    // --- HANDLERS ---
    const [isProcessingState, setIsProcessingState] = useState(false);
    const lastScanTime = React.useRef(0); // Cooldown Ref

    const handleScan = async (rawValue: string) => {
        // 0. PREVENT DOUBLE SCANS & COOLDOWN
        const now = Date.now();
        if (now - lastScanTime.current < 2000) return; // 2 Seconds Cooldown (Adjusted)

        // Robustness: Trim
        const cleanValue = rawValue?.trim();
        if (!cleanValue || !user || !isGameActive || isProcessingState) return;

        setIsProcessingState(true); // Lock UI immediately
        lastScanTime.current = now; // Update scan time

        try {
            // 1. PARSE DATA STRICTLY
            const parsedData = JSON.parse(cleanValue);
            // Ensure types are correct
            const scannedStage = Number(parsedData.stage);
            const scannedPath = parsedData.path_id?.toLowerCase();
            const userPath = user.path?.toLowerCase();

            // Assume currentStage (live state) is the stage they are LOOKING FOR (Target).
            // Normalize: If 0, they are looking for Stage 1.
            const currentTargetStage = Number(logicalStage);

            // 2. PATH CHECK (Strict)
            if (scannedPath && scannedPath !== userPath) {
                setScanFeedback({ type: 'error', msg: `Wrong Path! You are ${userPath?.toUpperCase()}.` });
                // Penalty for wrong path
                if (currentStage > 0) {
                    updateDoc(doc(db, "teams", user.teamId), { score: increment(-5) });
                }
                return;
            }

            // 3. SEQUENCE CHECK ("Lock & Key")
            // Strict Equality: The scanned stage MUST match the current target stage.
            if (scannedStage !== currentTargetStage) {
                if (scannedStage < currentTargetStage) {
                    setScanFeedback({ type: 'error', msg: `Already Completed Stage ${scannedStage}!` });
                } else {
                    setScanFeedback({ type: 'error', msg: `Sequence Break! Find Stage ${currentTargetStage} first.` });
                }
                // Penalty for sequence break
                if (currentStage > 0) {
                    updateDoc(doc(db, "teams", user.teamId), { score: increment(-5) });
                }
                return;
            }

            // SAFETY: Prevent overflow
            if (currentTargetStage > 5) return;

            // 4. SUCCESS -> LOCK & UPDATE
            // isProcessingState already true
            setScanFeedback({ type: 'success', msg: 'Correct Rune! Decrypting...' });


            // 4. CHECK FOR COMPLETION (Stage 5)
            // IMMEDIATE STOP & ANIMATION
            if (scannedStage === 5) {
                setShowFinale(true); // Show Animation IMMEDIATELY

                // Update DB in background using Transaction for safety
                try {
                    await runTransaction(db, async (transaction) => {
                        const teamRef = doc(db, "teams", user.teamId);
                        const teamDoc = await transaction.get(teamRef);
                        if (!teamDoc.exists()) throw new Error("Team not found");

                        const currentScore = teamDoc.data().score || 0;

                        transaction.update(teamRef, {
                            current_stage: 6,
                            status: 'finished',
                            finishedAt: serverTimestamp(),
                            isFinished: true,
                            score: currentScore + 20 // Explicit calculation
                        });
                    });
                } catch (e) {
                    // Silent fail or toast
                } finally {
                    setIsProcessingState(false);
                }

                return; // STOP EXECUTION
            }

            setTimeout(async () => {
                const teamRef = doc(db, "teams", user.teamId);

                try {
                    await runTransaction(db, async (transaction) => {
                        const snap = await transaction.get(teamRef);
                        if (!snap.exists()) throw new Error("TEAM_MISSING");

                        const data = snap.data() as any;
                        const dbStageRaw = data?.current_stage ?? 1;
                        const dbStage = dbStageRaw > 0 ? dbStageRaw : 1;

                        if (dbStage !== currentTargetStage) {
                            throw new Error("STAGE_MISMATCH");
                        }

                        transaction.update(teamRef, {
                            current_stage: dbStage + 1,
                            score: (data?.score || 0) + 20,
                            last_updated: serverTimestamp()
                        });
                    });
                } catch (updateErr) {
                    if ((updateErr as Error).message === "STAGE_MISMATCH") {
                        setScanFeedback({ type: 'error', msg: 'Syncing... try again.' });
                    } else {
                        setScanFeedback({ type: 'error', msg: 'System Error: Save Failed' });
                    }
                } finally {
                    // Release lock after safe delay
                    setTimeout(() => {
                        setIsProcessingState(false);
                        setIsScanning(false);
                    }, 1500);
                }
            }, 800);

        } catch (err) {
            setScanFeedback({ type: 'error', msg: 'Invalid Rune Data' });
            // FORCE UNLOCK ON ERROR
            setTimeout(() => setIsProcessingState(false), 2000);
        }
    };



    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        router.push('/');
    };

    if (!user) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className={`min-h-screen ${theme.bg} text-white font-cinzel relative pb-24 overflow-hidden`}>
            {/* Stardust Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />

            {/* Top Bar */}
            {/* Top Bar (Redesigned Vertical Layout) */}
            <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-md border-b border-white/10 p-4 flex flex-col w-full">

                {/* Row 1: Welcome & Logout */}
                <div className="flex justify-between items-center w-full mb-1">
                    <div className="text-gray-400 text-[10px] uppercase tracking-widest leading-tight">
                        Welcome Champion <br />
                        <span className="text-white text-sm md:text-base font-bold">{user.teamName}</span>
                    </div>
                </div>

                {/* Row 2: Hero Timer */}
                <div className="flex justify-center items-center my-2">
                    <div className={`text-4xl font-mono font-bold ${theme.text} drop-shadow-[0_0_15px_currentColor] tracking-widest`}>
                        {timer}
                    </div>
                </div>

                {/* Row 3: House Badge Only */}
                <div className="flex justify-center gap-3">
                    <span className={`text-[10px] bg-white/5 px-3 py-1 rounded-full border border-white/10 ${theme.text} uppercase tracking-widest shadow-sm`}>
                        {user.house}
                    </span>
                    {/* Path Hidden as per request */}
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
                        <h1 className="text-3xl font-bold mb-2">CONGRATULATIONS</h1>
                        <p>You have successfully completed Round-1.</p>
                        <p className="text-sm opacity-80 mt-2">The results will be announced soon...</p>
                    </div>
                )}



                {/* Quest Card (Hide if finished or passed stage 5) */}
                {isGameActive && gameStatus !== 'finished' && (
                    <section className="relative">
                        <QuestJournal
                            clue={currentClue}
                            stage={displayStage}
                            house={user.house}
                        />
                    </section>
                )}

                {/* The Elder Wand - Fragments */}
                <section>
                    <ElderWand currentStage={currentStage} />
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
                {isGameActive && gameStatus !== 'finished' && !showFinalModal && (
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
                                    scanDelay={500}
                                    onError={(error) => setScanFeedback({ type: 'error', msg: 'Camera Access Denied' })}
                                    formats={['qr_code']}
                                    constraints={{ facingMode: 'environment' }}
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

            {/* GRAND FINALE ANIMATION */}
            {showFinale && <GrandFinale />}

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
                            className="text-white/80 text-lg md:text-xl leading-relaxed"
                        >
                            You have successfully completed Round-1
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-white/60 text-base animate-pulse"
                        >
                            The results will be announced soon...
                        </motion.p>

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
