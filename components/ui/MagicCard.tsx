import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface MagicCardProps {
    children: ReactNode;
    className?: string;
    title?: string;
}

export function MagicCard({ children, className, title }: MagicCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            className={twMerge(
                "relative bg-parchment p-8 rounded-sm shadow-2xl border-[3px] border-double border-burgundy/40",
                "before:absolute before:inset-1 before:border before:border-ink-black/10 before:pointer-events-none",
                "card-shadow",
                className
            )}
        >
            {title && (
                <h2 className="text-3xl font-cinzel font-bold text-center text-burgundy mb-6 border-b-2 border-burgundy/20 pb-2">
                    {title}
                </h2>
            )}
            {children}
        </motion.div>
    );
}
