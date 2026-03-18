import numpy as np
from model_loader import model
from cache import init_db, get_cached_rankings, save_rankings

# initialize DB on startup
init_db()

def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray):
    dot_product = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)

    if norm_a == 0 or norm_b == 0:
        return 0

    return float(dot_product / (norm_a * norm_b))

def word_exists(word: str):
    return word.lower() in model.key_to_index

def get_word_vector(word: str):
    try:
        return model.get_vector(word.lower())
    except KeyError:
        return None

def get_rank_and_score(secret_word: str, guess_word: str):
    secret = secret_word.lower()
    guess = guess_word.lower()

    if not word_exists(guess):
        return {"error": f"'{guess}' not found in vocabulary"}

    if not word_exists(secret):
        return {"error": f"Secret word '{secret}' not in vocabulary"}

    rankings = compute_rankings(secret)

    if rankings is None:
        return {"error": f"Could not compute rankings for '{secret}'"}

    word_to_rank = {item[0]: idx + 1 for idx, item in enumerate(rankings)}
    score_map = {item[0]: item[1] for item in rankings}

    if guess not in word_to_rank:
        return {"error": f"'{guess}' could not be ranked!"}

    rank = word_to_rank[guess]
    score = score_map[guess]
    total = len(rankings)
    percentile = round((1 - (rank / total)) * 100, 1)

    return {
        "rank": rank,
        "score": round(score, 4),
        "label": get_temperature_label(rank),
        "percentile": percentile,
        "total_words": total
    }

def compute_rankings(secret_word: str):
    word = secret_word.lower()

    cached = get_cached_rankings(word)
    if cached:
        return cached

    if not word_exists(word):
        return None

    results = [(word, 1.0)] + list(
        model.most_similar(word, topn=len(model.key_to_index))
    )

    # save to SQLite for next time
    save_rankings(word, results)
    return results

def get_temperature_label(rank: int):
    if rank == 1:         return "🎯"
    elif rank <= 150:     return "🔥"
    elif rank <= 500:     return "☀️"
    elif rank <= 20000:   return "❄️"
    else:                 return "🧊"
# def compute_rankings(secret_word:str):
#     if word_exists(secret_word):
#         target_vector = model.get_vector(secret_word)
#         similarities = []

#         for word in model.key_to_index:
#             try:
#                 word_vector = model.get_vector(word)
#                 similarity = cosine_similarity(target_vector,word_vector)
#                 similarities.append([word,similarity])
#             except Exception:
#                 continue

#         similarities.sort(key=lambda x : -x[1])
#         return similarities
#     else:
#         return None

