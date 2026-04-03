from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.models.profile import CurrentUser, PremedProfileInput
from app.services.benchmark_data import get_benchmark_config
from app.services.mistral import generate_profile_analysis
from app.services.profile_store import profile_store
from app.services.scoring import calculate_profile_readiness
from app.services.source_backed_analysis import (
    build_source_backed_comparisons,
    collect_comparison_sources,
)


router = APIRouter(prefix="/profiles", tags=["profiles"])


def attach_score(profile):
    profile.scoreResult = calculate_profile_readiness(profile)
    return profile


@router.get("")
async def list_profiles(user: CurrentUser = Depends(get_current_user)) -> dict[str, list[dict]]:
    try:
        profiles = await profile_store.list_profiles_for_user(user.id)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return {"profiles": [attach_score(profile).model_dump() for profile in profiles]}


@router.post("")
async def create_profile(
    payload: PremedProfileInput,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, dict]:
    try:
        profile = await profile_store.create_profile_for_user(user.id, payload)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return {"profile": attach_score(profile).model_dump()}


@router.get("/{profile_id}")
async def get_profile(profile_id: str, user: CurrentUser = Depends(get_current_user)) -> dict[str, dict]:
    try:
        profile = await profile_store.get_profile_for_user(user.id, profile_id)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    return {"profile": attach_score(profile).model_dump()}


@router.patch("/{profile_id}")
async def update_profile(
    profile_id: str,
    payload: PremedProfileInput,
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, dict]:
    try:
        profile = await profile_store.update_profile_for_user(user.id, profile_id, payload)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    return {"profile": attach_score(profile).model_dump()}


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(profile_id: str, user: CurrentUser = Depends(get_current_user)) -> None:
    try:
        await profile_store.delete_profile_for_user(user.id, profile_id)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.get("/{profile_id}/ai-analysis")
async def profile_ai_analysis(
    profile_id: str,
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        profile = await profile_store.get_profile_for_user(user.id, profile_id)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    score = calculate_profile_readiness(profile)
    comparisons = build_source_backed_comparisons(profile)
    sources = collect_comparison_sources(comparisons)

    try:
        analysis = await generate_profile_analysis(
            profile,
            score,
            get_benchmark_config(),
            [comparison.model_dump() for comparison in comparisons],
        )
    except RuntimeError as error:
        status_code = 503 if "not configured" in str(error).lower() else 502
        raise HTTPException(status_code=status_code, detail=str(error)) from error

    return {
        **analysis,
        "comparisons": [comparison.model_dump() for comparison in comparisons],
        "sources": [source.model_dump() for source in sources],
    }
