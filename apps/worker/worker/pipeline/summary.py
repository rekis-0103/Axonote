import networkx as nx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def textrank_summary(sentences: list[str], max_sentences: int = 5) -> list[str]:
    if not sentences:
        return []
    if len(sentences) <= max_sentences:
        return sentences

    vectorizer = TfidfVectorizer()
    matrix = vectorizer.fit_transform(sentences)
    similarity = cosine_similarity(matrix)
    graph = nx.from_numpy_array(similarity)
    scores = nx.pagerank(graph)

    ranked_indices = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    top_indices = sorted(index for index, _ in ranked_indices[:max_sentences])
    return [sentences[index] for index in top_indices]
