"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Confetti from "react-confetti";

interface Player {
  id: string;
  nickname: string;
  character_type: string;
  score: number;
  is_alive: boolean;
  joined_at: string;
}

interface GameCompletion {
  id: string;
  player_id: string;
  room_id: string;
  final_health: number;
  correct_answers: number;
  total_questions_answered: number;
  is_eliminated: boolean;
  completion_type: string;
  completed_at: string;
}

interface GameRoom {
  id: string;
  room_code: string;
  title: string;
  status: string;
  max_players: number;
  current_phase: string;
}

const characterGifs = [
  { src: "/character/character.gif", alt: "Karakter Hijau", color: "bg-green-500", type: "robot1", name: "Hijau" },
  { src: "/character/character1.gif", alt: "Karakter Biru", color: "bg-blue-500", type: "robot2", name: "Biru" },
  { src: "/character/character2.gif", alt: "Karakter Merah", color: "bg-red-500", type: "robot3", name: "Merah" },
  { src: "/character/character3.gif", alt: "Karakter Ungu", color: "bg-purple-500", type: "robot4", name: "Ungu" },
  { src: "/character/character4.gif", alt: "Karakter Oranye", color: "bg-orange-500", type: "robot5", name: "Oranye" },
  { src: "/character/character5.gif", alt: "Karakter Kuning", color: "bg-yellow-500", type: "robot6", name: "Kuning" },
  { src: "/character/character6.gif", alt: "Karakter Abu-abu", color: "bg-gray-500", type: "robot7", name: "Abu-abu" },
  { src: "/character/character7.gif", alt: "Karakter Pink", color: "bg-pink-500", type: "robot8", name: "Pink" },
  { src: "/character/character8.gif", alt: "Karakter Cokelat", color: "bg-brown-500", type: "robot9", name: "Cokelat" },
  { src: "/character/character9.gif", alt: "Karakter Emas", color: "bg-yellow-600", type: "robot10", name: "Emas" },
];

export default function ResultsHostPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [completions, setCompletions] = useState<GameCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const getCharacterByType = (type: string) => {
    return characterGifs.find((char) => char.type === type) || characterGifs[0];
  };

  // Fetch game data
  useEffect(() => {
    const fetchGameData = async () => {
      if (!roomCode) {
        setLoadingError("Kode ruangan tidak valid");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch game room
        const { data: room, error: roomError } = await supabase
          .from("game_rooms")
          .select("*")
          .eq("room_code", roomCode.toUpperCase())
          .single();

        if (roomError || !room) {
          throw new Error("Ruangan tidak ditemukan");
        }
        setGameRoom(room);

        // Fetch players
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("*")
          .eq("room_id", room.id)
          .order("score", { ascending: false });

        if (playersError) {
          throw new Error("Gagal mengambil data pemain");
        }
        setPlayers(playersData || []);

        // Fetch completions
        const { data: completionData, error: completionError } = await supabase
          .from("game_completions")
          .select("*")
          .eq("room_id", room.id)
          .order("completed_at", { ascending: true });

        if (completionError) {
          throw new Error("Gagal mengambil data penyelesaian");
        }
        setCompletions(completionData || []);

        // Trigger confetti for winners
        if (completionData.some((c) => !c.is_eliminated)) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
        setLoadingError("Gagal memuat hasil permainan. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [roomCode]);

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-2xl font-mono"
        >
          Memuat Hasil Permainan...
        </motion.div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-2xl font-mono"
        >
          {loadingError}
        </motion.div>
      </div>
    );
  }

  const winners = completions
    .filter((c) => !c.is_eliminated)
    .map((c) => players.find((p) => p.id === c.player_id))
    .filter((p): p is Player => p !== undefined);

  const eliminated = completions
    .filter((c) => c.is_eliminated)
    .map((c) => players.find((p) => p.id === c.player_id))
    .filter((p): p is Player => p !== undefined);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white font-mono overflow-hidden">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={["#ff0000", "#ffd700", "#00ff00", "#1e90ff"]}
        />
      )}

      <audio src="/musics/victory.mp3" autoPlay />

      <div className="container mx-auto px-4 py-8">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-center mb-12 text-red-300 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]"
        >
          Hasil Permainan - {gameRoom?.title}
        </motion.h1>

        {/* Winners Section */}
        {winners.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-yellow-300 mb-6 text-center">Pemenang 🏆</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {winners.map((player, index) => {
                const character = getCharacterByType(player.character_type);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gray-800/80 border border-yellow-500/50 rounded-lg p-6 flex items-center space-x-4 hover:bg-gray-700/80 transition-all duration-300"
                  >
                    <Image
                      src={character.src}
                      alt={character.alt}
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-yellow-300">{player.nickname}</h3>
                      <p className="text-gray-300">Skor: {player.score}</p>
                      <p className="text-gray-400">Karakter: {character.name}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Eliminated Players Section */}
        {eliminated.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-red-500 mb-6 text-center">Pemain Tersingkir 😢</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eliminated.map((player, index) => {
                const character = getCharacterByType(player.character_type);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    className="bg-gray-800/80 border border-red-500/50 rounded-lg p-6 flex items-center space-x-4 hover:bg-gray-700/80 transition-all duration-300"
                  >
                    <Image
                      src={character.src}
                      alt={character.alt}
                      width={80}
                      height={80}
                      className="object-contain opacity-60"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-red-300">{player.nickname}</h3>
                      <p className="text-gray-300">Skor: {player.score}</p>
                      <p className="text-gray-400">Karakter: {character.name}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <button
            onClick={() => router.push("/")}
            className="bg-red-600 hover:bg-red-500 text-white font-mono py-3 px-6 rounded-lg text-lg transition-all duration-300"
          >
            Kembali ke Menu Utama
          </button>
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(26, 0, 0, 0.8);
          border-left: 2px solid rgba(255, 0, 0, 0.3);
          box-shadow: inset 0 0 6px rgba(255, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b0000, #ff0000);
          border-radius: 6px;
          border: 2px solid rgba(255, 0, 0, 0.5);
          box-shadow: 0 0 8px rgba(255, 0, 0, 0.7);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ff0000, #8b0000);
          box-shadow: 0 0 12px rgba(255, 0, 0, 0.9);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #ff0000 rgba(26, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
}