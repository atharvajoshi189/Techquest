"use client";

import React from "react";
import { motion } from "framer-motion";

interface QuestJournalProps {
    clue: string;
    stage: number;
    house: string;
}

const HOUSE_ACCENTS: Record<string, string> = {
    'Gryffindor': 'border-red-600 text-red-800',
    'Slytherin': 'border-green-600 text-green-800',
    'Ravenclaw': 'border-blue-600 text-blue-800',
    'Hufflepuff': 'border-yellow-600 text-yellow-800'
};

export function QuestJournal({ clue, stage, house }: QuestJournalProps) {
    const accent = HOUSE_ACCENTS[house] || HOUSE_ACCENTS['Gryffindor'];

    return (
        <motion.div
            initial={{ rotate: -5, y: 50, opacity: 0 }}
            animate={{ rotate: -2, y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full max-w-lg perspective-1000 group mx-auto"
        >
            {/* Book Cover / Binding */}
            <div className="relative bg-[#3e2723] rounded-sm shadow-2xl p-[4px] transform transition-transform duration-500 group-hover:rotate-0">

                {/* Open Pages */}
                <div className="bg-[#f5e6c8] w-full min-h-[300px] rounded-sm p-6 relative shadow-inner overflow-hidden flex flex-col items-center">

                    {/* Paper Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-60 mix-blend-multiply pointer-events-none" />

                    {/* Decoration: Bookmark */}
                    <div className={`absolute top-0 right-8 w-6 h-24 bg-gradient-to-b from-red-700 to-red-900 shadow-md rounded-b-md transform -translate-y-2`} />

                    {/* Content */}
                    <div className="relative z-10 w-full text-center">
                        <h3 className={`font-cinzel font-bold text-xl uppercase tracking-widest border-b-2 ${accent.split(' ')[0]} pb-2 mb-4 inline-block`}>
                            Quest Log: Stage {stage}
                        </h3>

                        <div className="font-hand text-2xl md:text-3xl leading-relaxed text-[#3e2723] py-8">
                            &quot;{clue}&quot;
                        </div>

                        <div className="mt-8 opacity-60 flex justify-center">
                            <div className="w-16 h-16 border-2 border-[#5d4037] rounded-full flex items-center justify-center">
                                <span className="font-cinzel text-2xl text-[#5d4037]">?</span>
                            </div>
                        </div>
                    </div>

                    {/* Corner decorations */}
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#8d6e63]" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#8d6e63]" />
                </div>
            </div>
        </motion.div>
    );
}
