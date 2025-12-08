"use client";
import React, { useState } from 'react';
import { MagicCard } from '@/components/ui/MagicCard';
import { useRouter } from 'next/navigation';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function LoginPage() {
    const router = useRouter();
    const [teamName, setTeamName] = useState('');
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName || !passcode) {
            setError('The parchment cannot be empty!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Query Firestore for matching Team Name and Passcode
            const q = query(
                collection(db, "teams"),
                where("name", "==", teamName),
                where("passcode", "==", passcode)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Success!
                const teamDoc = querySnapshot.docs[0];
                const teamData = teamDoc.data();

                localStorage.setItem('teamId', teamDoc.id);
                localStorage.setItem('teamName', teamData.name);
                localStorage.setItem('teamHouse', teamData.house || 'Gryffindor'); // Default fallback

                router.push('/dashboard');
            } else {
                setError("Invalid Team Name or Passcode. The Fat Lady denies entry!");
            }
        } catch (err: unknown) {
            console.error("Login failed", err);
            setError("Connection spell failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <MagicCard title="Champion Login">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center font-cinzel text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-ink-black font-sans font-bold mb-2">Team Name</label>
                            <input
                                type="text"
                                className="w-full bg-white/50 border-2 border-burgundy/20 rounded p-3 font-sans focus:border-gold outline-none transition-colors"
                                placeholder="e.g. Gryffindor"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-ink-black font-sans font-bold mb-2">Secret Passcode</label>
                            <input
                                type="text"
                                className="w-full bg-white/50 border-2 border-burgundy/20 rounded p-3 font-sans focus:border-gold outline-none transition-colors"
                                placeholder="********"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-burgundy text-gold font-cinzel font-bold py-4 rounded shadow-lg hover:bg-burgundy/90 transition-all border-2 border-gold transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Divining..." : "Alohomora (Login)"}
                        </button>
                    </form>
                </MagicCard>
            </div>
        </div>
    );
}
