from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_admin
from app.services.dashboard_service import DashboardService
from app.schemas.auth import ApiResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=ApiResponse)
def get_stats(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    svc = DashboardService(db)
    stats = svc.get_stats()
    return ApiResponse(data=stats)
