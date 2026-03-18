import { useState, useRef, useEffect } from 'react';
import './App.css';

/* ══════════════════════════════════════════════════════
   OBSIDIAN — Hot & Cold Semantic Word Game
   Real API Integration
   ══════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:8000';

// ── API Functions ──
async function fetchDailyInfo() {
  const res = await fetch(`${API_BASE}/daily-info`);
  if (!res.ok) throw new Error('Failed to fetch daily info');
  return res.json();
}

async function submitGuess(word) {
  const res = await fetch(`${API_BASE}/daily-guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess_word: word }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Unknown error');
  }

  const data = await res.json();
  return {
    rank: data.rank,
    total: data.total_words,
    score: data.score,
    label: data.label,
    percentile: data.percentile,
  };
}

// ── Temperature helpers ──
function getTempClass(label) {
  switch (label) {
    case '🎯': return 'temp-match';
    case '🔥': return 'temp-lava';
    case '☀️': return 'temp-warm';
    case '❄️': return 'temp-cold';
    case '🧊': return 'temp-frozen';
    default:   return 'temp-frozen';
  }
}

function getRankClass(label) {
  switch (label) {
    case '🎯': return 'rank-match';
    case '🔥': return 'rank-lava';
    case '☀️': return 'rank-warm';
    case '❄️': return 'rank-cold';
    case '🧊': return 'rank-frozen';
    default:   return 'rank-frozen';
  }
}

function isMatch(label) {
  return label === '🎯';
}

// ── Pixel SVG Icons ──
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="7" y="3" width="2" height="2" fill="currentColor" />
      <rect x="7" y="7" width="2" height="6" fill="currentColor" />
      <rect x="5" y="7" width="2" height="2" fill="currentColor" />
      <rect x="5" y="11" width="6" height="2" fill="currentColor" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="2" fill="currentColor" />
      <rect x="2" y="7" width="12" height="2" fill="currentColor" />
      <rect x="2" y="11" width="12" height="2" fill="currentColor" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════

function HeaderBar({ puzzleNumber }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="title">
          <span className="title-lava">OBS</span>
          <span className="title-ice">IDIAN</span>
        </h1>
        <span className="puzzle-number">#{puzzleNumber ?? '...'}</span>
      </div>
      <div className="header-right">
        <button className="icon-btn" aria-label="Info">
          <InfoIcon />
        </button>
        <button className="icon-btn" aria-label="Menu">
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}

function renderLabel(label) {
  if (label === '🔥') {
    return <img src="/fire.gif" alt="🔥" className="fire-gif" />;
  }
  return label;
}

function GuessCounter({ count }) {
  return (
    <div className="guess-counter">
      GUESSES: {count}
    </div>
  );
}

function InputArea({ value, onChange, onSubmit, disabled, error }) {
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="input-area">
      <div className="input-row">
        <input
          ref={inputRef}
          type="text"
          className="guess-input"
          placeholder="Try a word..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
        />
        <button
          className="guess-btn"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
        >
          GUESS
        </button>
      </div>
      {error ? (
        <p className="error-message">{error}</p>
      ) : (
        <p className="hint-text">Keep guessing! Try as many as you want.</p>
      )}
    </div>
  );
}

function GuessRow({ guess, isLatest }) {
  const rowClass = [
    'guess-row',
    isLatest ? 'latest' : '',
    isMatch(guess.label) ? 'winner' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={rowClass}>
      <span className="guess-word">{guess.word}</span>
      <div className="guess-info">
        {guess.isDuplicate && (
          <span className="duplicate-badge">[ALREADY GUESSED]</span>
        )}
        <span className={`temp-tag ${getTempClass(guess.label)}`}>
          {renderLabel(guess.label)}
        </span>
        <span className={`rank-number ${getRankClass(guess.label)}`}>
          #{guess.rank}
        </span>
      </div>
    </div>
  );
}

function GuessList({ guesses, sortByRank, onToggleSort, latestIndex }) {
  const sorted = sortByRank
    ? [...guesses].sort((a, b) => a.rank - b.rank)
    : guesses;

  return (
    <>
      {guesses.length > 0 && (
        <div className="sort-bar">
          <button className="sort-toggle" onClick={onToggleSort}>
            {sortByRank ? 'SORT: RANK' : 'SORT: TIME'}
          </button>
        </div>
      )}
      <div className="guess-list">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">[ . . . ]</div>
            <div>TYPE A WORD TO BEGIN</div>
            <div>FIND THE SECRET WORD</div>
          </div>
        ) : (
          sorted.map((guess) => (
            <GuessRow
              key={`${guess.word}-${guess.guessIndex}`}
              guess={guess}
              isLatest={guess.guessIndex === latestIndex}
            />
          ))
        )}
      </div>
    </>
  );
}

function TemperatureBar({ bestRank, total }) {
  const BLOCK_COUNT = 20;
  // Convert rank to bar position (rank 1 = rightmost, high rank = leftmost)
  const position = bestRank
    ? Math.max(0, Math.min(BLOCK_COUNT - 1, Math.floor((1 - bestRank / total) * BLOCK_COUNT)))
    : -1;

  return (
    <div className="temp-bar-container">
      <div className="temp-bar-labels">
        <span className="frozen-label">🧊 FROZEN</span>
        <span className="lava-label">LAVA 🔥</span>
      </div>
      <div className="temp-bar">
        {Array.from({ length: BLOCK_COUNT }).map((_, i) => {
          const isMarker = i === position;
          let fillClass = '';
          if (i <= position && position >= 0) {
            const ratio = i / BLOCK_COUNT;
            if (ratio < 0.3) fillClass = 'filled-cold';
            else if (ratio < 0.7) fillClass = 'filled-warm';
            else fillClass = 'filled-lava';
          }
          return (
            <div
              key={i}
              className={[
                'temp-block',
                fillClass,
                isMarker ? 'marker' : '',
              ].filter(Boolean).join(' ')}
            />
          );
        })}
      </div>
    </div>
  );
}

function WinBanner({ guessCount, onClose }) {
  return (
    <div className="win-overlay" onClick={onClose}>
      <div className="win-banner" onClick={(e) => e.stopPropagation()}>
        <div className="win-title">🎯 YOU FOUND IT</div>
        <div className="win-subtitle">YOU GUESSED THE SECRET WORD!</div>
        <div className="win-stat">{guessCount}</div>
        <div className="win-stat-label">TOTAL GUESSES</div>
        <button className="win-close-btn" onClick={onClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════

function App() {
  const [guesses, setGuesses] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [bestRank, setBestRank] = useState(null);
  const [totalWords, setTotalWords] = useState(50000);
  const [gameWon, setGameWon] = useState(false);
  const [sortByRank, setSortByRank] = useState(false);
  const [showWinBanner, setShowWinBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [puzzleNumber, setPuzzleNumber] = useState(null);
  const [error, setError] = useState(null);
  const guessIndexRef = useRef(0);

  // Fetch daily puzzle info on mount
  useEffect(() => {
    fetchDailyInfo()
      .then((info) => {
        setPuzzleNumber(info.puzzle_number);
      })
      .catch((err) => {
        console.error('Failed to fetch daily info:', err);
      });
  }, []);

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async () => {
    const word = inputValue.trim().toLowerCase();
    if (!word || isSubmitting) return;

    // Check for duplicate
    const isDuplicate = guesses.some(
      (g) => g.word.toLowerCase() === word && !g.isDuplicate
    );

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitGuess(word);

      const newGuess = {
        word: word.toUpperCase(),
        rank: result.rank,
        total: result.total,
        label: result.label,
        score: result.score,
        isDuplicate,
        guessIndex: guessIndexRef.current++,
      };

      setGuesses((prev) => [...prev, newGuess]);
      setInputValue('');
      setTotalWords(result.total);

      if (!isDuplicate) {
        if (bestRank === null || result.rank < bestRank) {
          setBestRank(result.rank);
        }
      }

      if (result.rank === 1 && !isDuplicate) {
        setGameWon(true);
        setShowWinBanner(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <HeaderBar puzzleNumber={puzzleNumber} />
      <GuessCounter count={guesses.filter((g) => !g.isDuplicate).length} />
      <InputArea
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        disabled={gameWon}
        error={error}
      />
      <GuessList
        guesses={guesses}
        sortByRank={sortByRank}
        onToggleSort={() => setSortByRank((p) => !p)}
        latestIndex={guessIndexRef.current - 1}
      />
      <TemperatureBar bestRank={bestRank} total={totalWords} />
      {showWinBanner && (
        <WinBanner
          guessCount={guesses.filter((g) => !g.isDuplicate).length}
          onClose={() => setShowWinBanner(false)}
        />
      )}
    </div>
  );
}

export default App;
