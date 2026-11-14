"""NASA Medical Knowledge Base Ingestion Script.

Extracts text from all 8 NASA medical PDFs registered in data/sources.yaml,
normalizes character encodings (fixing ligature/control character glitches),
segments text into clean, evidence-tiered, boundary-aware structural chunks,
and indexes them into:
1. ChromaDB persistent collection (data/chroma_db/) with CPU-pinned embeddings.
2. Rank-BM25 serialized index (data/bm25_index.pkl) for exact keyword search.
"""

import argparse
import os
import pickle
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple
import yaml
import pymupdf

# Set standard output encoding for Windows PowerShell consoles
if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


# Regular expressions for header and warning detection
PROCEDURE_HEADER_REGEX = re.compile(
    r'^(?:[0-9]+\.[0-9]*\s+|SECTION\s+[0-9]+|CHECKLIST\s+|[A-Z\s]{4,}:?\b)',
    re.MULTILINE
)
WARNING_NOTICE_REGEX = re.compile(
    r'\b(?:WARNING|CAUTION|NOTE|DANGER)\b',
    re.IGNORECASE
)
TOKENIZE_REGEX = re.compile(r'\b[a-zA-Z0-9_\-\.]{2,}\b')

# Boilerplate flight headers to ignore when identifying clinical procedure titles
IGNORE_HEADERS_REGEX = re.compile(
    r'^(?:MED/[A-Z0-9/,\s]+|NASA-STD-3001.*|\d+-\d+|[ivxIVX]+|SECTION\s+\d+.*|FIGURES|CONTENTS|PAGE|Title|Ref\.\s*Page|Card\s*No\.|TEMP\s+\d+-\d+|JSC-\d+.*)$',
    re.IGNORECASE
)
TOC_DOT_REGEX = re.compile(r'\.{3,}\s*\d+')


def clean_and_normalize_text(text: str) -> str:
    """Normalize text encodings, fix PDF font ligatures and control character glitches."""
    if not text:
        return ""

    # 1. Fix Rev H font glyph corruption where 'I' or 'i' extracted as byte \x01 (SOH)
    text = re.sub(r'\x01([a-z])', r'I\1', text)
    text = text.replace('\x01', 'I')

    # 2. Normalize dashes and unicode punctuation to ASCII equivalents
    text = text.replace('\u2013', '-').replace('\u2014', '-').replace('\u2212', '-').replace('\u2010', '-')
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    text = text.replace('\u201c', '"').replace('\u201d', '"')

    # 3. Strip non-printable ASCII control characters except \n and \t
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)

    return text


def detect_toc(text: str) -> bool:
    """Detect if page text represents Table of Contents, Index of Figures, or cue-card index."""
    text_upper = text.upper()
    if "TABLE OF CONTENTS" in text_upper or "\nCONTENTS\n" in text_upper:
        return True
    dot_matches = TOC_DOT_REGEX.findall(text)
    if len(dot_matches) >= 3:
        return True
    return False


def extract_procedure_title(lines: List[str], doc_title: str, page_num: int) -> str:
    """Extract clinical procedure or condition name from page lines, filtering boilerplate codes."""
    for ln in lines[:8]:
        ln_clean = ln.strip()
        if not ln_clean or IGNORE_HEADERS_REGEX.match(ln_clean):
            continue
        # Avoid Table of Contents dotted entries
        if '....' in ln_clean:
            continue
        if len(ln_clean) < 80 and (ln_clean.isupper() or re.match(r'^[0-9]+\.[0-9]*\s+', ln_clean)):
            return ln_clean

    return f"{doc_title} (Page {page_num})"


def tokenize_for_bm25(text: str) -> List[str]:
    """Lowercase tokenization suitable for medical and spaceflight acronyms."""
    return TOKENIZE_REGEX.findall(text.lower())


