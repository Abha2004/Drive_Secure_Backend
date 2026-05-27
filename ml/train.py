import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
import pickle
import os

def train_pro_model():
    data_file = os.path.join('data', 'RTA Dataset.csv')
    
    if not os.path.exists(data_file):
        print(f"Error: {data_file} not found!")
        return

    print("Loading Dataset for Location-based Prediction...")
    df = pd.read_csv(data_file)
    
    # Updated features: Removed Junction, focusing on Location (Area)
    features = [
        'Age_band_of_driver', 
        'Driving_experience', 
        'Type_of_vehicle', 
        'Area_accident_occured', # This will be our "Location"
        'Road_surface_conditions', 
        'Light_conditions', 
        'Weather_conditions'
    ]
    target = 'Accident_severity'

    df = df.dropna(subset=[target])
    for col in features:
        df[col] = df[col].fillna('Unknown')

    encoders = {}
    for col in features:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    
    le_target = LabelEncoder()
    df[target] = le_target.fit_transform(df[target])
    encoders['target'] = le_target

    X = df[features]
    y = df[target]

    print(f"Training Random Forest Model with {len(df)} records...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X, y)
    rf_acc = rf_model.score(X, y)
    print(f"Random Forest Training Accuracy: {rf_acc * 100:.2f}%")

    print(f"Training Logistic Regression Model with {len(df)} records...")
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X, y)
    lr_acc = lr_model.score(X, y)
    print(f"Logistic Regression Training Accuracy: {lr_acc * 100:.2f}%")

    model_data = {
        'rf_model': rf_model,
        'lr_model': lr_model,
        'encoders': encoders,
        'features': features
    }
    
    with open('model.pkl', 'wb') as f:
        pickle.dump(model_data, f)
    
    print("Both models saved to model.pkl successfully!")

if __name__ == "__main__":
    train_pro_model()
