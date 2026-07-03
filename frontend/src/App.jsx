import { useState } from "react";

// Point this at wherever your FastAPI backend is running.
const API_URL = "https://spam-classifier-backend-zrid.onrender.com/predict";

const SAMPLE_MESSAGES = [
  "Congratulations! You've WON a $1000 Walmart gift card. Click here to claim now!!!",
  "Hey, are we still on for lunch tomorrow at 1pm?",
];

function Waveform({ active }) {
  // 24 bars, animated with staggered delays while a scan is in progress
  const bars = Array.from({ length: 24 });
  return (
    <div className={`waveform ${active ? "waveform--active" : ""}`}>
      {bars.map((_, i) => (
        <span
          key={i}
          className="waveform__bar"
          style={{ animationDelay: `${(i % 8) * 70}ms` }}
        />
      ))}
    </div>
  );
}

function ResultCard({ result }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="result result--error">
        <div className="result__label">SCAN FAILED</div>
        <p className="result__detail">{result.error}</p>
      </div>
    );
  }

  const isSpam = result.is_spam;
  return (
    <div className={`result ${isSpam ? "result--spam" : "result--clear"}`}>
      <div className="result__glyph" aria-hidden="true">
        {isSpam ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6 9 17l-5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div>
        <div className="result__label">
          {isSpam ? "SPAM DETECTED" : "CLEAR SIGNAL"}
        </div>
        <p className="result__detail">
          {isSpam
            ? "This message matches known spam patterns. Treat links or requests inside it with suspicion."
            : "No spam signatures found in this message."}
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const charCount = message.length;

  async function handleScan() {
    if (!message.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        error:
          err.message === "Failed to fetch"
            ? "Can't reach the backend. Is it running at " + API_URL + "?"
            : err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleScan();
    }
  }

  return (
    <div className="page">
      <div className="scanlines" aria-hidden="true" />

      <main className="panel">
        <header className="panel__header">
          <div className="eyebrow">MESSAGE INTEGRITY SCANNER</div>
          <h1>
            Signal<span className="dot">.</span>
          </h1>
          <p className="subtitle">
            Paste an email or SMS below. We'll check it against the trained
            spam-detection model and tell you if it's safe.
          </p>
        </header>

        <div className="field">
          <textarea
            className="textarea"
            placeholder="Paste your message here…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={7}
          />
          <div className="field__meta">
            <span>{charCount} characters</span>
            <span className="field__samples">
              Try:{" "}
              {SAMPLE_MESSAGES.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="sample-chip"
                  onClick={() => setMessage(s)}
                >
                  sample {i + 1}
                </button>
              ))}
            </span>
          </div>
        </div>

        <Waveform active={loading} />

        <button
          className="scan-button"
          onClick={handleScan}
          disabled={loading || !message.trim()}
        >
          {loading ? "Scanning…" : "Scan Message"}
        </button>

        <ResultCard result={result} />

        <footer className="panel__footer">
          <span className="pulse-dot" />
          Backend: <code>{API_URL}</code>
        </footer>
      </main>
    </div>
  );
}
