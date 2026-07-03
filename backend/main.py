"""
Spam Classifier API
--------------------
Wraps the existing pickle model (vectorizer.pkl, model.pkl) in a small
FastAPI service so the React frontend can call it over HTTP.

Run with:
    uvicorn main:app --reload --port 8000
"""

import pickle
import string

import nltk
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# One-time NLTK setup (same as the Streamlit app)
# ---------------------------------------------------------------------------
nltk.download("punkt_tab", quiet=True)
nltk.download("stopwords", quiet=True)

ps = PorterStemmer()
STOPWORDS = set(stopwords.words("english"))


def transform_text(text: str) -> str:
    text = text.lower()
    tokens = nltk.word_tokenize(text)

    alnum_tokens = [t for t in tokens if t.isalnum()]

    cleaned = [
        ps.stem(t)
        for t in alnum_tokens
        if t not in STOPWORDS and t not in string.punctuation
    ]

    return " ".join(cleaned)


# ---------------------------------------------------------------------------
# Load model artifacts
# ---------------------------------------------------------------------------
try:
    tfidf = pickle.load(open("vectorizer.pkl", "rb"))
    model = pickle.load(open("model.pkl", "rb"))
except FileNotFoundError as exc:
    raise RuntimeError(
        "Could not find vectorizer.pkl / model.pkl. Place them in the "
        "backend/ folder next to main.py."
    ) from exc


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Spam Classifier API")

# Allow the React dev server (Vite default: http://localhost:5173) to call this API.
# Add your production frontend URL here too once you deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://spam-classifier-frontend.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    message: str


class PredictResponse(BaseModel):
    prediction: str  # "spam" | "ham"
    is_spam: bool


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message cannot be empty")

    transformed = transform_text(message)
    vector_input = tfidf.transform([transformed])
    result = model.predict(vector_input)[0]

    is_spam = bool(result == 1)
    return PredictResponse(prediction="spam" if is_spam else "ham", is_spam=is_spam)
