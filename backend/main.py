from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, Column, String, DateTime, Boolean, LargeBinary, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import os
import uuid
from typing import Optional
import base64
from pydantic import BaseModel

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/secretdb")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Secret(Base):
    __tablename__ = "secrets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    encrypted_data = Column(LargeBinary, nullable=False)
    iv = Column(String, nullable=False)
    filename = Column(String, nullable=True)
    content_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_viewed = Column(Boolean, default=False)
    expires_in = Column(Integer, nullable=True)

Base.metadata.create_all(bind=engine)

class SecretCreate(BaseModel):
    encrypted_data: str
    iv: str
    filename: Optional[str] = None
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    expires_in: Optional[int] = 30

class SecretResponse(BaseModel):
    id: str
    encrypted_data: str
    iv: str
    filename: Optional[str]
    content_type: Optional[str]
    file_size: Optional[int]
    created_at: datetime
    expires_at: Optional[datetime]
    expires_in: Optional[int]

app = FastAPI(title="Secret Sharing API", version="1.0.0")
NEXT_PUBLIC_URL = os.getenv("NEXT_PUBLIC_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[NEXT_PUBLIC_URL, "http://localhost:3000"],
    allow_methods=['GET', 'POST'],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "Secret Sharing API is running"}

@app.post("/api/secrets", response_model=dict)
async def create_secret(
    encrypted_data: str = Form(...),
    iv: str = Form(...),
    filename: str = Form(None),
    content_type: str = Form(None),
    file_size: int = Form(None),
    expires_in: int = Form(30),
    db: Session = Depends(get_db)
):
    try:
        encrypted_bytes = base64.b64decode(encrypted_data)
        
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        secret = Secret(
            encrypted_data=encrypted_bytes,
            iv=iv,
            filename=filename,
            content_type=content_type,
            file_size=file_size,
            expires_at=expires_at,
            expires_in=expires_in
        )
        
        db.add(secret)
        db.commit()
        db.refresh(secret)
        
        return {
            "id": secret.id,
            "message": "Secret created successfully",
            "expires_at": secret.expires_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create secret: {str(e)}")

@app.get("/api/secrets/{secret_id}", response_model=SecretResponse)
async def get_secret(secret_id: str, db: Session = Depends(get_db)):
    try:
        secret = db.query(Secret).filter(Secret.id == secret_id).first()
        
        if not secret:
            raise HTTPException(status_code=404, detail="Secret not found")
        
        if secret.is_viewed:
            raise HTTPException(status_code=404, detail="Secret not found")

        secret.is_viewed = True
        db.commit()
        
        encrypted_data_b64 = base64.b64encode(secret.encrypted_data).decode()

        db.delete(secret)
        db.commit()
        
        return SecretResponse(
            id=secret.id,
            encrypted_data=encrypted_data_b64,
            iv=secret.iv,
            filename=secret.filename,
            content_type=secret.content_type,
            file_size=secret.file_size,
            created_at=secret.created_at,
            expires_at=secret.expires_at,
            expires_in=secret.expires_in
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve secret: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
