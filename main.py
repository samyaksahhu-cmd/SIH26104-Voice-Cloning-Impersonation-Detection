import asyncio
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

API_KEY = os.getenv("REALITY_DEFENDER_API_KEY")
REALITY_URL = "https://api.prd.realitydefender.xyz"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://10.123.51.10:5500",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "provider": "reality-defender",
        "api_key_configured": "true" if API_KEY else "false",
    }


def normalize_result(result: dict[str, Any]) -> dict[str, Any]:
    status = str(result.get("overallStatus", "UNABLE_TO_EVALUATE")).upper()
    summary = result.get("resultsSummary") or {}
    metadata = summary.get("metadata") or {}
    score = metadata.get("finalScore")

    if score is None:
        scores = [model.get("finalScore") for model in result.get("models", [])]
        score = next((value for value in scores if isinstance(value, (int, float))), None)

    if status == "AUTHENTIC":
        verdict = "authentic"
    elif status in {"FAKE", "SUSPICIOUS"}:
        verdict = "suspicious"
    else:
        verdict = "unavailable"

    return {
        "verdict": verdict,
        "provider_status": status,
        "score": score,
        "signals": metadata.get("reasons", []),
    }


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    if not API_KEY:
        raise HTTPException(500, "REALITY_DEFENDER_API_KEY is missing")

    headers = {"X-API-KEY": API_KEY}

    async with httpx.AsyncClient(timeout=60) as client:
        signed = await client.post(
            f"{REALITY_URL}/api/files/aws-presigned",
            headers={**headers, "Content-Type": "application/json"},
            json={"fileName": file.filename},
        )
        signed.raise_for_status()

        response = signed.json().get("response", {})
        signed_url = response["signedUrl"]
        request_id = response.get("requestId") or response.get("id")

        if not request_id:
            raise HTTPException(502, "No request ID returned by Reality Defender")

        content = await file.read()

        upload = await client.put(signed_url, content=content)
        upload.raise_for_status()

        for _ in range(60):
            result_response = await client.get(
                f"{REALITY_URL}/api/media/users/{request_id}",
                headers=headers,
            )
            result_response.raise_for_status()

            result = result_response.json()

            # Confirm these exact fields against your Reality Defender response.
            result_data = result.get("response", result)
            status = str(result_data.get("overallStatus", "")).upper()

            if status in {"AUTHENTIC", "FAKE", "SUSPICIOUS", "NOT_APPLICABLE", "UNABLE_TO_EVALUATE"}:
                return {
                    "scan_id": request_id,
                    "filename": file.filename,
                    "result": normalize_result(result_data),
                }

            await asyncio.sleep(2)

    raise HTTPException(504, "Analysis timed out")