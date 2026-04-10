from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

# 1. Load the model (This happens once when the server starts)
# 'facebook/bart-large-mnli' is a top-tier model for zero-shot tasks
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# 2. Define the Request Body
class ResumeData(BaseModel):
    text: str

# 3. Define our Department Labels
DEPARTMENTS = ["Information Technology", "Human Resources", "Finance", "Sales", "Engineering"]

@app.post("/classify")
async def classify_resume(data: ResumeData):
    # Perform the classification
    result = classifier(data.text, candidate_labels=DEPARTMENTS)
    
    # Return the top result
    return {
        "department": result['labels'][0],
        "confidence": round(result['scores'][0], 4)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)