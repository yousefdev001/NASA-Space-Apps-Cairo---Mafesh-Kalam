"""
Phase 02 Data Discovery: Deep inspection of NASA medical PDF sources.
Calculates SHA256, page counts, text extractability, and maps to Evidence Tiers.
"""
import os
import hashlib
import json
import fitz  # PyMuPDF

DATA_DIR = os.path.abspath("./data/raw")

def get_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192 * 16):
            h.update(chunk)
    return h.hexdigest()

def classify_tier(filename, title):
    name_lower = (filename + " " + title).lower()
    if "checklist" in name_lower or "cklist" in name_lower:
        return 1, "Tier 1: Operational Procedures & Medical Checklists"
    elif "std-3001" in name_lower or "standard" in name_lower:
        return 2, "Tier 2: Medical Standards & Care-Level References"
    else:
        return 3, "Tier 3: Medical Condition Lists & Technical References"

def inspect_documents():
    files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(".pdf")]
    files.sort()
    
    inventory = []
    
    print(f"Discovered {len(files)} PDF documents in {DATA_DIR}:\n")
    
    for f in files:
        fpath = os.path.join(DATA_DIR, f)
        size_bytes = os.path.getsize(fpath)
        size_mb = size_bytes / (1024 * 1024)
        sha256 = get_sha256(fpath)
        
        doc = fitz.open(fpath)
        page_count = len(doc)
        
        meta = doc.metadata or {}
        meta_title = meta.get("title", "").strip() or "N/A"
        
        # Check text extractability across first 5 pages and overall
        pages_with_text = 0
        total_text_chars = 0
        first_page_text_sample = ""
        
        for i, page in enumerate(doc):
            txt = page.get_text() or ""
            char_count = len(txt.strip())
            total_text_chars += char_count
            if char_count > 50:
                pages_with_text += 1
            if i == 0:
                first_page_text_sample = txt.strip()[:200].replace("\n", " ")
        
        extractable_pct = (pages_with_text / page_count * 100) if page_count > 0 else 0
        tier_num, tier_desc = classify_tier(f, meta_title)
        
        item = {
            "filename": f,
            "size_mb": round(size_mb, 2),
            "size_bytes": size_bytes,
            "sha256": sha256,
            "page_count": page_count,
            "pdf_title": meta_title,
            "pages_with_text": pages_with_text,
            "extractable_pct": round(extractable_pct, 1),
            "total_chars": total_text_chars,
            "tier": tier_num,
            "tier_description": tier_desc,
            "sample_snippet": first_page_text_sample
        }
        inventory.append(item)
        
        print(f"File: {f}")
        print(f"  Pages: {page_count} | Size: {size_mb:.2f} MB | Text Extractable: {extractable_pct:.1f}%")
        print(f"  Evidence: {tier_desc}")
        print(f"  SHA256: {sha256[:16]}...")
        print(f"  Snippet: {first_page_text_sample[:100]}...\n")
        
        doc.close()

    # Save to JSON for report generation
    out_json = os.path.abspath("./docs/reports/DATA_INVENTORY.json")
    with open(out_json, "w", encoding="utf-8") as jf:
        json.dump(inventory, jf, indent=2, ensure_ascii=False)
    print(f"Inventory saved to {out_json}")
    return inventory

if __name__ == "__main__":
    inspect_documents()
