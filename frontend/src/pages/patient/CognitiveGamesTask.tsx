import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { calculateNormedDigitSpanScore } from "../../lib/normedScoring";

interface CognitiveGamesTaskProps {
  sessionId: string;
  age?: number;
  education?: string;
  onComplete?: (score: number) => void;
}

export const CognitiveGamesTask: React.FC<CognitiveGamesTaskProps> = ({
  sessionId,
  age = 60,
  education = "secondary",
  onComplete,
}) => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [gamePhase, setGamePhase] = useState<"intro" | "showing" | "input" | "complete">("intro");
  const [currentLevel, setCurrentLevel] = useState(3);
  const [digits, setDigits] = useState<number[]>([]);
  const [userInput, setUserInput] = useState("");
  const [maxSpan, setMaxSpan] = useState(0);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const generateSequence = (length: number) => {
    const seq = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * 9) + 1);
    }
    return seq;
  };

  const startNextRound = (level: number) => {
    const seq = generateSequence(level);
    setDigits(seq);
    setUserInput("");
    setGamePhase("showing");

    // Hide sequence after presentation time (1s per digit)
    setTimeout(() => {
      setGamePhase("input");
    }, level * 1000 + 500);
  };

  const handleStartGame = () => {
    setCurrentLevel(3);
    setMaxSpan(0);
    startNextRound(3);
  };

  const handleVerifySequence = (e: React.FormEvent) => {
    e.preventDefault();
    const correctString = digits.join("");
    if (userInput.trim() === correctString) {
      // Success! Level up
      const nextLvl = currentLevel + 1;
      setMaxSpan(currentLevel);
      setCurrentLevel(nextLvl);
      startNextRound(nextLvl);
    } else {
      // Game Over — submit normed score
      finishGame(maxSpan);
    }
  };

  const finishGame = async (achievedSpan: number) => {
    const normed = calculateNormedDigitSpanScore(achievedSpan, age, education);
    setScoreResult(normed);
    setGamePhase("complete");
    setSubmitting(true);

    try {
      await fetch(`${API_URL}/api/sessions/cognitive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          game_type: "digit_span",
          raw_events: { max_span: achievedSpan },
          age_band: normed.age_band,
          education_band: normed.education_band,
          sub_score: normed.sub_score,
        }),
      });
    } catch {
      // Continue locally
    } finally {
      setSubmitting(false);
      onComplete?.(normed.sub_score);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6 max-w-xl mx-auto text-slate-200">
      <div className="border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
            Cognitive Mini-Game: Digit Span Memory
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Normed against age band ({calculateNormedDigitSpanScore(3, age, education).age_band}) & education.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-violet-500/20 text-violet-300 font-mono">
          Level: {currentLevel}
        </span>
      </div>

      {gamePhase === "intro" && (
        <div className="space-y-4 text-center py-4">
          <div className="text-4xl">🧠</div>
          <p className="text-slate-300 text-xs max-w-md mx-auto leading-relaxed">
            You will be shown a sequence of numbers one by one. Remember the numbers and type them back in exact order.
          </p>
          <button
            onClick={handleStartGame}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-lg shadow-violet-600/30 transition-all"
          >
            Start Digit Span Game
          </button>
        </div>
      )}

      {gamePhase === "showing" && (
        <div className="py-10 text-center space-y-4">
          <div className="text-xs text-slate-400">Memorize the sequence:</div>
          <div className="text-5xl font-extrabold tracking-widest text-violet-400 font-mono animate-pulse">
            {digits.join("  ")}
          </div>
        </div>
      )}

      {gamePhase === "input" && (
        <form onSubmit={handleVerifySequence} className="py-6 space-y-4 text-center">
          <div className="text-xs text-slate-300">Type the sequence in order:</div>
          <input
            type="text"
            autoFocus
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Type digits..."
            className="w-48 text-center text-2xl font-mono bg-slate-800 border border-white/20 rounded-xl py-2 text-white focus:outline-none focus:border-violet-500"
          />
          <div>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
            >
              Submit Answer
            </button>
          </div>
        </form>
      )}

      {gamePhase === "complete" && scoreResult && (
        <div className="py-6 space-y-4 text-center border-t border-white/10">
          <div className="text-3xl">🎉</div>
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
            Digit Span Completed
          </h3>
          <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto bg-slate-800/40 p-4 rounded-xl text-xs border border-white/5">
            <div>
              <span className="text-slate-400 block">Highest Span Achieved:</span>
              <span className="text-white font-bold text-base">{maxSpan} digits</span>
            </div>
            <div>
              <span className="text-slate-400 block">Normed Baseline:</span>
              <span className="text-white font-bold text-base">{scoreResult.expected_baseline} digits</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-white/5">
              <span className="text-slate-400 block">Normed Sub-Score:</span>
              <span className="text-violet-400 font-bold text-lg">
                {(scoreResult.sub_score * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Adjusted for {scoreResult.age_band} age & {scoreResult.education_band} education norms.
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/patient")}
            disabled={submitting}
            className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
