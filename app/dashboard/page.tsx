"use client";
import React, { useEffect, useState, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
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
import { ElderWand } from '@/components/dashboard/ElderWand';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// --- Types ---
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
        1: "A shiny circle, simple and bright,\nFriends gather here, smiles in sight.\nPhones go up, memories stay,\nFind me where selfies light the way.",
        2: "Wheels don’t move, yet journeys start,\nRoutes and timings play their part.\nStudents gather, questions flow,\nFind the place where bus plans grow.",
        3: "Where student voices find their say,\nGrowth and guidance lead the way.\nStudent Affairs shapes you well,\nFind your clue at the SADC Cell.",
        4: "Dreams take shape and futures call,\nGuidance here prepares you all.\nSkills and paths begin to gel,\nFind your clue at the Career Development Cell.",
        5: "Beside the swing where laughter stays,\nA looping seat curves both ways.\nNo start, no end, just a flowing line,\nFind your clue where shapes entwine."
    } as Record<number, string>,
    beta: {
        1: "A fresh new path where footsteps rise,\nConnecting floors before your eyes.\nIn Block B, steps lead you high,\nFind your clue where levels tie.",
        2: "Not for bikes, but cars align,\nReserved for guides who teach and shine.\nFour wheels rest in ordered lines,\nFind your clue where faculty park their rides.",
        3: "A frame that points to stars above,\nStanding proud where minds all move.\nIn Block A, it catches the eye,\nFind your clue where the heavens lie.",
        4: "Dressed in lights and shades of green,\nA festive sight that’s always seen.\nOrnaments glow for all to see,\nFind your clue beneath the Christmas tree.",
        5: "Where silence begins, just outside the door,\nBooks rest inside, knowledge galore.\nSteps slow down, whispers stay,\nFind your clue where readers pause and stay."
    } as Record<number, string>,
    charlie: {
        1: "Where guiding hearts quietly stay, The home of our fathers leads the way. Not inside—your clue is just outside— Seek the spot where wisdom seems to reside.",
        2: "Between Block A and Block B lies a lawn of green, Guarded by a board that keeps it clean. No footsteps allowed on this quiet ground— Your next clue waits just at its boundary found.",
        3: "Where Civil minds plan stone and steel, Their staff room holds ideas real. But your clue is not inside that door— It waits just outside, on the corridor floor.",
        4: "Where engines rest and duties start, Faculty park with careful art. Not inside the cars you’ll roam— Your next clue waits where they call home.",
        5: "Where numbers rule and records stay, The Accounts Section leads the way. Not inside, but near this place— Your next clue waits in silent grace."
    } as Record<number, string>,
    bravo: {
        1: "Where every journey inside begins,\nAnd help is offered with a smile.\nFind your clue where questions go—\nThe first desk everyone will know",
        2: "I do not teach, yet I decide.\nI hold no class, yet futures hide.\nBetween the pen and final score,\nI guard what students wait for more.",
        3: "Not a classroom, not a hall,\nYet many dreams begin here small.\nWhere help is granted to those who try,\nYour treasure moves where futures fly.",
        4: "This path is broken, the clue is gone.\nSeek the admin to help you on.\n(Clue 4 Missing from instructions)",
        5: "I hold no chalk, yet shape every class.\nI teach no lesson, yet all must pass.\nDecisions rest behind a single door—\nFind your clue where authority sits at core"
    } as Record<number, string>,
    theta: {
        1: "Close to tools but calm and neat, A never-ending place to sit. Search the sign that has no end— Your next clue waits where curves bend.",
        2: "I rise in steps but carry none, I lead somewhere yet lead to none. Search Block B where knowledge stays— Your treasure waits on unused ways.",
        3: "Behind a desk of calm command, A guiding force for every plan. Look for the place where wisdom leads,all the decision of college is taken here— Your clue moves where order breeds",
        4: "No chalk, no class, yet teachers stand, Captured still by a careful hand. Seek the wall where wisdom stays— Your next clue waits in framed displays in B block.",
        5: "Resumes rise and interviews start, CDC place prepares you for your part. Seek the room where goals align— Your next clue waits where careers shine"
    } as Record<number, string>,
    omega: {
        1: "A computer science branch that deals with bussiness management system",
        2: "a frame in block A that sync with theme of technex.",
        3: "I go up and down but never walk, I carry many without a talk. Find your clue where buttons decide— The silent helper by your side.",
        4: "Relativity and E=mc^2 once he taught, Through time and space his ideas fought. Look for the face that changed the view— Your next clue waits in A block where thoughts break through",
        5: "Where signals travel and circuits speak, Where logic flows both strong and sleek. Find your clue where waves are sent— The ETC wing is where you’re meant."
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
    const [teamFinishedAt, setTeamFinishedAt] = useState<any>(null);
    const [timer, setTimer] = useState("00:00:00");

    // UI State
    const [showIntro, setShowIntro] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error' | 'idle', msg: string }>({ type: 'idle', msg: '' });

    const [showFinalModal, setShowFinalModal] = useState(false);
    const [showFinale, setShowFinale] = useState(false);

    const [isDisqualified, setIsDisqualified] = useState(false);

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
                setIsDisqualified(data.isDisqualified || false); // <--- WATCH DISQUALIFICATION

                // Priority: Use createdAt (ServerTimestamp) if available, else startedAt (Legacy Number)
                const joinTime = data.createdAt || data.startedAt;
                if (joinTime) {
                    setTeamJoinedAt(joinTime);
                }
                if (data.finishedAt) {
                    setTeamFinishedAt(data.finishedAt);
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

        // If finished, we don't need an interval, just set it once (which we did above) and return.
        if (teamFinishedAt) return;

        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [isGameActive, globalStartTime, teamJoinedAt, teamFinishedAt]);

    // 4. ANTI-CHEAT: THREE-STRIKE SYSTEM
    const violationCount = useRef(0);

    useEffect(() => {
        if (!user?.teamId || isDisqualified) return;

        // A. TAB SWITCH LISTENER
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                violationCount.current += 1;

                if (violationCount.current === 1) {
                    toast.error("⚠️ WARNING: Don't switch tabs! Next time you will be DISQUALIFIED.", { duration: 5000, icon: '🚨' });
                } else if (violationCount.current >= 2) {
                    // PERMANENT BAN
                    try {
                        await updateDoc(doc(db, 'teams', user.teamId), { isDisqualified: true });
                    } catch (e) {
                        console.error("Ban failed", e);
                    }
                }
            }
        };

        // B. BACK BUTTON LISTENER (Instant Death)
        const handleBackAttempt = async () => {
            // Immediately ban on back button attempt
            try {
                await updateDoc(doc(db, 'teams', user.teamId), { isDisqualified: true });
            } catch (e) {
                console.error("Ban failed", e);
            }
        };

        // Trap Back Button
        window.history.pushState(null, "", window.location.href);

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("popstate", handleBackAttempt);

        // C. PREVENT CONTEXT MENU (Right Click)
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);


        // CLEANUP
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("popstate", handleBackAttempt);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [user?.teamId, isDisqualified]);

    // 3. Derived State
    const theme = THEME_CONFIG[user?.house || 'Default'] || THEME_CONFIG['Default'];

    // Get Clue based on Path & Stage
    // Normalize Stage: If 0 (Legacy/Not Started), treat as 1 (Start).
    const logicalStage = currentStage && currentStage > 0 ? currentStage : 1;
    const displayStage = logicalStage;
    const normalizedPath = user?.path?.toLowerCase() as keyof typeof CLUE_DATA;
    const currentClue = (normalizedPath && CLUE_DATA[normalizedPath])
        ? (CLUE_DATA[normalizedPath][displayStage] || "Wait for the next instruction...")
        : "Loading Destiny...";



    // Handlers
    // Handlers
    const [isProcessingState, setIsProcessingState] = useState(false);
    const lastScanTime = React.useRef(0);

    const handleScan = async (rawValue: string) => {
        const now = Date.now();
        if (now - lastScanTime.current < 2000) return; // 2s Cooldown

        // Robustness: Trim whitespace
        const cleanValue = rawValue?.trim();

        if (!cleanValue || !user || !isGameActive || isProcessingState) return;

        setIsProcessingState(true);
        lastScanTime.current = now;

        try {
            // 1. Attempts to Parse JSON (Strict Requirement)
            let payload: QRPayload;
            try {
                payload = JSON.parse(cleanValue);
            } catch {
                setScanFeedback({ type: 'error', msg: 'Invalid Rune Format!' });
                setIsProcessingState(false);
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
                if (currentStage > 0) {
                    updateDoc(doc(db, "teams", user.teamId), { score: increment(-5) }).catch(() => { });
                }
                setIsProcessingState(false);
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
                if (currentStage > 0) {
                    updateDoc(doc(db, "teams", user.teamId), { score: increment(-5) }).catch(() => { });
                }
                setIsProcessingState(false);
                return;
            }

            // SAFETY
            if (currentTargetStage > 5) {
                setIsProcessingState(false);
                return;
            }

            // --- SUCCESS ---

            // 4. CHECK FOR COMPLETION (Stage 5)
            // IMMEDIATE STOP & ANIMATION
            if (scannedStage === 5) {
                setShowFinale(true); // Show Animation IMMEDIATELY
                setScanFeedback({ type: 'success', msg: 'Victory!' }); // Feedback

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
                    // Silent fail
                } finally {
                    setIsProcessingState(false);
                }

                return; // STOP EXECUTION
            }

            // --- STANDARD SUCCESS ---
            setScanFeedback({ type: 'success', msg: 'Correct Rune! Decrypting...' }); // <--- GREEN FEEDBACK IMMEDIATELY

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
                    if ((updateErr as Error).message === "STAGE_MISMATCH") {
                        setScanFeedback({ type: 'error', msg: 'Syncing... try again.' });
                    } else {
                        setScanFeedback({ type: 'error', msg: 'Save Failed!' });
                    }
                } finally {
                    setTimeout(() => {
                        setIsProcessingState(false);
                        setIsScanning(false);
                    }, 1500);
                }
            }, 800);

        } catch (err) {
            setScanFeedback({ type: 'error', msg: 'The Lens is clouded... Try again.' });
            setTimeout(() => setIsProcessingState(false), 2000);
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

    if (isDisqualified) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-center p-8 z-50 fixed inset-0">
                <h1 className="text-6xl md:text-8xl font-bold text-red-600 mb-4 font-nosifer tracking-widest drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">ELIMINATED</h1>
                <div className="w-full max-w-md h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent my-8" />
                <p className="text-xl md:text-2xl text-white font-cinzel">Reason: Suspicious Activity Detected.</p>
                <p className="text-red-400 mt-4 text-sm tracking-widest uppercase">Contact Event Admin</p>
                <Toaster position="top-center" />
            </div>
        );
    }

    if (isMobile) {
        return (
            <>
                <Toaster position="top-center" reverseOrder={false} />
                <MobileStudentDashboard />
            </>
        );
    }

    return (
        <ErrorBoundary>
            <div className={`min-h-screen relative overflow-hidden font-cinzel text-white transition-all duration-1000 ${theme.bgGradient}`}>
                <Toaster position="top-center" reverseOrder={false} />
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

                                {/* Path Badge Hidden */}
                                {/* <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 uppercase">Path Assigned:</span>
                                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
                                    {user.path}
                                </span>
                            </div> */}
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
                                    {/* <InventoryPouch revealedPassword="" /> */}

                                    {/* The Elder Wand - Fragments */}
                                    <section>
                                        <ElderWand currentStage={currentStage} />
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
                                    onError={(error) => {
                                        console.error(error);
                                        setScanFeedback({ type: 'error', msg: 'Camera Error: Check Permissions' });
                                    }}
                                    scanDelay={500}
                                    paused={scanFeedback.type === 'success'}
                                    formats={['qr_code']}
                                    constraints={{ facingMode: 'environment' }}
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
        </ErrorBoundary>
    );
}
