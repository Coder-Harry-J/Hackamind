"""Clustering and text-image matching helpers for catalog building."""

import logging
from collections import defaultdict
from typing import Dict, List

import numpy as np
from sklearn.cluster import DBSCAN

logger = logging.getLogger(__name__)


def cluster_image_embeddings(
    image_embeddings: np.ndarray,
    image_paths: List[str],
    eps: float = 0.22,
    min_samples: int = 2,
) -> List[Dict]:
    """Cluster normalized image embeddings with DBSCAN (cosine metric)."""
    if len(image_embeddings) != len(image_paths):
        raise ValueError("Image embeddings and image paths length mismatch")

    if len(image_paths) == 0:
        return []

    if len(image_paths) == 1:
        return [{"cluster_id": 0, "images": [image_paths[0]], "indices": [0]}]

    dbscan = DBSCAN(
        eps=eps,
        min_samples=min_samples,
        metric="cosine",
        algorithm="brute",
        n_jobs=-1,
    )
    labels = dbscan.fit_predict(image_embeddings)

    grouped: Dict[int, List[int]] = defaultdict(list)
    noise_indices: List[int] = []
    for idx, label in enumerate(labels):
        if label == -1:
            noise_indices.append(idx)
        else:
            grouped[label].append(idx)

    results: List[Dict] = []
    running_cluster_id = 0

    for label in sorted(grouped.keys()):
        indices = sorted(grouped[label])
        results.append(
            {
                "cluster_id": running_cluster_id,
                "images": [image_paths[i] for i in indices],
                "indices": indices,
            }
        )
        running_cluster_id += 1

    for idx in sorted(noise_indices):
        results.append(
            {
                "cluster_id": running_cluster_id,
                "images": [image_paths[idx]],
                "indices": [idx],
            }
        )
        running_cluster_id += 1

    logger.info("DBSCAN produced %s clusters from %s images", len(results), len(image_paths))
    return results


def compute_cluster_centroids(
    image_embeddings: np.ndarray,
    clusters: List[Dict],
) -> np.ndarray:
    """Compute normalized centroid for each cluster."""
    if not clusters:
        return np.empty((0, image_embeddings.shape[1] if image_embeddings.size else 0), dtype=np.float32)

    centroids = []
    for cluster in clusters:
        vectors = image_embeddings[cluster["indices"]]
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
    used_titles = set()

    for cluster_idx in range(similarity.shape[0]):
        ranked_title_indices = np.argsort(-similarity[cluster_idx])
        chosen_idx = None

        for title_idx in ranked_title_indices:
            title_idx = int(title_idx)
            if title_idx not in used_titles:
                chosen_idx = title_idx
                break

        if chosen_idx is None:
            chosen_idx = int(ranked_title_indices[0])

        used_titles.add(chosen_idx)
        mapping[cluster_idx] = product_titles[chosen_idx]

    return mapping
