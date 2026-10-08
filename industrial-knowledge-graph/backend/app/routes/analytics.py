from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.services.industrial_analytics_service import IndustrialAnalyticsService

router = APIRouter(prefix="/analytics", tags=["Industrial Analytics"])
analytics_service = IndustrialAnalyticsService()

class WhatIfRequest(BaseModel):
    machine_name: str = "Pump P-101"
    temperature: float = 195.0
    rpm: float = 5200.0
    pressure: float = 8.5

class AnomalyRequest(BaseModel):
    sensor_values: List[float]

@router.get("/health-score")
def get_health_score(
    machine: str = "Pump P-101",
    temperature: float = Query(75.0, description="Current temp in °C"),
    vibration: float = Query(2.1, description="Current vibration in mm/s"),
    pressure: float = Query(6.2, description="Current pressure in bar"),
    rpm: float = Query(3450.0, description="Current RPM"),
    db: Session = Depends(get_db)
):
    metrics = {
        "temperature": temperature,
        "vibration": vibration,
        "pressure": pressure,
        "rpm": rpm
    }
    return analytics_service.calculate_machine_health_score(machine, metrics, db)

@router.post("/what-if")
def simulate_what_if(req: WhatIfRequest):
    return analytics_service.simulate_what_if(req.machine_name, req.temperature, req.rpm, req.pressure)

@router.post("/anomaly-detection")
def detect_anomalies(req: AnomalyRequest):
    return analytics_service.detect_anomalies(req.sensor_values)

@router.get("/knowledge-quality")
def get_knowledge_quality(db: Session = Depends(get_db)):
    return analytics_service.detect_knowledge_gaps_and_conflicts(db)
