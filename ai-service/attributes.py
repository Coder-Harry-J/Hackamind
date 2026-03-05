"""Deterministic attribute extraction with CLIP text-image similarity."""

from typing import Dict, List

import numpy as np
import torch
from PIL import Image

from embeddings import get_clip_components

CATEGORY_LABELS = [
    "running shoes",
    "casual shoes",
    "sandals",
    "boots",
    "handbag",
    "backpack",
    "t-shirt",
    "shirt",
    "jacket",
    "jeans",
    "dress",
    "watch",
    "sunglasses",
    "bottle",
    "unknown product",
]

COLOR_LABELS = [
    "black",
    "white",
    "gray",
    "blue",
    "red",
    "green",
    "brown",
    "beige",
    "pink",
    "yellow",
    "orange",
    "purple",
    "multicolor",
]

OBJECT_LABELS = [
    "shoe",
    "bag",
    "clothing",
    "accessory",
    "bottle",
    "other",
]

BRAND_LABELS = [
    "nike",
    "adidas",
    "puma",
    "reebok",
    "new balance",
    "zara",
    "h and m",
    "gucci",
    "prada",
    "unknown",
]


class _PromptCache:
    def __init__(self) -> None:
        self._cache = {}

    def get(self, key: str):
        return self._cache.get(key)

    def set(self, key: str, value):
        self._cache[key] = value


_prompt_cache = _PromptCache()


def _encode_text_prompts(labels: List[str], template: str) -> np.ndarray:
    model, processor, device = get_clip_components()
    cache_key = f"{template}|{'|'.join(labels)}"
    cached = _prompt_cache.get(cache_key)
    if cached is not None:
        return cached

    prompts = [template.format(label=label) for label in labels]
    inputs = processor(text=prompts, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        text_features = model.get_text_features(**inputs)
    text_features = torch.nn.functional.normalize(text_features, p=2, dim=1)
    result = text_features.cpu().numpy().astype(np.float32)
    _prompt_cache.set(cache_key, result)
    return result


def _load_images(paths: List[str], max_images: int) -> List[Image.Image]:
    images: List[Image.Image] = []
    for path in sorted(paths)[:max_images]:
        with Image.open(path) as image:
            images.append(image.convert("RGB"))
    return images


def _predict_label_for_images(images: List[Image.Image], labels: List[str], template: str) -> str:
    if not images:
        return labels[-1] if labels else "unknown"

    model, processor, device = get_clip_components()
    inputs = processor(images=images, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        image_features = model.get_image_features(**inputs)
    image_features = torch.nn.functional.normalize(image_features, p=2, dim=1)
    image_array = image_features.cpu().numpy().astype(np.float32)

    text_array = _encode_text_prompts(labels=labels, template=template)
    scores = np.matmul(image_array, text_array.T)
    mean_scores = scores.mean(axis=0)
    best_idx = int(np.argmax(mean_scores))
    return labels[best_idx]


def extract_cluster_attributes(cluster_images: List[str], max_images: int = 8) -> Dict[str, str]:
    """Infer product attributes for one image cluster with deterministic prompts."""
    images = _load_images(cluster_images, max_images=max_images)

    category = _predict_label_for_images(images, CATEGORY_LABELS, "a product photo of {label}")
    color = _predict_label_for_images(images, COLOR_LABELS, "a {label} product")
    object_type = _predict_label_for_images(images, OBJECT_LABELS, "a product of type {label}")
    brand = _predict_label_for_images(images, BRAND_LABELS, "a {label} branded product")

    return {
        "category": category,
        "color": color,
        "object_type": object_type,
        "brand": brand,
    }
