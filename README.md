# Signal — Email/SMS Spam Classifier

A spam classifier with a React frontend and a FastAPI backend, wrapping a
Multinomial Naive Bayes model trained on TF-IDF features.

## How it works

1. User pastes a message into the React UI.
2. The message is sent to the FastAPI backend.
3. The backend cleans the text (lowercasing, tokenizing, removing stopwords
   and punctuation, stemming) using NLTK.
4. The cleaned text is vectorized with a fitted `TfidfVectorizer`.
5. The vector is passed to a trained `MultinomialNB` model, which predicts
   spam or not spam.
6. The result is returned to the frontend and shown to the user.

## Model details

| | |
|---|---|
| Algorithm | Multinomial Naive Bayes |
| Feature extraction | TF-IDF (`TfidfVectorizer`) |
| Dataset | `spam.csv` |
| Preprocessing | Lowercasing, tokenization, stopword removal, punctuation removal, Porter stemming |
| Artifacts | `vectorizer.pkl`, `model.pkl` |

## Project structure

```
spam-classifier/
├── backend/
│   ├── main.py            # FastAPI app, /predict endpoint
│   ├── requirements.txt
│   ├── model.pkl          # trained MultinomialNB model (not included — add your own)
│   └── vectorizer.pkl     # fitted TfidfVectorizer (not included — add your own)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── App.css
        └── main.jsx
```

## Running locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

Place your trained `model.pkl` and `vectorizer.pkl` inside `backend/`, then:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [https://spam-classifier-frontend.vercel.app/](https://spam-classifier-frontend.vercel.app/)

## API

**POST** `/predict`

Request:
```json
{ "message": "Congratulations! You've won a free prize, click here" }
```

Response:
```json
{ "prediction": "spam", "is_spam": true }
```

## Deployment

- Backend → [Render](https://render.com) (root directory: `backend`, start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`)
- Frontend → [Vercel](https://vercel.com) (root directory: `frontend`, build command: `npm run build`, output: `dist`)

After deploying, update `API_URL` in `frontend/src/App.jsx` to point at the live backend URL, and add the live frontend URL to `allow_origins` in `backend/main.py`.

## Tech stack

- **Frontend**: React (Vite), plain CSS
- **Backend**: FastAPI, scikit-learn, NLTK
- **Model**: Multinomial Naive Bayes + TF-IDF
