from word_manager import get_todays_word,load_word_list
from game_engine import get_rank_and_score

def main():
    secret,difficulty = get_todays_word("./data/word_list.txt")
    print(f"Selected word is : {secret} and difficulty is : {difficulty}")
    
    guess = input("Enter your guess : ")
    result = get_rank_and_score(secret_word=secret,guess_word=guess)    

    while result["rank"] != 1:
        print(result)
        guess = input("Enter your guess : ")
        result = get_rank_and_score(secret_word=secret,guess_word=guess)
    print("Yayy, you won!!")
    

if __name__ == "__main__":
    main()