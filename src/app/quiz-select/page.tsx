"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skull, Bone, HeartPulse, Search, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import debounce from "lodash/debounce"

export default function QuizSelectPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [flickerText, setFlickerText] = useState(true)
  const [bloodDrips, setBloodDrips] = useState<Array<{ id: number; left: number; speed: number; delay: number }>>([])
  const [atmosphereText, setAtmosphereText] = useState("Select Quiz to start")
  const [isClient, setIsClient] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalQuizzes, setTotalQuizzes] = useState(0)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const quizzesPerPage = 12
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const atmosphereTexts = [
    "You don't know who is behind you",
    "Screams of fear were heard everywhere",
    "You have to be right or you'll be caught",

  ]

  useEffect(() => {
    setIsClient(true)

    const fetchQuizzes = async () => {
      setIsLoading(true)
      try {
        const { count, error: countError } = await supabase
          .from("quizzes")
          .select("*", { count: "exact", head: true })
        if (countError) throw countError
        setTotalQuizzes(count || 0)

        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .range((currentPage - 1) * quizzesPerPage, currentPage * quizzesPerPage - 1)
        if (error) throw error
        setQuizzes(data || [])
        setFilteredQuizzes(data || [])
      } catch (error) {
        console.error("Error fetching quizzes:", error)
        alert("Gagal memuat kuis!")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuizzes()

    const generateBlood = () => {
      const newBlood = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        speed: 0.5 + Math.random() * 2,
        delay: Math.random() * 5,
      }))
      setBloodDrips(newBlood)
    }

    generateBlood()
    const bloodInterval = setInterval(() => {
      generateBlood()
    }, 8000)

    const flickerInterval = setInterval(() => {
      setFlickerText((prev) => !prev)
    }, 150)

    const textInterval = setInterval(() => {
      setAtmosphereText(atmosphereTexts[Math.floor(Math.random() * atmosphereTexts.length)])
    }, 2500)

    return () => {
      clearInterval(bloodInterval)
      clearInterval(flickerInterval)
      clearInterval(textInterval)
    }
  }, [currentPage])

  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        const lowerTerm = term.toLowerCase()
        const filtered = quizzes.filter(
          (quiz) =>
            quiz.theme?.toLowerCase().includes(lowerTerm) ||
            quiz.description?.toLowerCase().includes(lowerTerm)
        )
        setFilteredQuizzes(filtered)
      }, 300),
    [quizzes]
  )

  useEffect(() => {
    debouncedSearch(searchTerm)
    return () => debouncedSearch.cancel()
  }, [searchTerm, debouncedSearch])

  const generateRoomCode = useCallback(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }, [])

  const handleQuizSelect = useCallback(
    async (quizId: string) => {
      setIsCreating(true)
      try {
        const roomCode = generateRoomCode()
        const { data, error } = await supabase
          .from("game_rooms")
          .insert({
            room_code: roomCode,
            title: "QuizRush",
            quiz_id: quizId,
          })
          .select()
          .single()

        if (error) throw error

        router.push(`/character-select/${roomCode}`)
      } catch (error) {
        console.error("Error creating game:", error)
        alert("Gagal membuat game!")
      } finally {
        setIsCreating(false)
      }
    },
    [router, generateRoomCode]
  )

  const handleBackClick = useCallback(() => {
    router.push("/")
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleSearchOpen = useCallback(() => {
    setIsSearchOpen(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }, [])

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false)
    setSearchTerm("") // Reset search term to clear results
  }, [])

  const totalPages = Math.ceil(totalQuizzes / quizzesPerPage)

  const bloodSpots = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: i * 10 + 5,
        top: i * 10 + 5,
        opacity: 0.3 + (i % 4) * 0.1,
      })),
    []
  )

  const floatingIcons = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: i * 12 + 10,
        top: i * 12 + 10,
        fontSize: 2 + (i % 3),
        animationDelay: i * 0.5,
        animationDuration: 15 + (i % 5),
        isSkull: i % 2 === 0,
      })),
    []
  )

  return (
    <div className="min-h-screen bg-black relative overflow-hidden select-none flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-black to-purple-900/5">
        {isClient && (
          <div className="absolute inset-0 opacity-20">
            {bloodSpots.map((spot) => (
              <div
                key={spot.id}
                className="absolute w-64 h-64 bg-red-900 rounded-full mix-blend-multiply blur-xl"
                style={{
                  left: `${spot.left}%`,
                  top: `${spot.top}%`,
                  opacity: spot.opacity,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {isClient &&
        bloodDrips.map((drip) => (
          <div
            key={drip.id}
            className="absolute top-0 w-0.5 h-20 bg-red-600/80 animate-fall"
            style={{
              left: `${drip.left}%`,
              animation: `fall ${drip.speed}s linear ${drip.delay}s infinite`,
              opacity: 0.7 + Math.random() * 0.3,
            }}
          />
        ))}

      {isClient && (
        <div className="absolute inset-0 pointer-events-none">
          {floatingIcons.map((icon) => (
            <div
              key={icon.id}
              className="absolute text-red-900/20 animate-float"
              style={{
                left: `${icon.left}%`,
                top: `${icon.top}%`,
                fontSize: `${icon.fontSize}rem`,
                animationDelay: `${icon.animationDelay}s`,
                animationDuration: `${icon.animationDuration}s`,
              }}
            >
              {icon.isSkull ? <Skull /> : <Bone />}
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJzY3JhdGNoZXMiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj48cGF0aCBkPSJNMCAwTDUwMCA1MDAiIHN0cm9rZT0icmdiYSgyNTUsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNMCAxMDBMNTAwIDYwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwwLDAsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0wIDIwMEw1MDAgNzAwIiBzdHJva2U9InJnYmEoMjU1LDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3NjcmF0Y2hlcykiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')] opacity-20" />

      <div className="absolute top-0 left-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen pt-2 pb-6">
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-2 left-2 text-red-500 hover:bg-red-900/20 z-30"
          onClick={handleBackClick}
          disabled={isCreating}
        >
          <HeartPulse className="h-6 w-6 animate-pulse" />
        </Button>

        <div className="w-full max-w-6xl mx-auto flex flex-col flex-5 px-2 md:px-3">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-4"
          >
            <h1
              className={`text-4xl md:text-6xl font-bold font-mono tracking-wider transition-all duration-150 ${
                flickerText ? "text-red-500 opacity-100" : "text-red-900 opacity-30"
              } drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]`}
              style={{ textShadow: "0 0 10px rgba(239, 68, 68, 0.7)" }}
            >
              Select Quiz
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-red-400/80 text-sm md:text-lg font-mono animate-pulse tracking-wider mt-2"
            >
              {atmosphereText}
            </motion.p>
          </motion.div>

          {/* Search Button */}
          <div className="max-w-md mx-auto mb-4">
            <Button
              variant="outline"
              className="bg-black/50 border-red-500/50 text-red-400 hover:bg-red-900/20 text-sm font-mono h-9 rounded-xl animate-pulse-glow w-full"
              onClick={handleSearchOpen}
            >
              <Search className="h-4 w-4 mr-2" />
              look for quizzes
            </Button>
          </div>

          {/* Search Input and Results */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-md mx-auto mb-4"
              >
                <div className="relative">
                  <Input
                    ref={searchInputRef}
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/70 border-red-500/50 text-red-400 placeholder:text-red-400/50 text-base font-mono h-12 rounded-xl focus:border-red-500 focus:ring-red-500/30 pr-10 backdrop-blur-sm animate-pulse-glow"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400/80 hover:text-red-400"
                    onClick={handleSearchClose}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Search Results */}
                {searchTerm && filteredQuizzes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 max-h-[50vh] overflow-y-auto custom-scrollbar"
                  >
                    {filteredQuizzes.map((quiz) => (
                      <motion.div
                        key={quiz.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full mb-2"
                      >
                        <Card
                          className="bg-black/40 border-red-500/20 hover:border-red-500 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                          onClick={() => handleQuizSelect(quiz.id)}
                        >
                          <CardHeader className="pb-1">
                            <CardTitle className="text-red-400 font-mono text-base line-clamp-2">{quiz.theme}</CardTitle>
                            <CardDescription className="text-red-400/80 text-xs line-clamp-3">
                              {quiz.description || "Kuis seru untuk dimainkan!"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-red-400 text-xs font-mono">Durasi: {quiz.duration} menit</div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Empty Search State */}
                {searchTerm && filteredQuizzes.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center text-red-400/80 text-base font-mono mt-4"
                  >
                    Tidak ada kuis yang cocok dengan pencarian.
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quiz Grid or Loading State */}
          {isLoading ? (
            <div className=" justify-center items-center h-64 ">
              <Loader2 className="h-12 w-12 text-red-500 animate-spin" />
            </div>
          ) : !isSearchOpen || !searchTerm ? (
            filteredQuizzes.length === 0 ? (
              <div className="text-center text-red-400/80 text-base font-mono flex-1 flex items-center justify-center">
                Tidak ada kuis yang ditemukan.
              </div>
            ) : (
              <div className="flex flex-col flex-">
                <div
                  className={`${
                    filteredQuizzes.length <= 4
                      ? "flex flex-wrap justify-center gap-4"
                      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                  } max-w-full mx-auto flex-1`}
                >
                  {filteredQuizzes.map((quiz) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (quiz.id % 4), duration: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      className={`group ${filteredQuizzes.length <= 4 ? "w-full max-w-sm" : "w-full"}`}
                    >
                      <Card
                        className="bg-black/40 border-red-500/20 hover:border-red-500 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] h-full"
                        onClick={() => handleQuizSelect(quiz.id)}
                      >
                        <CardHeader className="pb-1">
                          <CardTitle className="text-red-400 font-mono text-base line-clamp-2">{quiz.theme}</CardTitle>
                          <CardDescription className="text-red-400/80 text-xs line-clamp-3">
                            {quiz.description || "Kuis seru untuk dimainkan!"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-red-400 text-xs font-mono">Durasi: {quiz.duration} menit</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      className="bg-black/50 border-red-500/50 text-red-400 hover:bg-red-900/20 text-sm py-1"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isCreating}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-red-400 font-mono text-sm self-center">
                      page {currentPage} from {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      className="bg-black/50 border-red-500/50 text-red-400 hover:bg-red-900/20 text-sm py-1"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || isCreating} 
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </motion.div>
              </div>
            )
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fall {
          to {
            transform: translateY(100vh);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
            box-shadow: 0 0 15px 5px rgba(239, 68, 68, 0.4);
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(26, 0, 0, 0.8);
          border-left: 2px solid rgba(255, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b0000, #ff0000);
          border-radius: 4px;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
    </div>
  )
}