def chunk_page_text(
    doc_id: str,
    doc_title: str,
    tier: int,
    page_num: int,
    text: str,
    target_size: int = 700,
    overlap: int = 120
) -> List[Dict[str, Any]]:
    """Segment page text into clinical chunks with boundary-aware word preservation."""
    chunks: List[Dict[str, Any]] = []
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    if not lines:
        return chunks

    is_toc = detect_toc(text)
    current_procedure = extract_procedure_title(lines, doc_title, page_num)

    full_text = "\n".join(lines)
    text_len = len(full_text)

    # If small enough, keep as single cohesive chunk
    if text_len <= target_size:
        has_warning = bool(WARNING_NOTICE_REGEX.search(full_text))
        chunk_id = f"{doc_id}_p{page_num:03d}_c00"
        chunks.append({
            "chunk_id": chunk_id,
            "doc_id": doc_id,
            "doc_title": doc_title,
            "tier": tier,
            "procedure_title": current_procedure,
            "page_start": page_num,
            "ref_label": f"{doc_title}, p.{page_num}",
            "is_toc": is_toc,
            "has_warning": has_warning,
            "text": full_text
        })
        return chunks

    # Sliding window chunking with word-boundary snapping
    start = 0
    chunk_idx = 0
    while start < text_len:
        end = min(start + target_size, text_len)
        if end < text_len:
            # Look backwards for paragraph, sentence, or word boundary
            last_break = full_text.rfind("\n", start + 200, end)
            if last_break == -1:
                last_break = full_text.rfind(". ", start + 200, end)
            if last_break == -1:
                last_break = full_text.rfind(" ", start + 200, end)
            if last_break != -1:
                end = last_break + 1

        segment = full_text[start:end].strip()
        if len(segment) >= 40:
            has_warning = bool(WARNING_NOTICE_REGEX.search(segment))
            chunk_id = f"{doc_id}_p{page_num:03d}_c{chunk_idx:02d}"
            chunks.append({
                "chunk_id": chunk_id,
                "doc_id": doc_id,
                "doc_title": doc_title,
                "tier": tier,
                "procedure_title": current_procedure,
                "page_start": page_num,
                "ref_label": f"{doc_title}, p.{page_num}",
                "is_toc": is_toc,
                "has_warning": has_warning,
                "text": segment
            })
            chunk_idx += 1

        if end >= text_len:
            break

        # Snap start forward to word boundary so chunks never start mid-word
        raw_start = max(start + 1, end - overlap)
        while raw_start < end and not (full_text[raw_start - 1] in ' \n\t' and full_text[raw_start] not in ' \n\t'):
            raw_start += 1
        start = raw_start

    return chunks


def load_sources_catalog(catalog_path: str = "data/sources.yaml") -> List[Dict[str, Any]]:
    """Load documented sources from sources.yaml."""
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)
    return catalog.get("sources", [])


def extract_all_chunks(
    sources: List[Dict[str, Any]],
    raw_dir: str = "data/raw"
) -> List[Dict[str, Any]]:
    """Extract and chunk text from all registered PDF documents with normalization."""
    all_chunks: List[Dict[str, Any]] = []

    for src in sources:
        doc_id = src["doc_id"]
        filename = src["filename"]
        doc_title = src["title"]
        tier = src["tier"]

        pdf_path = Path(raw_dir) / filename
        if not pdf_path.exists():
            print(f"[WARN] PDF file not found: {pdf_path}")
            continue

        print(f"[EXTRACT] Processing {doc_id} (Tier {tier}): {filename}...")
        doc = pymupdf.open(str(pdf_path))
        doc_chunks = 0

        num_pages = len(doc)
        for page_idx in range(num_pages):
            page_num = page_idx + 1
            page = doc[page_idx]
            raw_text = page.get_text("text")
            if not raw_text or len(raw_text.strip()) < 10:
                continue

            # Normalize encodings and repair ligature corruptions
            clean_text = clean_and_normalize_text(raw_text)

            page_chunks = chunk_page_text(
                doc_id=doc_id,
                doc_title=doc_title,
                tier=tier,
                page_num=page_num,
                text=clean_text
            )
            all_chunks.extend(page_chunks)
            doc_chunks += len(page_chunks)

        doc.close()
        print(f"  |-- Extracted {doc_chunks} chunks across {num_pages} pages.")

    print(f"\n[SUMMARY] Total extracted chunks: {len(all_chunks)}")
    tier_counts = {1: 0, 2: 0, 3: 0}
    toc_count = 0
    warning_count = 0
    for c in all_chunks:
        tier_counts[c["tier"]] = tier_counts.get(c["tier"], 0) + 1
        if c.get("is_toc"):
            toc_count += 1
        if c.get("has_warning"):
            warning_count += 1

    for t, cnt in tier_counts.items():
        print(f"  * Tier {t} chunks: {cnt}")
    print(f"  * Table of Contents chunks flagged: {toc_count}")
    print(f"  * Safety warnings flagged: {warning_count}")

    return all_chunks


