import pandas as pd
import numpy as np
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from features import FeatureExtractor

def evaluate_classifier(y_true, y_pred, model_name, dataset_name):
    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average='macro')
    weighted_f1 = f1_score(y_true, y_pred, average='weighted')
    
    report = f"--- Classification Metrics ({dataset_name}) ---\n"
    report += f"Model: {model_name}\n"
    report += f"Accuracy: {acc:.4f}\n"
    report += f"Macro F1: {macro_f1:.4f}\n"
    report += f"Weighted F1: {weighted_f1:.4f}\n\n"
    
    report += "Classification Report:\n"
    report += classification_report(y_true, y_pred) + "\n"
    
    return report

def evaluate_regressor(y_true, y_pred, dataset_name):
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_true, y_pred)
    
    report = f"--- Regression Metrics ({dataset_name}) ---\n"
    report += f"MAE: {mae:.4f}\n"
    report += f"MSE: {mse:.4f}\n"
    report += f"RMSE: {rmse:.4f}\n"
    report += f"R2 Score: {r2:.4f}\n\n"
    
    return report

def plot_confusion_matrix(y_true, y_pred, labels, filename):
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    plt.figure(figsize=(8,6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.title('Confusion Matrix')
    plt.tight_layout()
    plt.savefig(filename)
    plt.close()

def run_evaluation(df, extractor, class_model, reg_model, model_name, dataset_name, out_dir):
    X = extractor.transform(df)
    
    y_class_true = df['quality']
    y_score_true = df['score']
    
    if model_name == 'XGBoost':
        le = joblib.load('../models/label_encoder.pkl')
        y_pred_encoded = class_model.predict(X)
        y_pred_class = le.inverse_transform(y_pred_encoded)
    else:
        y_pred_class = class_model.predict(X)
        
    y_pred_score = reg_model.predict(X)
    
    # Classification Eval
    class_report = evaluate_classifier(y_class_true, y_pred_class, model_name, dataset_name)
    with open(f"{out_dir}/classification_report_{dataset_name}.txt", "w") as f:
        f.write(class_report)
        
    # Plot CM
    labels = ["Very Poor", "Poor", "Average", "Good", "Excellent"]
    plot_confusion_matrix(y_class_true, y_pred_class, labels, f"{out_dir}/confusion_matrix_{dataset_name}.png")
    
    # Regression Eval
    reg_report = evaluate_regressor(y_score_true, y_pred_score, dataset_name)
    with open(f"{out_dir}/regression_metrics_{dataset_name}.txt", "w") as f:
        f.write(reg_report)
        
    print(class_report)
    print(reg_report)

def main():
    print("Loading models...")
    extractor = joblib.load('../models/feature_extractor.pkl')
    class_model = joblib.load('../models/best_model_classifier.pkl')
    reg_model = joblib.load('../models/best_model_regressor.pkl')
    
    with open('../models/best_model_name.txt', 'r') as f:
        model_name = f.read().strip()
        
    out_dir = '../results'
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Evaluate on completely unseen questions
    print("Evaluating on Unseen Questions Test Set...")
    test_df = pd.read_csv('../data/splits/test_df.csv')
    test_df.fillna('', inplace=True)
    run_evaluation(test_df, extractor, class_model, reg_model, model_name, "unseen_questions", out_dir)
    
    # 2. Evaluate on unseen answers from seen questions
    print("Evaluating on Unseen Answers Test Set (Seen Questions)...")
    unseen_ans_df = pd.read_csv('../data/splits/unseen_ans_test_df.csv')
    unseen_ans_df.fillna('', inplace=True)
    run_evaluation(unseen_ans_df, extractor, class_model, reg_model, model_name, "unseen_answers", out_dir)

if __name__ == '__main__':
    main()
