"""Catalog object construction for deterministic API output."""

import os
import re
from pathlib import PurePosixPath
from typing import Dict, List, Optional


def _normalize_name(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def _to_relative(path: str) -> str:
    """Return a clean forward-slash relative path regardless of input form."""
    p = path.replace("\\", "/")
    # Already relative with a known prefix — return as-is
    for prefix in ("test-images/", "uploads/", "images/"):
        if p.startswith(prefix) or "/" + prefix in p and not p.startswith("/"):
            # Find the first occurrence and strip everything before it
            idx = p.find(prefix)
            return p[idx:]
    # Strip absolute prefix up to and including the upload/image root folder
    for marker in ("/uploads/", "/test-images/", "/images/"):
        idx = p.find(marker)
        if idx != -1:
            return p[idx + 1:]
    # Fallback: just the filename
    return str(PurePosixPath(p).name)


def _default_product_name(
    attributes: Dict[str, str],
    file_meta: Optional[Dict] = None,
) -> str:
    """Build a human-readable product name from filename metadata or attributes."""
    if file_meta:
        parts = []
        if file_meta.get("brand"):
            parts.append(file_meta["brand"].title())
        if file_meta.get("product_key"):
            key = file_meta["product_key"].replace("_", " ").replace("-", " ")
            parts.append(key.title())
        if parts:
            return " ".join(parts)

    brand = attributes.get("brand", "unknown")
    category = attributes.get("category", "product")
    if brand and brand != "unknown":
        return f"{brand.title()} {category.title()}"
    return category.title()


def _generate_description(attributes: Dict[str, str], product_name: str) -> str:
    category = attributes.get("category", "product")
    color = attributes.get("color", "neutral")
    object_type = attributes.get("object_type", "item")
    return f"{product_name} in {color} tone. {category.title()} {object_type} suitable for daily use."


def _group_by_view(
    images: List[str],
    file_metadata: Dict[str, Dict],
    color: str = "unknown",
) -> List[Dict]:
    """Group cluster images into variants by view type using filename metadata."""
    view_groups: Dict[str, List[str]] = {}
    for img in sorted(images):
        rel = _to_relative(img)
        fname = os.path.basename(img)
        meta = file_metadata.get(fname, {})
        view = meta.get("view", "default")
        view_groups.setdefault(view, []).append(rel)

    variants = []
    for view, paths in sorted(view_groups.items()):
        variants.append({"view": view, "color": color, "images": paths})
    return variants


def build_catalog(
    clusters: List[Dict],
    cluster_attributes: Dict[int, Dict[str, str]],
    title_mapping: Dict[int, str],
    file_metadata: Optional[Dict[str, Dict]] = None,
) -> Dict:
    """Build structured product catalog JSON from clusters.

    Parameters
    ----------
    file_metadata : dict mapping **filename** -> parsed metadata dict with keys like
        brand, product_key, view, grouping_text.
    """
    file_metadata = file_metadata or {}
    products = []

    for idx, cluster in enumerate(clusters, start=1):
        cid = cluster["cluster_id"]
        attrs = cluster_attributes.get(cid, {})

        # ── Product name ─────────────────────────────────────────────────
        product_name = title_mapping.get(cid)
        if product_name:
            product_name = _normalize_name(product_name)
        else:
            # Use file metadata from the first image in the cluster
            first_file = os.path.basename(cluster["images"][0]) if cluster["images"] else None
            first_meta = file_metadata.get(first_file) if first_file else None
            product_name = _default_product_name(attrs, first_meta)

        color = attrs.get("color", "unknown")
        category = attrs.get("category", "unknown")
        description = _generate_description(attrs, product_name)

        # ── Images as relative paths ─────────────────────────────────────
        relative_images = [_to_relative(p) for p in sorted(cluster["images"])]
        variants = _group_by_view(cluster["images"], file_metadata, color)

        product = {
            "product_id": f"prod_{idx:03d}",
            "product_name": product_name,
            "category": category,
            "description": description,
            "variants": variants,
            "images": relative_images,
        }
        products.append(product)

    return {"products": products}