def build_bm25_index(
    chunks: List[Dict[str, Any]],
    output_path: str = "data/bm25_index.pkl"
):
    """Build and serialize Rank-BM25 sparse search index."""
    from rank_bm25 import BM25Okapi

    print(f"\n[BM25] Tokenizing {len(chunks)} chunks for BM25...")
    tokenized_corpus = [tokenize_for_bm25(c["text"]) for c in chunks]
    bm25 = BM25Okapi(tokenized_corpus)

    chunk_ids = [c["chunk_id"] for c in chunks]
    metadata_lookup = {c["chunk_id"]: c for c in chunks}

    index_payload = {
        "bm25": bm25,
        "chunk_ids": chunk_ids,
        "metadata_lookup": metadata_lookup
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        pickle.dump(index_payload, f)
    print(f"[BM25] Index successfully saved to {output_path} ({os.path.getsize(output_path) / 1024:.1f} KB)")


def build_chroma_index(
    chunks: List[Dict[str, Any]],
    chroma_path: str = "data/chroma_db",
    collection_name: str = "auramed_medical_knowledge",
    model_name: str = "intfloat/multilingual-e5-small",
    batch_size: int = 100
):
    """Build persistent ChromaDB collection using CPU-pinned embeddings."""
    import chromadb
    from sentence_transformers import SentenceTransformer

    os.environ["HF_HUB_OFFLINE"] = "1"
    print(f"\n[CHROMA] Initializing ChromaDB persistent client at {chroma_path}...")
    client = chromadb.PersistentClient(path=chroma_path)

    # Reset or get collection
    try:
        client.delete_collection(name=collection_name)
        print(f"[CHROMA] Existing collection '{collection_name}' cleared for reindexing.")
    except Exception:
        pass

    collection = client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )

    print(f"[CHROMA] Loading embedding model {model_name} on CPU...")
    try:
        model = SentenceTransformer(model_name, device="cpu", local_files_only=True)
    except Exception:
        model = SentenceTransformer(model_name, device="cpu")

    total_chunks = len(chunks)
    print(f"[CHROMA] Generating embeddings and inserting {total_chunks} chunks in batches of {batch_size}...")

    for i in range(0, total_chunks, batch_size):
        batch = chunks[i:i + batch_size]
        texts = [b["text"] for b in batch]
        ids = [b["chunk_id"] for b in batch]
        metadatas = [
            {
                "doc_id": b["doc_id"],
                "doc_title": b["doc_title"],
                "tier": b["tier"],
                "procedure_title": b["procedure_title"],
                "page_start": b["page_start"],
                "ref_label": b["ref_label"],
                "has_warning": bool(b.get("has_warning", False)),
                "is_toc": bool(b.get("is_toc", False))
            }
            for b in batch
        ]

        # Compute embeddings on CPU
        embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False).tolist()

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )
        print(f"  |-- Inserted {min(i + batch_size, total_chunks)}/{total_chunks} chunks...")

    print(f"[CHROMA] Knowledge base indexing complete in collection '{collection_name}'!")


def main():
    parser = argparse.ArgumentParser(description="Ingest NASA medical PDFs into AuraMed hybrid index.")
    parser.add_argument("--dry-run", action="store_true", help="Extract and validate chunks without building vector index.")
    parser.add_argument("--skip-vector", action="store_true", help="Build only BM25 index, skipping dense vector generation.")
    args = parser.parse_args()

    sources = load_sources_catalog()
    chunks = extract_all_chunks(sources)

    if args.dry_run:
        print("[SUCCESS] Dry-run complete. All chunks extracted, normalized, and validated.")
        return

    # 1. Build BM25 Index
    build_bm25_index(chunks)

    # 2. Build ChromaDB Vector Index
    if not args.skip_vector:
        build_chroma_index(chunks)


if __name__ == "__main__":
    main()
