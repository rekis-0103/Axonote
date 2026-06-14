from sklearn.feature_extraction.text import TfidfVectorizer


def extract_keywords(sentences: list[str], top_n: int = 10) -> list[str]:
    if not sentences:
        return []

    vectorizer = TfidfVectorizer(max_features=200, stop_words="english")
    try:
        matrix = vectorizer.fit_transform(sentences)
    except ValueError:
        return []

    scores = matrix.sum(axis=0).A1
    terms = vectorizer.get_feature_names_out()
    ranked = sorted(zip(terms, scores, strict=True), key=lambda item: item[1], reverse=True)
    return [term for term, _ in ranked[:top_n]]
