# Pro Road Accident Risk Prediction System (RTA Edition)

A professional-level AI microservice trained on the **RTA Dataset (12,000+ records)**.

## Project Structure
- `app.py`: Pro FastAPI server handling text-based predictions.
- `train.py`: Pro training script using `LabelEncoder` for real-world categorical data.
- `data/RTA Dataset.csv`: The main dataset.
- `model.pkl`: Saved model and encoders.

## Setup and Running

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Train the Pro Model:**
   ```bash
   python train.py
   ```

3. **Run the API Server:**
   ```bash
   python -m uvicorn app:app --reload
   ```

## Pro API Usage

### POST /predict
Now accepts real-world category names instead of just numbers!

**Payload Example:**
```json
{
  "age_band_of_driver": "18-30",
  "driving_experience": "1-2yr",
  "type_of_vehicle": "Automobile",
  "location": "Residential areas",
  "road_surface_conditions": "Dry",
  "light_conditions": "Daylight",
  "weather_conditions": "Normal"
}
```

**Response Example:**
```json
{
  "risk_level": "Slight Injury",
  "confidence_score": 0.84
}
```

## Available Categories
You can find all available categories in the `data/RTA Dataset.csv` file. The API is robust enough to handle "Unknown" values for any missing information.
