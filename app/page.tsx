"use client";

import Image from "next/image";
import { AdminButton } from "@/components/ui/AdminButton";
import { StudentLogin } from "@/components/ui/StudentLogin";
import { Preloader } from "@/components/ui/Preloader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blind, setBlind] = useState(false);

  useEffect(() => {
    // Check if user has already seen the intro in this session
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    if (hasSeenIntro) {
      setLoading(false);
    }
  }, []);

  const handlePreloaderComplete = () => {
    sessionStorage.setItem("hasSeenIntro", "true");
    setLoading(false);
  };

  const handleLoginSuccess = () => {
    // Trigger the blinding light overlay
    setBlind(true);
    // After delay, navigate
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <Preloader key="preloader" onComplete={handlePreloaderComplete} />
      ) : (
        <motion.main
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="min-h-screen w-full relative overflow-hidden bg-obsidian flex flex-col items-center"
        >
          {/* 
            ========================================
            1. BACKGROUND FOUNDATION (Deep Space) 
            ======================================== 
          */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/admin.webp"
              alt="Cosmic Void"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            {/* Color Grading Overlay for cohesiveness */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 mix-blend-multiply" />
          </div>


          {/* 
            ========================================
            2. HEADER SECTION (Technex + TechQuest)
            ======================================== 
          */}
          <header className="relative z-20 w-full flex flex-col items-center pt-8">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative w-[400px] h-[133px] md:w-[800px] md:h-[200px]"
            >
              <Image
                src="/Technex_26_name.webp"
                alt="Technex 26"
                fill
                className="object-contain drop-shadow-[0_0_25px_rgba(139,92,246,0.6)]"
                priority
              />
            </motion.div>

          </header>


          {/* 
            ========================================
            3. ADMIN BUTTON (Top Right)
            ======================================== 
          */}
          <div className="absolute top-6 right-6 z-30">
            <AdminButton />
          </div>


          {/* 
            ========================================
            4. CENTER: THE FLOATING GRIMOIRE (Login)
            ======================================== 
          */}
          <div className="flex-1 flex flex-col items-center justify-center w-full relative z-20 pb-20">
            <StudentLogin onLoginSuccess={handleLoginSuccess} />
          </div>


          {/* 
            ========================================
            5. BLINDING LIGHT TRANSITION OVERLAY
            ======================================== 
          */}
          <AnimatePresence>
            {blind && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "circIn" }}
                className="fixed inset-0 z-[100] bg-white pointer-events-none flex items-center justify-center"
              >
                {/* Optional: Final message before redirect */}
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  transition={{ delay: 0.5 }}
                  className="text-amber-500 font-cinzel text-4xl font-bold tracking-widest"
                >
                  WELCOME
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.main>
      )}
    </AnimatePresence>
  );
}
