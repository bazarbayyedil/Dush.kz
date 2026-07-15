from fastapi import FastAPI

from .api import router

app = FastAPI(title="Dush.kz API", version="1.0.0", docs_url="/api/docs", openapi_url="/api/openapi.json")
app.include_router(router)
