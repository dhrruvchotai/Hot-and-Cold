import gensim.downloader as api

print("Loading model....")
model = api.load("word2vec-google-news-300") 
print("Model loaded!")