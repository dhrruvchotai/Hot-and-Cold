from word_manager import get_todays_word,load_word_list
from game_engine import get_rank_and_score

def main():
    secret,difficulty = get_todays_word("./data/word_list.txt")
    print(f"Selected word is : {secret} and difficulty is : {difficulty}")
    result = get_rank_and_score(secret_word=secret,guess_word="chess")    
    print(result)
    

if __name__ == "__main__":
    main()