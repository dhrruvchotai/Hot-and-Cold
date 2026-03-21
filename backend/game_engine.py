import numpy as np
from model_loader import model
from cache import init_db, get_cached_rankings, save_rankings

#do not compute the word to rank every time used a dict to cache it
_rank_map_cache = {}
_score_map_cache = {}

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

    #if the rankings and similarity score for the secret is not computed then compute it otherwise reuse it
    if secret not in _rank_map_cache:
        rank_map,score_map = compute_rankings(secret)

        if rank_map is None:
            return {"error": f"Could not compute rankings for '{secret}'"}
    
        _rank_map_cache[secret] = rank_map
        _score_map_cache[secret] = score_map

    #to reuse the already computed rankings for a secret word
    word_to_rank = _rank_map_cache[secret]
    score_map = _score_map_cache[secret]

    if guess not in word_to_rank:
        return {"error": f"'{guess}' could not be ranked!"}

    rank = word_to_rank[guess]
    score = score_map[guess]
    total = len(word_to_rank)
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

    rank_map,score_map = get_cached_rankings(word)
    if rank_map is not None:
        _rank_map_cache[word] = rank_map
        _score_map_cache[word] = score_map
        return rank_map,score_map

    if not word_exists(word):
        return None, None

    results = [(word, 1.0)] + list(
        model.most_similar(word, topn=len(model.key_to_index))
    )

    rank_map = {item[0]: idx + 1 for idx, item in enumerate(results)}
    score_map = {item[0]: item[1] for item in results}


    save_rankings(word, rank_map=rank_map,score_map=score_map)
    return rank_map,score_map

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

