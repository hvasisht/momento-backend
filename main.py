from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, moments, worth, sharing

app = FastAPI(title="Momento API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(moments.router)
app.include_router(worth.router)
app.include_router(sharing.router)


@app.get("/health")
def health():
    return {"status": "ok"}
