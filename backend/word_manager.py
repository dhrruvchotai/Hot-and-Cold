import hashlib
from datetime import date
from typing import Tuple

def get_todays_word(word_list_path:str) -> Tuple[str,str]:
    with open(word_list_path,"r") as f:
        words = []
        for line in f:
            #skip the line if it is empty 
            if line.strip():
                #convert all words,difficulty to lower case and add in list
                words.append(line.strip().lower())

    today_str = str(date.today())
    #hashlib.md5() generates 16 bytes hash val(32 char hexadecimal str)
    #hashing algos needs bytes so encode method converts the string to bytes
    hash_int = int(hashlib.md5(today_str.encode()).hexdigest(),16)
    index = hash_int % len(words)
    selected_word,difficulty = words[index].split(",")
    return selected_word,difficulty

def load_word_list(word_list_path:str):
    with open(word_list_path,"r") as f:
        return [line.strip().lower() for line in f if line.strip()]