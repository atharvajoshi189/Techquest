import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Scanner } from '@yudiel/react-qr-scanner';
import { db } from '../../app/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment, runTransaction } from 'firebase/firestore';
import { QuestJournal } from '@/components/dashboard/QuestJournal';
import { GrandFinale } from '@/components/dashboard/GrandFinale';

// --- Types (Reused) ---
interface UserSession {
    teamId: string;
    teamName: string;
    leader: string;
    house: string;
    path: 'alpha' | 'beta' | 'gamma' | 'delta' | 'charlie' | 'bravo' | 'theta';
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
    delta: {
        1: " He knows every face, he knows every name,He guards your path each day the same.Where journeys begin and strangers wait,Your next clue rests with the man at the gate.",
        2: "Where codes begin and concepts load,A board displays the club you chose.Events and achievements proudly stand—Your next clue waits on this zenith land.",
        3: "Inside, Ashwa Riders shape with might;Outside, calm replaces light.Seek the seat that sways with grace—Your hidden clue is in that place.",
        4: "Where silence rules and pages glide,Your next clue waits where readers hide.",
        5: "Where IT minds guide every day,Their staff room stands along the way.But don’t step in—stay just outside,There your next hidden clues reside."
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
    // Normalize Stage: If 0 (Legacy/Not Started), treat as 1 (Start).
    const logicalStage = currentStage && currentStage > 0 ? currentStage : 1;
    const displayStage = logicalStage;
    const currentClue = (user?.path && CLUE_DATA[user.path]) ? (CLUE_DATA[user.path][displayStage] || "Wait for the next instruction...") : "Loading...";



    // --- HANDLERS ---
    // --- HANDLERS ---
    // --- HANDLERS ---
    const isProcessing = React.useRef(false);

    const handleScan = async (rawValue: string) => {
        // 0. PREVENT DOUBLE SCANS
        if (!rawValue || !user || !isGameActive || isProcessing.current) return;

        try {
            // 1. PARSE DATA STRICTLY
            const parsedData = JSON.parse(rawValue);
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
                // Optional: Penalty
                // updateDoc(doc(db, "teams", user.teamId), { score: increment(-10) });
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
                return;
            }

            // SAFETY: Prevent overflow
            if (currentTargetStage > 5) return;

            // 4. SUCCESS -> LOCK & UPDATE
            isProcessing.current = true; // Lock immediately
            setScanFeedback({ type: 'success', msg: 'Correct Rune! Decrypting...' });


            // 4. CHECK FOR COMPLETION (Stage 5)
            // IMMEDIATE STOP & ANIMATION
            if (scannedStage === 5) {
                setShowFinale(true); // Show Animation IMMEDIATELY

                // Update DB in background
                updateDoc(doc(db, "teams", user.teamId), {
                    current_stage: 6,
                    status: 'finished',
                    finishedAt: serverTimestamp(),
                    isFinished: true
                }).catch(err => console.error(err));

                return; // STOP Here
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
                    console.error("Firestore Update Failed:", updateErr);
                    if ((updateErr as Error).message === "STAGE_MISMATCH") {
                        setScanFeedback({ type: 'error', msg: 'Syncing... try again.' });
                    } else {
                        setScanFeedback({ type: 'error', msg: 'System Error: Save Failed' });
                    }
                } finally {
                    // Release lock after safe delay
                    setTimeout(() => {
                        isProcessing.current = false;
                        setIsScanning(false);
                    }, 1500);
                }
            }, 800);

        } catch (err) {
            console.error("Scan Error", err);
            setScanFeedback({ type: 'error', msg: 'Invalid Rune Data' });
            isProcessing.current = false;
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

                {/* Row 3: House & Path Badges */}
                <div className="flex justify-center gap-3">
                    <span className={`text-[10px] bg-white/5 px-3 py-1 rounded-full border border-white/10 ${theme.text} uppercase tracking-widest shadow-sm`}>
                        {user.house}
                    </span>
                    <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full border border-white/10 text-purple-300 uppercase tracking-widest shadow-sm">
                        {user.path} Path
                    </span>
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
                    <h3 className="text-xs uppercase tracking-widest opacity-60 mb-3 ml-1">The Elder Wand</h3>
                    <div className="flex justify-between gap-2 p-3 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm">
                        {[1, 2, 3, 4, 5].map((index) => {
                            const isUnlocked = index < currentStage;
                            return (
                                <div key={index} className={`relative flex items-center justify-center w-12 h-14 rounded-lg border transition-all duration-500 ${isUnlocked ? 'border-yellow-500/50 bg-yellow-900/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-white/5 bg-white/5'}`}>
                                    <img
                                        src={isUnlocked ? `/assets/frag${index}.png` : '/assets/lock.png'}
                                        alt={isUnlocked ? `Fragment ${index}` : 'Locked'}
                                        className={`w-8 h-8 object-contain transition-all duration-500 ${isUnlocked ? 'drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] scale-110' : 'opacity-20 grayscale scale-90'}`}
                                    />
                                    {isUnlocked && <div className="absolute inset-0 bg-yellow-500/10 blur-md rounded-lg" />}
                                </div>
                            );
                        })}
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
                                    scanDelay={2000}
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
