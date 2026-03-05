"""Deterministic attribute extraction with CLIP text-image similarity."""

import logging
from typing import Dict, List

import numpy as np
import torch
from PIL import Image

from embeddings import get_clip_components

logger = logging.getLogger(__name__)

CATEGORY_LABELS = [
    "running shoes",
    "casual shoes",
    "sandals",
    "boots",
    "handbag",
    "backpack",
    "duffle bag",
    "travel bag",
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
    "louis vuitton",
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
    inputs = processor(text=prompts, return_tensors="pt", padding=True)
    inputs = {k: v.to(device) if hasattr(v, 'to') else v for k, v in inputs.items()}
    with torch.no_grad():
        output = model.get_text_features(**inputs)
        if isinstance(output, torch.Tensor):
            text_features = output
        elif hasattr(output, 'text_embeds'):
            text_features = output.text_embeds
        elif hasattr(output, 'pooler_output'):
            text_features = output.pooler_output
        else:
            text_features = output[0]
    text_features = torch.nn.functional.normalize(text_features, p=2, dim=1)
    result = text_features.cpu().numpy().astype(np.float32)
    _prompt_cache.set(cache_key, result)
    return result


def _load_images(paths: List[str], max_images: int) -> List[Image.Image]:
    images: List[Image.Image] = []
    for path in sorted(paths)[:max_images]:
        try:
            img = Image.open(path)
            img = img.convert("RGB")
            images.append(img)
        except Exception as exc:
            logger.warning("Skipping image '%s' in attribute extraction: %s", path, exc)
    return images


def _predict_label_for_images(images: List[Image.Image], labels: List[str], template: str) -> str:
    if not images:
        return labels[-1] if labels else "unknown"

    try:
        model, processor, device = get_clip_components()
        inputs = processor(images=images, return_tensors="pt", padding=True)
        inputs = {k: v.to(device) if hasattr(v, 'to') else v for k, v in inputs.items()}
        with torch.no_grad():
            output = model.get_image_features(**inputs)
            if isinstance(output, torch.Tensor):
                image_features = output
            elif hasattr(output, 'image_embeds'):
                image_features = output.image_embeds
            elif hasattr(output, 'pooler_output'):
                image_features = output.pooler_output
            else:
                image_features = output[0]
        image_features = torch.nn.functional.normalize(image_features, p=2, dim=1)
        image_array = image_features.cpu().numpy().astype(np.float32)

        text_array = _encode_text_prompts(labels=labels, template=template)
        scores = np.matmul(image_array, text_array.T)
        mean_scores = scores.mean(axis=0)
        best_idx = int(np.argmax(mean_scores))
        return labels[best_idx]
    except Exception as exc:
        logger.warning("Label prediction failed: %s", exc)
        return labels[-1] if labels else "unknown"


def extract_cluster_attributes(cluster_images: List[str], max_images: int = 8) -> Dict[str, str]:
    """Infer product attributes for one image cluster with deterministic prompts."""
    fallback = {"category": "unknown product", "color": "unknown", "object_type": "other", "brand": "unknown"}
    try:
        images = _load_images(cluster_images, max_images=max_images)
        if not images:
            logger.warning("No loadable images in cluster; returning fallback attributes")
            return fallback

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
    except Exception as exc:
        logger.error("Attribute extraction failed: %s", exc)
        return fallback
