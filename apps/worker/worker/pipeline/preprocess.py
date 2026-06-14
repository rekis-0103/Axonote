import re

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
_NON_WORD = re.compile(r"[^\w\s.,!?'-]")


def clean_text(text: str) -> str:
    normalized = _NON_WORD.sub(" ", text)
    return re.sub(r"\s+", " ", normalized).strip()


def split_sentences(text: str) -> list[str]:
    cleaned = clean_text(text)
    if not cleaned:
        return []

    raw = _SENTENCE_SPLIT.split(cleaned)
    sentences: list[str] = []
    for sentence in raw:
        stripped = sentence.strip()
        if len(stripped.split()) >= 3:
            sentences.append(stripped)
    return sentences
