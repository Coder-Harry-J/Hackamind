"""Embedding utilities for image and text processing in the catalog pipeline."""

import logging
from pathlib import Path
from typing import List, Tuple

import numpy as np
import torch
from PIL import Image
from sentence_transformers import SentenceTransformer
from transformers import CLIPModel, CLIPProcessor

logger = logging.getLogger(__name__)

_clip_model = None
_clip_processor = None
_sentence_model = None
_device = None


def get_clip_components() -> Tuple[CLIPModel, CLIPProcessor, str]:
    """Load and cache CLIP ViT-B/32 resources once per process."""
    global _clip_model, _clip_processor, _device
    if _clip_model is not None:
        return _clip_model, _clip_processor, _device

    _device = "cuda" if torch.cuda.is_available() else "cpu"
    model_name = "openai/clip-vit-base-patch32"
    logger.info("Loading CLIP model '%s' on %s", model_name, _device)
    _clip_processor = CLIPProcessor.from_pretrained(model_name)
    _clip_model = CLIPModel.from_pretrained(model_name).to(_device)
    _clip_model.eval()
    return _clip_model, _clip_processor, _device


def get_sentence_model() -> SentenceTransformer:
    """Load and cache sentence-transformers model once per process."""
    global _sentence_model
    if _sentence_model is not None:
        return _sentence_model

    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    logger.info("Loading sentence model '%s'", model_name)
    _sentence_model = SentenceTransformer(model_name)
    return _sentence_model


def _safe_load_rgb_image(image_path: str) -> Image.Image:
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    with Image.open(path) as image:
        return image.convert("RGB")


def generate_image_embeddings(
    image_paths: List[str],
    batch_size: int = 32,
) -> Tuple[np.ndarray, List[str]]:
    """Generate normalized CLIP embeddings for valid images in batches."""
    model, processor, device = get_clip_components()

    valid_paths: List[str] = []
    valid_images: List[Image.Image] = []
    for img_path in image_paths:
        try:
            valid_images.append(_safe_load_rgb_image(img_path))
            valid_paths.append(img_path)
        except Exception as exc:
            logger.warning("Skipping image '%s': %s", img_path, exc)

    if not valid_images:
        return np.empty((0, 512), dtype=np.float32), []

    vectors = []
    for start in range(0, len(valid_images), batch_size):
        batch = valid_images[start:start + batch_size]
        inputs = processor(images=batch, return_tensors="pt", padding=True).to(device)

        with torch.no_grad():
            features = model.get_image_features(**inputs)

        features = torch.nn.functional.normalize(features, p=2, dim=1)
        vectors.append(features.cpu().numpy().astype(np.float32))

    embeddings = np.vstack(vectors)
    logger.info("Generated %s image embeddings", len(valid_paths))
    return embeddings, valid_paths


def generate_text_embeddings(
    texts: List[str],
    batch_size: int = 64,
) -> np.ndarray:
    """Generate normalized sentence embeddings for product titles/text."""
    if not texts:
        return np.empty((0, 384), dtype=np.float32)

    sentence_model = get_sentence_model()
    result = sentence_model.encode(
        texts,
        batch_size=batch_size,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return result.astype(np.float32)
