"""Embedding utilities for image and text processing in the catalog pipeline."""

import logging
from pathlib import Path
from typing import List, Tuple

import numpy as np
import torch
from PIL import Image

try:
    import pillow_avif  # noqa: F401 — registers AVIF codec with Pillow
except ImportError:
    pass

from sentence_transformers import SentenceTransformer
from transformers import CLIPModel, CLIPProcessor

logger = logging.getLogger(__name__)

_clip_model = None
_clip_processor = None
_sentence_model = None
_device = None

CLIP_DIM = 512
SENTENCE_DIM = 384


def _extract_tensor(output, attr_name: str = "image_embeds") -> torch.Tensor:
    """Safely extract a tensor from a HuggingFace model output (v4 or v5+)."""
    if isinstance(output, torch.Tensor):
        return output
    if hasattr(output, attr_name):
        return getattr(output, attr_name)
    if hasattr(output, "pooler_output"):
        return output.pooler_output
    return output[0]


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
    img = Image.open(path)
    img = img.convert("RGB")
    return img


# ── Image embeddings (CLIP) ─────────────────────────────────────────────────

def generate_image_embeddings(
    image_paths: List[str],
    batch_size: int = 32,
) -> Tuple[np.ndarray, List[str]]:
    """Generate normalized CLIP image embeddings for valid images in batches."""
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
        return np.empty((0, CLIP_DIM), dtype=np.float32), []

    vectors: List[np.ndarray] = []
    for start in range(0, len(valid_images), batch_size):
        batch = valid_images[start : start + batch_size]
        inputs = processor(images=batch, return_tensors="pt", padding=True)
        inputs = {k: v.to(device) if hasattr(v, "to") else v for k, v in inputs.items()}

        with torch.no_grad():
            output = model.get_image_features(**inputs)
            features = _extract_tensor(output, "image_embeds")

        features = torch.nn.functional.normalize(features, p=2, dim=1)
        vectors.append(features.cpu().numpy().astype(np.float32))

    embeddings = np.vstack(vectors)
    logger.info("Generated %d image embeddings", len(valid_paths))
    return embeddings, valid_paths


# ── CLIP text embeddings (same 512-d space as images) ────────────────────────

def generate_clip_text_embeddings(
    texts: List[str],
    batch_size: int = 64,
) -> np.ndarray:
    """Generate normalized CLIP text embeddings — same vector space as image embeddings."""
    if not texts:
        return np.empty((0, CLIP_DIM), dtype=np.float32)

    model, processor, device = get_clip_components()

    vectors: List[np.ndarray] = []
    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        inputs = processor(text=batch, return_tensors="pt", padding=True, truncation=True)
        inputs = {k: v.to(device) if hasattr(v, "to") else v for k, v in inputs.items()}

        with torch.no_grad():
            output = model.get_text_features(**inputs)
            features = _extract_tensor(output, "text_embeds")

        features = torch.nn.functional.normalize(features, p=2, dim=1)
        vectors.append(features.cpu().numpy().astype(np.float32))

    return np.vstack(vectors)


# ── Sentence-transformer text embeddings (384-d) ────────────────────────────

def generate_text_embeddings(
    texts: List[str],
    batch_size: int = 64,
) -> np.ndarray:
    """Generate normalized sentence-transformer embeddings for product titles/text."""
    if not texts:
        return np.empty((0, SENTENCE_DIM), dtype=np.float32)

    sentence_model = get_sentence_model()
    result = sentence_model.encode(
        texts,
        batch_size=batch_size,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return result.astype(np.float32)
