from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Dict, List, Tuple

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
AXES_PATH = DATA_DIR / "axes.json"
TRAITS_PATH = DATA_DIR / "traits.csv"
PROFILES_PATH = DATA_DIR / "profiles.json"


def load_axes() -> List[dict]:
    with AXES_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)
    return data["axes"]


def axis_ids() -> List[str]:
    return [axis["id"] for axis in load_axes()]


def load_traits() -> List[dict]:
    axes = axis_ids()
    traits: List[dict] = []
    with TRAITS_PATH.open("r", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        for row in reader:
            vector = {axis: float(row[axis]) for axis in axes}
            traits.append(
                {
                    "trait_id": row["trait_id"],
                    "name_ja": row["name_ja"],
                    "name_en": row["name_en"],
                    "vector": vector,
                }
            )
    return traits


def load_profiles() -> Dict[str, dict]:
    with PROFILES_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)
    return {profile["id"]: profile for profile in data["profiles"]}


def compare_traits(trait_a_id: str, trait_b_id: str) -> List[Tuple[str, float, float, float]]:
    traits = {trait["trait_id"]: trait for trait in load_traits()}
    if trait_a_id not in traits or trait_b_id not in traits:
        missing = [trait_id for trait_id in [trait_a_id, trait_b_id] if trait_id not in traits]
        raise ValueError(f"Unknown trait id: {', '.join(missing)}")

    vector_a = traits[trait_a_id]["vector"]
    vector_b = traits[trait_b_id]["vector"]
    results: List[Tuple[str, float, float, float]] = []
    for axis in axis_ids():
        a = vector_a[axis]
        b = vector_b[axis]
        results.append((axis, a, b, a - b))
    return results


def recommend(profile_id: str, top_n: int = 3) -> List[Tuple[str, float]]:
    profiles = load_profiles()
    if profile_id not in profiles:
        raise ValueError(f"Unknown profile id: {profile_id}")

    weights = profiles[profile_id]["weights"]
    ranked: List[Tuple[str, float]] = []
    for trait in load_traits():
        score = sum(trait["vector"][axis] * float(weights[axis]) for axis in axis_ids())
        ranked.append((trait["trait_id"], score))

    ranked.sort(key=lambda item: item[1], reverse=True)
    return ranked[:top_n]


def scatter_points(x_axis: str, y_axis: str) -> List[Tuple[str, float, float]]:
    valid_axes = set(axis_ids())
    if x_axis not in valid_axes or y_axis not in valid_axes:
        raise ValueError("Invalid axis id")

    points: List[Tuple[str, float, float]] = []
    for trait in load_traits():
        points.append((trait["trait_id"], trait["vector"][x_axis], trait["vector"][y_axis]))
    return points


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Trait Map MVP data demo")
    sub = parser.add_subparsers(dest="command", required=True)

    compare_parser = sub.add_parser("compare", help="Compare two traits axis-by-axis")
    compare_parser.add_argument("trait_a")
    compare_parser.add_argument("trait_b")

    recommend_parser = sub.add_parser("recommend", help="Recommend top traits for profile")
    recommend_parser.add_argument("profile_id")
    recommend_parser.add_argument("--top", type=int, default=3)

    scatter_parser = sub.add_parser("scatter", help="Get coordinates for 2-axis scatter")
    scatter_parser.add_argument("x_axis")
    scatter_parser.add_argument("y_axis")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "compare":
        rows = compare_traits(args.trait_a, args.trait_b)
        print("axis,a,b,diff(a-b)")
        for axis, value_a, value_b, diff in rows:
            print(f"{axis},{value_a:.3f},{value_b:.3f},{diff:.3f}")
        return

    if args.command == "recommend":
        rows = recommend(args.profile_id, args.top)
        print("rank,trait_id,score")
        for index, (trait_id, score) in enumerate(rows, start=1):
            print(f"{index},{trait_id},{score:.3f}")
        return

    if args.command == "scatter":
        rows = scatter_points(args.x_axis, args.y_axis)
        print("trait_id,x,y")
        for trait_id, x_value, y_value in rows:
            print(f"{trait_id},{x_value:.3f},{y_value:.3f}")


if __name__ == "__main__":
    main()
