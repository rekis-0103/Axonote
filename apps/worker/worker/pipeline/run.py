import time
from pathlib import Path

from worker.pipeline.extract import extract_text
from worker.pipeline.keywords import extract_keywords
from worker.pipeline.preprocess import clean_text, split_sentences
from worker.pipeline.questions import generate_questions
from worker.pipeline.summary import textrank_summary


def run_analysis(file_path: Path, extension: str) -> dict[str, object]:
    started = time.perf_counter()

    raw_text = extract_text(file_path, extension)
    cleaned = clean_text(raw_text)
    sentences = split_sentences(cleaned)

    if not sentences:
        raise ValueError("No extractable text found in the document.")

    keywords = extract_keywords(sentences)
    summary_sentences = textrank_summary(sentences, max_sentences=min(5, len(sentences)))
    summary_content = " ".join(summary_sentences)
    question_payloads = generate_questions(sentences, keywords)

    elapsed_ms = int((time.perf_counter() - started) * 1000)

    return {
        "content": summary_content,
        "keywords": keywords,
        "meta": {
            "sentence_count": len(sentences),
            "summary_sentence_count": len(summary_sentences),
            "question_count": len(question_payloads),
            "processing_ms": elapsed_ms,
        },
        "questions": question_payloads,
    }
