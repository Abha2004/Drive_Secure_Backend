from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import numpy as np
import os

app = FastAPI(title="Road Accident Risk API - Location Based")

# Load model and encoders
MODEL_PATH = "model.pkl"
model_data = None

if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        model_data = pickle.load(f)

class PredictionInput(BaseModel):
    age_band_of_driver: str
    driving_experience: str
    type_of_vehicle: str
    location: str # Map this to Area_accident_occured
    road_surface_conditions: str
    light_conditions: str
    weather_conditions: str

@app.get("/")
def read_root():
    return {"message": "Location-based Prediction API Running"}

@app.post("/predict")
def predict(data: PredictionInput):
    if model_data is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    
    try:
        # Support both new format (rf_model, lr_model) and old format (model)
        rf_model = model_data.get('rf_model') or model_data.get('model')
        lr_model = model_data.get('lr_model')
        encoders = model_data['encoders']
        
        # Mapping API field 'location' to Dataset field 'Area_accident_occured'
        input_dict = {
            'Age_band_of_driver': data.age_band_of_driver,
            'Driving_experience': data.driving_experience,
            'Type_of_vehicle': data.type_of_vehicle,
            'Area_accident_occured': data.location,
            'Road_surface_conditions': data.road_surface_conditions,
            'Light_conditions': data.light_conditions,
            'Weather_conditions': data.weather_conditions
        }
        
        encoded_input = []
        for col in model_data['features']:
            le = encoders[col]
            val = input_dict[col]
            
            if val not in le.classes_:
                val = 'Unknown' if 'Unknown' in le.classes_ else le.classes_[0]
            
            encoded_input.append(le.transform([val])[0])
            
        # Random Forest prediction
        rf_prediction = rf_model.predict([encoded_input])
        rf_risk_label = encoders['target'].inverse_transform(rf_prediction)[0]
        rf_confidence = float(max(rf_model.predict_proba([encoded_input])[0]))
        
        # Logistic Regression prediction
        if lr_model is not None:
            lr_prediction = lr_model.predict([encoded_input])
            lr_risk_label = encoders['target'].inverse_transform(lr_prediction)[0]
            lr_confidence = float(max(lr_model.predict_proba([encoded_input])[0]))
        else:
            lr_risk_label = rf_risk_label
            lr_confidence = rf_confidence
            
        return {
            "risk_level": rf_risk_label,
            "confidence_score": rf_confidence,
            "random_forest": {
                "risk_level": rf_risk_label,
                "confidence_score": rf_confidence
            },
            "logistic_regression": {
                "risk_level": lr_risk_label,
                "confidence_score": lr_confidence
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
