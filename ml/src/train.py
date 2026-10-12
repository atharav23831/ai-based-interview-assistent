import pandas as pd
import numpy as np
import joblib
import os
import random
import matplotlib.pyplot as plt
from sklearn.model_selection import GroupShuffleSplit
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelBinarizer
from sklearn.calibration import calibration_curve
try:
    from xgboost import XGBClassifier, XGBRegressor
    has_xgb = True
except ImportError:
    has_xgb = False
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, brier_score_loss

from preprocessing import preprocess_dataframe
from features import FeatureExtractor

def multi_class_brier_score(y_true, y_prob, classes):
    lb = LabelBinarizer()
    lb.fit(classes)
    y_true_bin = lb.transform(y_true)
    return np.mean(np.sum((y_prob - y_true_bin)**2, axis=1))

def main():
    print("Loading data...")
    df = pd.read_csv('../data/interview_dataset.csv')
    df = preprocess_dataframe(df)
    
    unique_q = df['q_id'].unique()
    random.seed(42)
    np.random.seed(42)
    
    np.random.shuffle(unique_q)
    n_total = len(unique_q)
    n_train = int(n_total * 0.6)
    n_val = int(n_total * 0.2)
    
    train_q = unique_q[:n_train]
    val_q = unique_q[n_train:n_train+n_val]
    test_q = unique_q[n_train+n_val:]
    
    train_df = df[df['q_id'].isin(train_q)].copy()
    val_df = df[df['q_id'].isin(val_q)].copy()
    test_df = df[df['q_id'].isin(test_q)].copy()
    
    train_answers, unseen_ans_test = pd.DataFrame(), pd.DataFrame()
    for q in train_q:
        q_df = train_df[train_df['q_id'] == q]
        mask = np.random.rand(len(q_df)) < 0.9
        train_answers = pd.concat([train_answers, q_df[mask]])
        unseen_ans_test = pd.concat([unseen_ans_test, q_df[~mask]])
        
    train_df = train_answers
    
    os.makedirs('../data/splits', exist_ok=True)
    val_df.to_csv('../data/splits/val_df.csv', index=False)
    test_df.to_csv('../data/splits/test_df.csv', index=False)
    unseen_ans_test.to_csv('../data/splits/unseen_ans_test_df.csv', index=False)
    
    print("\nExtracting features...")
    extractor = FeatureExtractor(use_sbert=True)
    extractor.fit(train_df)
    
    X_train = extractor.transform(train_df)
    X_val = extractor.transform(val_df)
    
    os.makedirs('../models', exist_ok=True)
    joblib.dump(extractor, '../models/feature_extractor.pkl')
    
    y_class_train = train_df['quality']
    y_class_val = val_df['quality']
    
    y_score_train = train_df['score']
    y_score_val = val_df['score']
    
    class_models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42)
    }
    
    reg_models = {
        'Linear Regression': LinearRegression(),
        'Random Forest Reg': RandomForestRegressor(n_estimators=100, random_state=42)
    }
    
    if has_xgb:
        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        y_class_train_xgb = le.fit_transform(y_class_train)
        y_class_val_xgb = le.transform(y_class_val)
        joblib.dump(le, '../models/label_encoder.pkl')
        
        class_models['XGBoost'] = XGBClassifier(eval_metric='mlogloss', random_state=42)
        reg_models['XGBoost Reg'] = XGBRegressor(random_state=42)
    
    best_f1 = 0
    best_class_model_name = ""
    best_class_model = None
    best_probs_val = None
    
    print("\n--- Training Classifiers ---")
    for name, model in class_models.items():
        if name == 'XGBoost':
            model.fit(X_train, y_class_train_xgb)
            y_pred = le.inverse_transform(model.predict(X_val))
            probs = model.predict_proba(X_val)
        else:
            model.fit(X_train, y_class_train)
            y_pred = model.predict(X_val)
            probs = model.predict_proba(X_val)
            
        f1 = f1_score(y_class_val, y_pred, average='weighted')
        print(f"{name} - Val F1-score: {f1:.4f}")
        
        if f1 > best_f1:
            best_f1 = f1
            best_class_model_name = name
            best_class_model = model
            best_probs_val = probs

    print(f"\nBest Classifier: {best_class_model_name}")
    # Fit Calibrated Classifier
    from sklearn.calibration import CalibratedClassifierCV
    calibrated = CalibratedClassifierCV(best_class_model, method='sigmoid', cv=5)
    
    if best_class_model_name == 'XGBoost':
        calibrated.fit(X_train, y_class_train_xgb)
        calib_probs = calibrated.predict_proba(X_val)
    else:
        calibrated.fit(X_train, y_class_train)
        calib_probs = calibrated.predict_proba(X_val)
        
    print("Evaluating Calibration...")
    brier_native = multi_class_brier_score(y_class_val, best_probs_val, best_class_model.classes_ if best_class_model_name != 'XGBoost' else le.classes_)
    brier_calib = multi_class_brier_score(y_class_val, calib_probs, best_class_model.classes_ if best_class_model_name != 'XGBoost' else le.classes_)
    
    with open('../results/calibration_comparison.md', 'w') as f:
        f.write("# Calibration Comparison\n\n")
        f.write(f"Model: {best_class_model_name}\n\n")
        f.write(f"**Native Probabilities Brier Score:** {brier_native:.4f}\n")
        f.write(f"**CalibratedClassifierCV Brier Score:** {brier_calib:.4f}\n\n")
        if brier_calib < brier_native:
            f.write("Conclusion: Calibration improved the probability estimates.\n")
        else:
            f.write("Conclusion: Native probabilities were already well-calibrated; CalibratedClassifierCV did not improve the Brier score.\n")
            
    # Save the calibrated model if it's better, else native
    if brier_calib < brier_native:
        joblib.dump(calibrated, '../models/best_model_classifier.pkl')
    else:
        joblib.dump(best_class_model, '../models/best_model_classifier.pkl')
        
    with open('../models/best_model_name.txt', 'w') as f:
        f.write(best_class_model_name)
        
    # Calibration curve for the 'Excellent' class
    if best_class_model_name == 'XGBoost':
        exc_idx = list(le.classes_).index('Excellent')
    else:
        exc_idx = list(best_class_model.classes_).index('Excellent')
        
    y_val_bin = (y_class_val == 'Excellent').astype(int)
    prob_exc_nat = best_probs_val[:, exc_idx]
    prob_exc_cal = calib_probs[:, exc_idx]
    
    prob_true_nat, prob_pred_nat = calibration_curve(y_val_bin, prob_exc_nat, n_bins=10)
    prob_true_cal, prob_pred_cal = calibration_curve(y_val_bin, prob_exc_cal, n_bins=10)
    
    plt.figure()
    plt.plot(prob_pred_nat, prob_true_nat, marker='o', label='Native')
    plt.plot(prob_pred_cal, prob_true_cal, marker='s', label='Calibrated')
    plt.plot([0, 1], [0, 1], linestyle='--', color='gray', label='Perfectly Calibrated')
    plt.xlabel('Mean Predicted Probability')
    plt.ylabel('Fraction of Positives')
    plt.title('Calibration Curve (Class: Excellent)')
    plt.legend()
    plt.tight_layout()
    plt.savefig('../results/calibration_curve.png')
    plt.close()
    
    print("\n--- Training Regressors ---")
    best_rmse = float('inf')
    best_reg_model = None
    best_reg_name = ""
    for name, model in reg_models.items():
        model.fit(X_train, y_score_train)
        y_pred_reg = model.predict(X_val)
        rmse = np.sqrt(mean_squared_error(y_score_val, y_pred_reg))
        print(f"{name} - Val RMSE: {rmse:.4f}")
        
        if rmse < best_rmse:
            best_rmse = rmse
            best_reg_model = model
            best_reg_name = name
            
    joblib.dump(best_reg_model, '../models/best_model_regressor.pkl')
    print(f"Best Regressor: {best_reg_name}")
    print("Saved best models to models/")

if __name__ == '__main__':
    main()
