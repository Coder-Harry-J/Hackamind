"""Filename parser — extract brand, product name, view type from image filenames."""

import os
import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

VIEW_KEYWORDS = {
    "back": "back",
    "front": "front",
    "side": "side",
    "interior": "interior",
    "worn": "worn",
    "cropped": "cropped worn",
    "detail": "detail",
    "top": "top",
    "bottom": "bottom",
    "close": "close-up",
    "zoom": "close-up",
    "other": "other",
}

KNOWN_BRANDS = [
    "louis vuitton",
    "nike",
    "adidas",
    "puma",
    "reebok",
    "new balance",
    "zara",
    "gucci",
    "prada",
    "hermes",
    "chanel",
    "dior",
    "balenciaga",
    "fendi",
    "burberry",
    "versace",
    "coach",
]


def _clean_filename(filename: str) -> str:
    """Strip extension, model codes, and normalize separators."""
    name = os.path.splitext(filename)[0]
    # Remove model/SKU codes like --M26961_PM1_
    name = re.sub(r"--?[A-Z0-9]+_PM\d+_?", " ", name)
    # Replace separators with spaces
    name = name.replace("-", " ").replace("_", " ")
    # Collapse whitespace
    name = re.sub(r"\s+", " ", name).strip().lower()
    return name


def _detect_brand(text: str) -> str:
    for brand in KNOWN_BRANDS:
        if brand in text:
            return brand
    return ""


def _detect_view(text: str, product_key: str = "") -> str:
    """Detect view type from filename text.

    Runs on ``text`` with the product_key removed so that words inside the
    product name (e.g. 'back' in 'backpack') don't false-match a view keyword.
    Uses whole-word matching via regex to prevent partial matches.
    """
    # Strip product key from search space to avoid false matches
    search_text = text
    if product_key:
        search_text = search_text.replace(product_key, " ")
    search_text = re.sub(r"\s+", " ", search_text).strip()

    for keyword, view_name in VIEW_KEYWORDS.items():
        if re.search(rf"\b{re.escape(keyword)}\b", search_text):
            return view_name
    return "default"


def _extract_product_key(text: str, brand: str) -> str:
    """Extract the core product identifier by removing brand and view tokens."""
    remaining = text
    if brand:
        remaining = remaining.replace(brand, "").strip()
    # Remove view keywords
    for keyword in VIEW_KEYWORDS:
        remaining = re.sub(rf"\b{keyword}\b", "", remaining)
    # Remove 'view' word
    remaining = re.sub(r"\bview\b", "", remaining)
    remaining = re.sub(r"\s+", " ", remaining).strip()
    return remaining


def parse_filename(image_path: str) -> Dict[str, str]:
    """Parse a single image path and return extracted metadata."""
    filename = os.path.basename(image_path)
    cleaned = _clean_filename(filename)

    brand = _detect_brand(cleaned)
    product_key = _extract_product_key(cleaned, brand)
    view = _detect_view(cleaned, product_key)

    # Build a human-readable product name
    parts = []
    if brand:
        parts.append(brand.title())
    if product_key:
        parts.append(product_key.title())
    product_name = " ".join(parts) if parts else "Unknown Product"

    return {
        "filename": filename,
        "brand": brand,
        "product_key": product_key,
        "product_name": product_name,
        "view": view,
        "clean_text": cleaned,
    }


def parse_filenames(image_paths: List[str]) -> List[Dict[str, str]]:
    """Parse all filenames and return list of metadata dicts (parallel to image_paths)."""
    results = []
    for path in image_paths:
        try:
            results.append(parse_filename(path))
        except Exception as exc:
            logger.warning("Failed to parse filename '%s': %s", path, exc)
            results.append({
                "filename": os.path.basename(path),
                "brand": "",
                "product_key": "",
                "product_name": "Unknown Product",
                "view": "default",
                "clean_text": "",
            })
    return results


def _clean_text(text: str) -> str:
    """Lowercase, replace separators with spaces, collapse whitespace."""
    text = text.lower()
    text = re.sub(r"[-_]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def get_grouping_texts(
    images: List[str],
    file_metadata: List[Dict[str, str]] = None,
) -> Dict[str, str]:
    """Build a grouping-text string per image for CLIP text-embedding clustering.

    Returns a **dict** mapping ``filename -> grouping_text`` so callers can
    look up texts by basename even after invalid images are filtered out.

    Each text combines cleaned filename tokens with optional metadata fields
    (brand, product_key, title) so that images of the same product receive
    similar text signals.
    """
    result: Dict[str, str] = {}

    for i, img_path in enumerate(images):
        try:
            filename = os.path.basename(img_path)
            name_no_ext = os.path.splitext(filename)[0]
            text = _clean_text(name_no_ext)

            # Merge metadata when available
            if file_metadata and i < len(file_metadata):
                meta = file_metadata[i]
                if meta.get("brand"):
                    text += " " + meta["brand"]
                if meta.get("product_key"):
                    text += " " + meta["product_key"]
                if meta.get("title"):
                    text += " " + _clean_text(meta["title"])

            result[filename] = text.strip() if text.strip() else "unknown product"
        except Exception as exc:
            logger.warning("get_grouping_texts failed for '%s': %s", img_path, exc)
            result[os.path.basename(img_path)] = "unknown product"

    return result
