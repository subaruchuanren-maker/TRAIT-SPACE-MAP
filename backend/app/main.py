from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"
AXES_PATH = DATA_DIR / "axes.json"
TRAITS_PATH = DATA_DIR / "traits.csv"
PROFILES_PATH = DATA_DIR / "profiles.json"


class CompareRequest(BaseModel):
    trait_a: str = Field(..., description="Left side trait id")
    trait_b: str = Field(..., description="Right side trait id")


class RecommendRequest(BaseModel):
    profile_id: str = Field(..., description="Profile id from profiles.json")
    top_n: int = Field(3, ge=1, le=12)


def load_axes_doc() -> dict[str, Any]:
    with AXES_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def get_axis_ids() -> list[str]:
    return [axis["id"] for axis in load_axes_doc()["axes"]]


def load_traits() -> list[dict[str, Any]]:
    axis_ids = get_axis_ids()
    traits: list[dict[str, Any]] = []
    with TRAITS_PATH.open("r", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        for row in reader:
            vector = {axis: float(row[axis]) for axis in axis_ids}
            traits.append(
                {
                    "trait_id": row["trait_id"],
                    "name_ja": row["name_ja"],
                    "name_en": row["name_en"],
                    "vector": vector,
                }
            )
    return traits


def load_profiles() -> dict[str, dict[str, Any]]:
    with PROFILES_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)
    return {profile["id"]: profile for profile in data["profiles"]}


def compare_trait_vectors(trait_a: str, trait_b: str) -> dict[str, Any]:
    trait_map = {trait["trait_id"]: trait for trait in load_traits()}
    if trait_a not in trait_map or trait_b not in trait_map:
        raise HTTPException(status_code=404, detail="Unknown trait id")

    vector_a = trait_map[trait_a]["vector"]
    vector_b = trait_map[trait_b]["vector"]
    rows = []
    for axis in get_axis_ids():
        a = vector_a[axis]
        b = vector_b[axis]
        rows.append({"axis": axis, "a": a, "b": b, "diff": a - b})

    return {
        "trait_a": trait_map[trait_a],
        "trait_b": trait_map[trait_b],
        "rows": rows,
    }


def recommend_traits(profile_id: str, top_n: int) -> dict[str, Any]:
    profiles = load_profiles()
    if profile_id not in profiles:
        raise HTTPException(status_code=404, detail="Unknown profile id")

    profile = profiles[profile_id]
    weights = profile["weights"]

    ranking = []
    for trait in load_traits():
        score = sum(trait["vector"][axis] * float(weights[axis]) for axis in get_axis_ids())
        ranking.append(
            {
                "trait_id": trait["trait_id"],
                "name_ja": trait["name_ja"],
                "name_en": trait["name_en"],
                "score": score,
            }
        )

    ranking.sort(key=lambda item: item["score"], reverse=True)
    return {
        "profile": profile,
        "top": ranking[:top_n],
    }


def scatter_points(x_axis: str, y_axis: str) -> dict[str, Any]:
    axis_ids = set(get_axis_ids())
    if x_axis not in axis_ids or y_axis not in axis_ids:
        raise HTTPException(status_code=400, detail="Invalid axis id")

    points = []
    for trait in load_traits():
        points.append(
            {
                "trait_id": trait["trait_id"],
                "name_ja": trait["name_ja"],
                "name_en": trait["name_en"],
                "x": trait["vector"][x_axis],
                "y": trait["vector"][y_axis],
            }
        )

    return {
        "x_axis": x_axis,
        "y_axis": y_axis,
        "points": points,
    }


app = FastAPI(title="Trait Map MVP API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/axes")
def axes() -> dict[str, Any]:
    return load_axes_doc()


@app.get("/traits")
def traits() -> dict[str, Any]:
    return {"traits": load_traits()}


@app.get("/profiles")
def profiles() -> dict[str, Any]:
    return {"profiles": list(load_profiles().values())}


@app.post("/compare")
def compare(payload: CompareRequest) -> dict[str, Any]:
    return compare_trait_vectors(payload.trait_a, payload.trait_b)


@app.post("/recommend")
def recommend(payload: RecommendRequest) -> dict[str, Any]:
    return recommend_traits(payload.profile_id, payload.top_n)


@app.get("/scatter")
def scatter(
    x_axis: str = Query(..., description="x-axis id"),
    y_axis: str = Query(..., description="y-axis id"),
) -> dict[str, Any]:
    return scatter_points(x_axis, y_axis)
