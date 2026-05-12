from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import create_tables
from kafka.consumer import start_consumer
from routers import rating, matching, claim, geolocation


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    start_consumer()
    print("[SSFRS AI Service] Started on port 8083")
    yield
    # Shutdown (nothing needed)


app = FastAPI(
    title="SSFRS AI Engine Service",
    description="Service 3 — Worker rating, AI matching, claim mediation, geolocation verification",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8082"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rating.router)
app.include_router(matching.router)
app.include_router(claim.router)
app.include_router(geolocation.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SSFRS AI Engine", "port": 8083}
