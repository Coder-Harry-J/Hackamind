import logging
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from attributes import extract_cluster_attributes
from catalog_builder import build_catalog
from clustering import (
    cluster_image_embeddings,
    match_titles_to_clusters,
)
from embeddings import (
    generate_image_embeddings,
    generate_text_embeddings,
)


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
    if not request.images:
        raise HTTPException(status_code=400, detail="At least one image path is required")

    image_embeddings, valid_image_paths = generate_image_embeddings(
        request.images,
        batch_size=32,
    )
    if len(valid_image_paths) == 0:
        raise HTTPException(status_code=422, detail="No valid images were processed")

    clusters = cluster_image_embeddings(
        image_embeddings=image_embeddings,
        image_paths=valid_image_paths,
        eps=0.22,
        min_samples=2,
    )

    cluster_attributes: Dict[int, Dict[str, str]] = {}
    for cluster in clusters:
        cluster_id = cluster["cluster_id"]
        cluster_attributes[cluster_id] = extract_cluster_attributes(cluster["images"])

    title_mapping: Dict[int, str] = {}
    if request.product_titles:
        try:
            title_embeddings = generate_text_embeddings(request.product_titles, batch_size=64)

            cluster_texts = []
            for cluster in clusters:
                attrs = cluster_attributes.get(cluster["cluster_id"], {})
                cluster_texts.append(
                    " ".join(
                        [
                            attrs.get("brand", "unknown"),
                            attrs.get("category", "product"),
                            attrs.get("color", "unknown"),
                            attrs.get("object_type", "item"),
                        ]
                    )
                )

            cluster_text_embeddings = generate_text_embeddings(cluster_texts, batch_size=64)

            title_mapping = match_titles_to_clusters(
                product_titles=request.product_titles,
                title_embeddings=title_embeddings,
                cluster_text_embeddings=cluster_text_embeddings,
            )
        except Exception as exc:
            logger.warning("Title matching failed; continuing without title mapping: %s", exc)

    catalog = build_catalog(
        clusters=clusters,
        cluster_attributes=cluster_attributes,
        title_mapping=title_mapping,
    )

    return catalog
