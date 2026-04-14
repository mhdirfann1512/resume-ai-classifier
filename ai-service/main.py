from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

# We use a reliable, public multilingual model
# This model is excellent for Malay and English classification
MODEL_NAME = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"

print("Loading AI Model... Please wait (This may take a few minutes on first run)")
classifier = pipeline("zero-shot-classification", model=MODEL_NAME)
print("AI Model Loaded Successfully!")

class ResumeData(BaseModel):
    text: str

# Your Malay Department Labels
DEPARTMENTS = [
    "Bahagian Pembangunan Aplikasi", 
    "Bahagian Pelaksanaan Strategik ICT", 
    "Bahagian Keselamatan Siber", 
    "Bahagian Kewangan dan Akaun",
    "Bahagian Pembangunan Sumber Manusia",
    "Bahagian Operasi Teknikal",
    "Bahagian Rangkaian dan Komunikasi Digital",
    "Bahagian Infrastruktur Pusat Data",
    "Bahagian Korporat dan Kualiti",
    "Bahagian Dasar dan Pematuhan",
    "Bahagian Kecerdasan Digital",
    "Bahagian Transformasi Digital",
    "Bahagian Perundingan ICT"
]

@app.post("/classify")
async def classify_resume(data: ResumeData):
    # Perform classification
    # We set multi_label=False to get a probability distribution that adds up to 1 (100%)
    result = classifier(data.text, candidate_labels=DEPARTMENTS, multi_label=False)
    
    # Map ALL labels to their scores and sort them by highest confidence
    full_breakdown = sorted(
        [{"department": label, "confidence": round(score, 4)} for label, score in zip(result['labels'], result['scores'])],
        key=lambda x: x['confidence'], 
        reverse=True
    )
    
    return {
        "top_prediction": full_breakdown[0],
        "all_predictions": full_breakdown
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)