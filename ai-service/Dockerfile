# 1. Guna image Python yang ringan
FROM python:3.10-slim

# 2. Set working directory dalam container
WORKDIR /app

# 3. Install dependencies yang diperlukan untuk library AI
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy fail requirements dan install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy semua kod AI ke dalam container
COPY . .

# 6. Jalankan FastAPI guna Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]