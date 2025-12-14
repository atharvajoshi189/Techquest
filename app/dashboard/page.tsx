"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { IntroVideo } from '@/components/IntroVideo';
import { Scanner } from '@yudiel/react-qr-scanner';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment, runTransaction } from 'firebase/firestore';
import { QuestJournal } from '@/components/dashboard/QuestJournal';
import { InventoryPouch } from '@/components/dashboard/InventoryPouch';
import useIsMobile from '@/hooks/useIsMobile';
import MobileStudentDashboard from '@/components/dashboard/MobileStudentDashboard';
import { GrandFinale } from '@/components/dashboard/GrandFinale';

// --- Types ---
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
        1: "He knows every face, he knows every name, He guards your path each day the same. Where journeys begin and strangers wait, Your next clue rests with the man at the gate..",
        2: "I point the way but never walked , I speak direction without talk. ",
        3: "Where silence rules and pages glide, Your next clue waits where readers hide.",
        4: "I am marked with lines but not a notebook I hold two nets yet catch no fish./n Seek me where whistle rule the air , here clue awaits where players dare!",
        5: "Always stand in front of canteen but only get waste to eat."
    } as Record<number, string>,
    delta: {
        1: "Where codes begin and concepts load, A board displays the club you chose. Events and achievements proudly stand— Your next clue waits on this zenith land.",
        2: "A stage with screen where we showcase your talent. Find where I am!",
        3: "Inside, Ashwa Riders shape with might; Outside, calm replaces light. Seek the seat that sways with grace— Your hidden clue is in that place.",
        4: "Where IT minds guide every day, Their staff room stands along the way. But don’t step in—stay just outside, There your next hidden clues reside.",
        5: "I give shadow in the sun and place to sit and to cheer like audience and have fun!"
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

// --- Main Component ---

export default function StudentDashboard() {
    const router = useRouter();
    const isMobile = useIsMobile();

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
    const [showIntro, setShowIntro] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error' | 'idle', msg: string }>({ type: 'idle', msg: '' });

    const [showFinalModal, setShowFinalModal] = useState(false);
    const [showFinale, setShowFinale] = useState(false);

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
        // Game Settings (Metadata)
        const unsubConfig = onSnapshot(doc(db, "config", "metadata"), (d) => {
            if (d.exists()) {
                const data = d.data();
                setIsGameActive(data.isStarted);
                setGlobalStartTime(data.startTime);
            } else {
                setIsGameActive(false);
                setGlobalStartTime(null);
            }
        });

        // Team Progress
        const unsubTeam = onSnapshot(doc(db, "teams", user.teamId), (d) => {
            if (d.exists()) {
                const data = d.data();
                setCurrentStage(data.current_stage || 0);
                setGameStatus(data.status || 'active');
                setRound2Password(data.round2_password || '');
                // Ensure retrieval of startedAt/createdAt.
                // Priority: Use createdAt (ServerTimestamp) if available, else startedAt (Legacy Number)
                const joinTime = data.createdAt || data.startedAt;
                if (joinTime) {
                    setTeamJoinedAt(joinTime);
                }
            }
        });

        return () => { unsubConfig(); unsubTeam(); };
    }, [user?.teamId]);

    // 3. Timer Logic (Late Joiner Fix - Math.max Logic)
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

    // 3. Derived State
    const theme = THEME_CONFIG[user?.house || 'Default'] || THEME_CONFIG['Default'];

    // Get Clue based on Path & Stage
    // Normalize Stage: If 0 (Legacy/Not Started), treat as 1 (Start).
    const logicalStage = currentStage && currentStage > 0 ? currentStage : 1;
    const displayStage = logicalStage;
    const currentClue = (user?.path && CLUE_DATA[user.path])
        ? (CLUE_DATA[user.path][displayStage] || "Wait for the next instruction...")
        : "Loading Destiny...";



    // Handlers
    // Handlers
    const isProcessing = React.useRef(false);

    const handleScan = async (rawValue: string) => {
        if (!rawValue || !user || !isGameActive || isProcessing.current) return;

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

            const scannedPath = payload.path_id?.toLowerCase();
            const userPath = user.path?.toLowerCase();
            const scannedStage = Number(payload.stage);

            // Normalize Target: If 0, looking for 1.
            const currentTargetStage = Number(logicalStage);


            // 2. CHECK PATH (Strict)
            if (scannedPath && scannedPath !== userPath) {
                setScanFeedback({ type: 'error', msg: `Wrong Path! You are ${userPath?.toUpperCase()}.` });
                // Deduct points for wrong scan
                if (user.currentStage > 0) {
                    updateDoc(doc(db, "teams", user.teamId), { score: increment(-5) }).catch(console.error);
                }
                return;
            }

            // 3. CHECK SEQUENCE (Lock & Key)
            if (scannedStage !== currentTargetStage) {
                if (scannedStage < currentTargetStage) {
                    setScanFeedback({ type: 'error', msg: `Already Completed Stage ${scannedStage}!` });
                } else {
                    setScanFeedback({ type: 'error', msg: `Sequence Break! Find Stage ${currentTargetStage} first.` });
                }
                // Penalty
                if (user.currentStage > 0) {
                    updateDoc(doc(db, "teams", user.teamId), { score: increment(-5) }).catch(console.error);
                }
                return;
            }

            // SAFETY
            if (currentTargetStage > 5) return;

            // --- SUCCESS ---

            // 4. CHECK FOR COMPLETION (Stage 5)
            // IMMEDIATE STOP & ANIMATION
            if (scannedStage === 5) {
                setShowFinale(true); // Show Animation IMMEDIATELY

                // Update DB in background (mark as finished)
                updateDoc(doc(db, "teams", user.teamId), {
                    current_stage: 6,
                    status: 'finished', // Ensure status is marked finished
                    finishedAt: serverTimestamp(),
                    isFinished: true // Explicit flag if needed
                }).catch(err => console.error("Finale Update Error", err));

                return; // STOP EXECUTION - Do not run standard success logic
            }

            // Wait a moment for the user to see success
            setTimeout(async () => {
                // Update Firestore with transactional lock to prevent multi-skip
                const teamRef = doc(db, "teams", user.teamId);

                try {
                    await runTransaction(db, async (transaction) => {
                        const snap = await transaction.get(teamRef);
                        if (!snap.exists()) throw new Error("TEAM_MISSING");

                        const data = snap.data() as any;
                        const dbStageRaw = data?.current_stage ?? 1;
                        const dbStage = dbStageRaw > 0 ? dbStageRaw : 1;

                        // If DB is ahead/behind our expected, abort to avoid skips
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
                    console.error("Firestore Update Failed", updateErr);
                    if ((updateErr as Error).message === "STAGE_MISMATCH") {
                        setScanFeedback({ type: 'error', msg: 'Syncing... try again.' });
                    } else {
                        setScanFeedback({ type: 'error', msg: 'Save Failed!' });
                    }
                } finally {
                    setTimeout(() => {
                        isProcessing.current = false;
                        setIsScanning(false);
                    }, 1500);
                }
            }, 800);

        } catch (err) {
            console.error("Scan Error", err);
            setScanFeedback({ type: 'error', msg: 'The Lens is clouded... Try again.' });
            isProcessing.current = false;
        }
    };



    const handleStartScanning = () => {
        setScanFeedback({ type: 'idle', msg: '' });
        setIsScanning(true);
    };

    if (!user) return <div className="bg-black text-white h-screen flex items-center justify-center">Summoning Wizard...</div>;

    // --- 0. INTRO VIDEO FLOW (Enforce for BOTH) ---
    if (showIntro) {
        return (
            <AnimatePresence>
                <IntroVideo
                    house={user.house}
                    videoSrc={`/videos_${user.house.charAt(0).toLowerCase()}.webm`}
                    onComplete={() => setShowIntro(false)}
                />
            </AnimatePresence>
        );
    }

    if (isMobile) {
        return <MobileStudentDashboard />;
    }

    return (
        <div className={`min-h-screen relative overflow-hidden font-cinzel text-white transition-all duration-1000 ${theme.bgGradient}`}>

            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay" />


            {/* Main Content */}
            {!showIntro && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-4 md:gap-6 pb-20 md:pb-8"
                >

                    {/* HEADER START (3-Column Grid) */}
                    <div className={`fixed top-0 left-0 w-full h-24 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 grid grid-cols-3 px-8 items-center shadow-2xl transition-all duration-300`}>

                        {/* 1. LEFT: Identity */}
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-cyan-400 tracking-[0.2em] uppercase mb-1">Welcome Champion</span>
                            <h1 className="text-2xl font-bold text-white tracking-wider drop-shadow-md">{user.teamName}</h1>
                        </div>

                        {/* 2. CENTER: The Master Clock */}
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Mission Timer</span>
                            <div className="text-5xl font-mono font-bold text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                                {timer}
                            </div>
                        </div>

                        {/* 3. RIGHT: Status */}
                        <div className="flex flex-col items-end gap-2">
                            {/* House Badge */}
                            <div className="px-4 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                                <span className="text-sm font-bold text-white tracking-widest uppercase">
                                    {user.house}
                                </span>
                            </div>

                            {/* Path Badge */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 uppercase">Path Assigned:</span>
                                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
                                    {user.path}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* HEADER END */}

                    {/* SPACER for Fixed Header */}
                    <div className="h-24 w-full" />

                    {/* Game Status or content */}
                    {!isGameActive ? (
                        <div className="text-center py-10 md:py-20">
                            <h2 className="text-xl md:text-3xl font-bold animate-pulse text-yellow-500">The Tournament is Paused</h2>
                            <p className="opacity-60 mt-2 text-sm md:text-base">The Headmaster is speaking...</p>
                        </div>
                    ) : gameStatus === 'finished' ? (
                        <div className="p-4 md:p-8 rounded-2xl bg-black/60 border border-yellow-500 text-center space-y-4 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                            <h1 className="text-3xl md:text-5xl font-bold text-yellow-400">CONGRATULATIONS</h1>
                            <p className="text-base md:text-xl">You have successfully completed Round-1.</p>
                            <p className="text-white/60 text-sm">The results will be announced soon...</p>
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
                                <InventoryPouch revealedPassword="" />

                                {/* The Elder Wand - Fragments */}
                                <section>
                                    <h3 className="text-xs uppercase tracking-widest opacity-60 mb-3 ml-1 text-white">The Elder Wand</h3>
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
                            type="button"
                            onClick={() => setIsScanning(false)}
                            aria-label="Close scanner"
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
                                scanDelay={2000}
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

            {/* GRAND FINALE ANIMATION */}
            {showFinale && <GrandFinale />}

            {/* FINAL MODAL UPDATED */}
            <AnimatePresence>
                {showFinalModal && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-6"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-yellow-500 tracking-widest drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                            CONGRATULATIONS
                        </h1>
                        <p className="text-white/80 text-xl">
                            You have successfully completed Round-1
                        </p>
                        <p className="text-white/60 text-lg animate-pulse">
                            The results will be announced soon...
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
