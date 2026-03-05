"""Catalog object construction for deterministic API output."""

import re
from typing import Dict, List


def _normalize_name(value: str) -> str:
    cleaned = re.sub(r"\s+", " ", value.strip())
    return cleaned


def _default_product_name(attributes: Dict[str, str]) -> str:
    brand = attributes.get("brand", "unknown")
    category = attributes.get("category", "product")
    if brand and brand != "unknown":
        return f"{brand.title()} {category.title()}"
    return category.title()


def generate_description(attributes: Dict[str, str], product_name: str) -> str:
    category = attributes.get("category", "product")
    color = attributes.get("color", "neutral")
    object_type = attributes.get("object_type", "item")
    return f"{product_name} in {color} tone. {category.title()} {object_type} suitable for daily use."


def build_catalog(
    clusters: List[Dict],
    cluster_attributes: Dict[int, Dict[str, str]],
    title_mapping: Dict[int, str],
) -> Dict:
    products = []

    for idx, cluster in enumerate(clusters, start=1):
        cluster_id = cluster["cluster_id"]
        attrs = cluster_attributes.get(cluster_id, {})

        product_name = title_mapping.get(cluster_id)
        if product_name:
            product_name = _normalize_name(product_name)
        else:
            product_name = _default_product_name(attrs)

        color = attrs.get("color", "unknown")
        category = attrs.get("category", "unknown")
        description = generate_description(attrs, product_name)

        product = {
            "product_id": f"prod_{idx:03d}",
            "product_name": product_name,
            "category": category,
            "description": description,
            "variants": [
                {
                    "color": color,
                    "images": sorted(cluster["images"]),
                }
            ],
            "images": sorted(cluster["images"]),
        }
        products.append(product)

    return {"products": products}
