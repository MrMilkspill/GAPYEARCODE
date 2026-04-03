from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.models.analysis import ChatRequest, ChatResponse
from app.models.profile import CurrentUser
from app.services.mistral import generate_chat_response


router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, _: CurrentUser = Depends(get_current_user)) -> ChatResponse:
    try:
        result = await generate_chat_response(payload.message)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return ChatResponse(**result)
