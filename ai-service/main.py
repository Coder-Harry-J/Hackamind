import logging
import os
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from attributes import extract_cluster_attributes
from catalog_builder import build_catalog
from clustering import product_key_aware_cluster, multimodal_cluster, match_titles_to_clusters
from embeddings import (
    generate_clip_text_embeddings,
    generate_image_embeddings,
    generate_text_embeddings,
)
from filename_parser import parse_filenames, get_grouping_texts

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)


class ProcessCatalogRequest(BaseModel):
    images: List[str] = Field(default_factory=list)
    product_titles: List[str] = Field(default_factory=list)
    metadata: Dict = Field(default_factory=dict)

app = FastAPI(title="Catalog AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "AI service running"}


@app.get("/health")
def health():
    return {"status": "AI service running"}


@app.post("/process-catalog")
def process_catalog(request: ProcessCatalogRequest):
    logger.info(
        "Received /process-catalog: %d image(s), %d title(s)",
        len(request.images),
        len(request.product_titles),
    )

    if not request.images:
        raise HTTPException(status_code=400, detail="At least one image path is required")

    # ── Stage 1: Parse filenames for metadata ────────────────────────────
    file_metadata_list = parse_filenames(request.images)
    grouping_texts = get_grouping_texts(request.images, file_metadata_list)
    # Convert list → dict keyed by filename for catalog_builder / downstream use
    file_metadata: Dict[str, Dict] = {}
    for meta in file_metadata_list:
        fname = meta.get("filename", "")
        if fname:
            file_metadata[fname] = meta
    logger.info("Stage 1 complete: parsed %d filenames", len(file_metadata))

    # ── Stage 2: Generate CLIP image embeddings ──────────────────────────
    try:
        image_embeddings, valid_paths = generate_image_embeddings(request.images, batch_size=32)
        logger.info("Stage 2 complete: %d valid embeddings from %d inputs",
                     len(valid_paths), len(request.images))
    except Exception as exc:
        logger.error("Image embedding failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image embedding failed: {exc}")

    if len(valid_paths) == 0:
        raise HTTPException(status_code=422, detail="No valid images were processed.")

    # ── Stage 3: Generate CLIP text embeddings from filenames ────────────
    text_embeddings = None
    try:
        aligned_texts = []
        for p in valid_paths:
            fname = os.path.basename(p)
            aligned_texts.append(grouping_texts.get(fname, "product image"))

        text_embeddings = generate_clip_text_embeddings(aligned_texts, batch_size=64)
        logger.info("Stage 3 complete: %d CLIP text embeddings", text_embeddings.shape[0])
    except Exception as exc:
        logger.warning("CLIP text embedding failed; falling back to image-only: %s", exc)

    # ── Stage 4: Multimodal clustering ───────────────────────────────────
    try:
        clusters = product_key_aware_cluster(
            image_embeddings=image_embeddings,
            text_embeddings=text_embeddings,
            image_paths=valid_paths,
            file_metadata=file_metadata,
            image_weight=0.5,
            text_weight=0.5,
            eps=0.30,
            min_samples=2,
        )
        logger.info("Stage 4 complete: %d clusters", len(clusters))
    except Exception as exc:
        logger.error("Clustering failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Clustering failed: {exc}")

    # ── Stage 5: Extract visual attributes per cluster ───────────────────
    cluster_attributes: Dict[int, Dict[str, str]] = {}
    for cluster in clusters:
        cid = cluster["cluster_id"]
        try:
            cluster_attributes[cid] = extract_cluster_attributes(cluster["images"])
        except Exception as exc:
            logger.warning("Attribute extraction failed for cluster %d: %s", cid, exc)
            cluster_attributes[cid] = {}
    logger.info("Stage 5 complete: attributes for %d clusters", len(cluster_attributes))

    # ── Stage 6: Match product titles to clusters (if provided) ──────────
    title_mapping: Dict[int, str] = {}
    if request.product_titles:
        try:
            title_embeddings = generate_text_embeddings(request.product_titles, batch_size=64)

            cluster_texts = []
            for cluster in clusters:
                attrs = cluster_attributes.get(cluster["cluster_id"], {})
                # Prefer filename-derived metadata for precise title matching
                first_fname = os.path.basename(cluster["images"][0]) if cluster["images"] else ""
                first_meta = file_metadata.get(first_fname, {})
                brand = first_meta.get("brand") or attrs.get("brand", "unknown")
                product_key = first_meta.get("product_key") or attrs.get("category", "product")
                cluster_texts.append(
                    " ".join(filter(None, [
                        brand,
                        product_key,
                        attrs.get("color", ""),
                        attrs.get("object_type", ""),
                    ])).strip() or "unknown product"
                )

            cluster_sentence_embs = generate_text_embeddings(cluster_texts, batch_size=64)

            title_mapping = match_titles_to_clusters(
                product_titles=request.product_titles,
                title_embeddings=title_embeddings,
                cluster_text_embeddings=cluster_sentence_embs,
            )
            logger.info("Stage 6 complete: %d titles mapped", len(title_mapping))
        except Exception as exc:
            logger.warning("Title matching failed; continuing without: %s", exc)

    # ── Stage 7: Build catalog JSON ──────────────────────────────────────
    try:
        catalog = build_catalog(
            clusters=clusters,
            cluster_attributes=cluster_attributes,
            title_mapping=title_mapping,
            file_metadata=file_metadata,
        )
        logger.info("Stage 7 complete: catalog has %d products", len(catalog.get("products", [])))
    except Exception as exc:
        logger.error("Catalog construction failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Catalog construction failed: {exc}")

    return catalog
