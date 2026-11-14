"""
Verification script for ChromaDB persistent storage, insertion, query, and metadata filtering.
Uses explicit embeddings to ensure 100% offline operation without downloading models.
"""
import os
import gc
import shutil
import time
import chromadb

TEST_PERSIST_DIR = os.path.abspath("./data/test_chroma_db")

def test_chroma():
    print("[1/5] Initializing PersistentClient at:", TEST_PERSIST_DIR)
    if os.path.exists(TEST_PERSIST_DIR):
        try:
            shutil.rmtree(TEST_PERSIST_DIR)
        except Exception:
            pass

    client = chromadb.PersistentClient(path=TEST_PERSIST_DIR)
    
    print("[2/5] Creating test collection...")
    col = client.create_collection(
        name="test_nasa_procedures",
        metadata={"description": "Test collection for Phase 01 ChromaDB verification"}
    )
    
    print("[3/5] Inserting sample documents with pre-computed offline embeddings & metadata...")
    emb_doc1 = [1.0, 0.0, 0.0, 0.0]
    emb_doc2 = [0.0, 1.0, 0.0, 0.0]

    col.add(
        embeddings=[emb_doc1, emb_doc2],
        documents=[
            "Astronaut cabin pressure drop checklist: inspect pressure valve.",
            "Normal routine sleep cycle protocol and cabin lighting schedule."
        ],
        metadatas=[
            {"source_id": "NASA-CKLIST-01", "tier": 1, "category": "emergency"},
            {"source_id": "NASA-STD-02", "tier": 2, "category": "routine"}
        ],
        ids=["doc_emerg_001", "doc_rout_002"]
    )
    assert col.count() == 2, "Collection count mismatch"
    print(" [PASS] 2 documents inserted successfully. Count verified.")

    print("[4/5] Testing nearest-neighbor vector query with metadata filtering (tier=1)...")
    query_emb = [0.9, 0.1, 0.0, 0.0]
    results = col.query(
        query_embeddings=[query_emb],
        n_results=1,
        where={"tier": 1}
    )
    assert len(results["ids"][0]) == 1, "Expected 1 result"
    assert results["ids"][0][0] == "doc_emerg_001", f"Unexpected doc id: {results['ids'][0][0]}"
    print(" [PASS] Metadata-filtered vector query returned correct document: doc_emerg_001")

    print("[5/5] Testing persistence across client restart...")
    del col
    del client
    gc.collect()
    
    # Re-initialize new client pointing to the same folder
    client2 = chromadb.PersistentClient(path=TEST_PERSIST_DIR)
    col2 = client2.get_collection(name="test_nasa_procedures")
    assert col2.count() == 2, "Persistence failed: count mismatch after re-open"
    res2 = col2.get(ids=["doc_emerg_001"])
    assert len(res2["ids"]) == 1, "Persistence failed: document not retrieved"
    print(" [PASS] Persistence across client restart confirmed!")

    # Clean up collection
    client2.delete_collection(name="test_nasa_procedures")
    del col2
    del client2
    gc.collect()
    time.sleep(0.5)
    
    try:
        shutil.rmtree(TEST_PERSIST_DIR)
        print(" [PASS] Cleaned up test database directory.")
    except Exception:
        print(" [INFO] Windows file lock deferred cleanup to next run (normal for Windows SQLite).")

    print("\n>>> CHROMADB VERIFICATION COMPLETED SUCCESSFULLY (100% OFFLINE) <<<")

if __name__ == "__main__":
    test_chroma()
