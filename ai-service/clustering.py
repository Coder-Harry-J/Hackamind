"""Clustering and text-image matching helpers for catalog building."""

import logging
import os
from collections import defaultdict
from typing import Dict, List, Optional

import numpy as np
from sklearn.cluster import DBSCAN

logger = logging.getLogger(__name__)


def multimodal_cluster(
    image_embeddings: np.ndarray,
    text_embeddings: Optional[np.ndarray],
    image_paths: List[str],
    image_weight: float = 0.5,
    text_weight: float = 0.5,
    eps: float = 0.30,
    min_samples: int = 2,
) -> List[Dict]:
    """Cluster images using a weighted combination of image + CLIP-text embeddings.

    Both embedding arrays must have the same dimensionality (e.g. 512-d CLIP space).
    Falls back to image-only clustering when text embeddings are unavailable.
    """
    n = len(image_paths)
    if n != image_embeddings.shape[0]:
        raise ValueError("image_embeddings / image_paths length mismatch")

    if n == 0:
        return []
    if n == 1:
        return [{"cluster_id": 0, "images": [image_paths[0]], "indices": [0]}]

    # ── Fuse modalities ──────────────────────────────────────────────────────
    if (
        text_embeddings is not None
        and text_embeddings.shape[0] == n
        and text_embeddings.shape[1] == image_embeddings.shape[1]
    ):
        combined = image_weight * image_embeddings + text_weight * text_embeddings
        norms = np.linalg.norm(combined, axis=1, keepdims=True)
        norms = np.where(norms > 0, norms, 1.0)
        combined = combined / norms
        logger.info(
            "Multimodal fusion: %.0f%% image + %.0f%% text",
            image_weight * 100,
            text_weight * 100,
        )
    else:
        combined = image_embeddings
        logger.info("Using image-only embeddings for clustering")

    # ── DBSCAN ───────────────────────────────────────────────────────────────
    dbscan = DBSCAN(
        eps=eps,
        min_samples=min_samples,
        metric="cosine",
        algorithm="brute",
        n_jobs=-1,
    )
    labels = dbscan.fit_predict(combined)

    grouped: Dict[int, List[int]] = defaultdict(list)
    noise_indices: List[int] = []
    for idx, label in enumerate(labels):
        if label == -1:
            noise_indices.append(idx)
        else:
            grouped[label].append(idx)

    results: List[Dict] = []
    cid = 0
    for label in sorted(grouped.keys()):
        indices = sorted(grouped[label])
        results.append(
            {"cluster_id": cid, "images": [image_paths[i] for i in indices], "indices": indices}
        )
        cid += 1

    for idx in sorted(noise_indices):
        results.append(
            {"cluster_id": cid, "images": [image_paths[idx]], "indices": [idx]}
        )
        cid += 1

    logger.info("DBSCAN produced %d clusters from %d images", len(results), n)
    return results


# ── Product-key-aware clustering (primary strategy) ─────────────────────────

def product_key_aware_cluster(
    image_embeddings: np.ndarray,
    text_embeddings: Optional[np.ndarray],
    image_paths: List[str],
    file_metadata: Optional[Dict[str, Dict]] = None,
    image_weight: float = 0.5,
    text_weight: float = 0.5,
    eps: float = 0.30,
    min_samples: int = 2,
) -> List[Dict]:
    """Primary clustering strategy for catalog ingestion.

    1. Groups images deterministically by ``product_key`` extracted from filenames.
       This mirrors how real catalog systems use SKUs/GTINs as primary identifiers.
    2. Images whose filenames yield no recognisable product_key are forwarded to
       multimodal DBSCAN as a fallback.

    This prevents visually similar products (e.g. two Louis Vuitton bags with the
    same monogram pattern) from being wrongly merged into one cluster.
    """
    n = len(image_paths)
    if n == 0:
        return []
    if n == 1:
        return [{"cluster_id": 0, "images": [image_paths[0]], "indices": [0]}]

    file_metadata = file_metadata or {}

    # ── Step 1: Partition by product_key ────────────────────────────────────
    key_groups: Dict[str, List[int]] = defaultdict(list)
    no_key_indices: List[int] = []

    for idx, img_path in enumerate(image_paths):
        fname = os.path.basename(img_path)
        meta = file_metadata.get(fname, {})
        product_key = meta.get("product_key", "").strip()
        if product_key:
            key_groups[product_key].append(idx)
        else:
            no_key_indices.append(idx)

    results: List[Dict] = []
    cid = 0

    # ── Step 2: Each distinct product_key → one cluster ──────────────────────
    for product_key in sorted(key_groups.keys()):
        indices = sorted(key_groups[product_key])
        results.append({
            "cluster_id": cid,
            "images": [image_paths[i] for i in indices],
            "indices": indices,
        })
        cid += 1

    # ── Step 3: DBSCAN fallback for images with no product_key ───────────────
    if no_key_indices:
        if len(no_key_indices) == 1:
            results.append({
                "cluster_id": cid,
                "images": [image_paths[no_key_indices[0]]],
                "indices": [no_key_indices[0]],
            })
            cid += 1
        else:
            sub_img_embs = image_embeddings[no_key_indices]
            sub_txt_embs = (
                text_embeddings[no_key_indices]
                if text_embeddings is not None
                else None
            )
            sub_paths = [image_paths[i] for i in no_key_indices]
            sub_clusters = multimodal_cluster(
                image_embeddings=sub_img_embs,
                text_embeddings=sub_txt_embs,
                image_paths=sub_paths,
                image_weight=image_weight,
                text_weight=text_weight,
                eps=eps,
                min_samples=min_samples,
            )
            for sc in sub_clusters:
                # Remap sub-array indices → original array indices
                orig_indices = [no_key_indices[i] for i in sc["indices"]]
                results.append({
                    "cluster_id": cid,
                    "images": sc["images"],
                    "indices": orig_indices,
                })
                cid += 1

    logger.info(
        "product_key_aware_cluster: %d clusters (%d keyed, %d unkeyed) from %d images",
        len(results), len(key_groups), len(no_key_indices), n,
    )
    return results


# Legacy alias for backward-compat
cluster_image_embeddings = multimodal_cluster


def compute_cluster_centroids(
    embeddings: np.ndarray,
    clusters: List[Dict],
) -> np.ndarray:
    """Compute normalized centroid for each cluster."""
    if not clusters:
        dim = embeddings.shape[1] if embeddings.size else 0
        return np.empty((0, dim), dtype=np.float32)

    centroids = []
    for cluster in clusters:
        vectors = embeddings[cluster["indices"]]
        centroid = vectors.mean(axis=0)
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm
        centroids.append(centroid.astype(np.float32))
    return np.vstack(centroids)


def match_titles_to_clusters(
    product_titles: List[str],
    title_embeddings: np.ndarray,
    cluster_text_embeddings: np.ndarray,
) -> Dict[int, str]:
    """Match clusters to titles in the same sentence-embedding space."""
    if not product_titles or title_embeddings.size == 0 or cluster_text_embeddings.size == 0:
        return {}

    similarity = np.matmul(cluster_text_embeddings, title_embeddings.T)
    mapping: Dict[int, str] = {}
    used_titles: set = set()

    for cluster_idx in range(similarity.shape[0]):
        ranked = np.argsort(-similarity[cluster_idx])
        chosen = None
        for ti in ranked:
            ti = int(ti)
            if ti not in used_titles:
                chosen = ti
                break
        if chosen is None:
            chosen = int(ranked[0])

        used_titles.add(chosen)
        mapping[cluster_idx] = product_titles[chosen]

    return mapping
