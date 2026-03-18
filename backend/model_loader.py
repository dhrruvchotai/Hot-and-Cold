import gensim
import gensim.downloader as api
import os

MODEL_PATH = "./cached_model/fasttext-wiki-news-subwords-300"

_model = None
def get_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            print("Loading model from disk..")
            #mmap is for not loading the model directly into ram 
            #it maps model from disk storage to virtual memory
            _model = gensim.models.KeyedVectors.load(MODEL_PATH,mmap="r")
        else:
            print("Downloading model....")
            _model = api.load("fasttext-wiki-news-subwords-300") 
            os.makedirs("./cached_model",exist_ok=True)
            _model.save(MODEL_PATH)
            print(f"Model downloaded and saved to : {MODEL_PATH}")
    return _model
model = get_model()