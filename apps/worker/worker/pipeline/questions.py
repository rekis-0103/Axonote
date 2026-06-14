import random
import re

from worker.pipeline.keywords import extract_keywords


def generate_questions(
    sentences: list[str],
    keywords: list[str],
    max_questions: int = 5,
) -> list[dict[str, object]]:
    if not sentences:
        return []

    pool = [sentence for sentence in sentences if len(sentence.split()) >= 5]
    if not pool:
        pool = sentences[:max_questions]

    keyword_pool = keywords or extract_keywords(sentences, top_n=max_questions)
    questions: list[dict[str, object]] = []

    for index, sentence in enumerate(pool[:max_questions]):
        words = [word for word in re.findall(r"\b\w+\b", sentence) if len(word) > 2]
        if not words:
            continue

        target = _pick_target(sentence, words, keyword_pool, index)
        stem = _build_stem(sentence, target)
        distractors = _build_distractors(words, target, keyword_pool)
        options = [target] + distractors[:3]
        random.shuffle(options)
        correct_index = options.index(target)

        questions.append(
            {
                "type": "mcq",
                "stem": f"Fill in the blank: {stem}",
                "options": options,
                "correct_index": correct_index,
                "explanation": f"The correct answer is \"{target}\".",
                "source_ref": {"sentence_index": index},
            }
        )

    return questions


def _pick_target(sentence: str, words: list[str], keywords: list[str], index: int) -> str:
    lower_sentence = sentence.lower()
    for keyword in keywords:
        if keyword.lower() in lower_sentence:
            match = re.search(re.escape(keyword), sentence, flags=re.IGNORECASE)
            if match:
                return match.group(0)

    return words[index % len(words)]


def _build_stem(sentence: str, target: str) -> str:
    replaced = re.sub(re.escape(target), "_____", sentence, count=1, flags=re.IGNORECASE)
    return replaced if "_____" in replaced else sentence


def _build_distractors(words: list[str], target: str, keywords: list[str]) -> list[str]:
    distractors: list[str] = []
    for word in words:
        if word.lower() != target.lower() and word not in distractors:
            distractors.append(word)
        if len(distractors) >= 3:
            break

    for keyword in keywords:
        if keyword.lower() != target.lower() and keyword not in distractors:
            distractors.append(keyword)
        if len(distractors) >= 3:
            break

    filler = 0
    while len(distractors) < 3:
        distractors.append(f"option{filler}")
        filler += 1

    return distractors
