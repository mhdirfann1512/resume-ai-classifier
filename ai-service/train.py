import pandas as pd
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from sklearn.preprocessing import LabelEncoder
import torch

# 1. Load dataset
df = pd.read_csv("dataset.csv")

# 2. Encode labels
label_encoder = LabelEncoder()
df["label"] = label_encoder.fit_transform(df["label"])

# save mapping (IMPORTANT)
label_mapping = dict(enumerate(label_encoder.classes_))

# 3. Convert to HuggingFace dataset
dataset = Dataset.from_pandas(df)

# 4. Split train/test
dataset = dataset.train_test_split(test_size=0.2)

# 5. Model
model_name = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"
tokenizer = AutoTokenizer.from_pretrained(model_name)

def tokenize(batch):
    return tokenizer(batch["text"], truncation=True, padding="max_length", max_length=256)

dataset = dataset.map(tokenize)

# 6. Load model for classification
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=len(label_encoder.classes_)
)

# 7. Training args
training_args = TrainingArguments(
    output_dir="./model",
    learning_rate=2e-5,
    per_device_train_batch_size=4,
    num_train_epochs=3,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    logging_dir="./logs"
)

# 8. Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"]
)

# 9. Train
trainer.train()

# 10. Save model
model.save_pretrained("./model")
tokenizer.save_pretrained("./model")

# 11. Save label mapping
import json
with open("label_mapping.json", "w") as f:
    json.dump(label_mapping, f)

print("DONE TRAINING 🚀")