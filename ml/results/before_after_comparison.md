# Phase 15: Before vs After Comparison

| Metric | BEFORE (Phase 14) | AFTER (Phase 15) |
|---|---|---|
| **Unseen Question** | | |
| Macro F1 | 0.9666 | 0.9705 |
| Accuracy | 0.9655 | 0.9691 |
| MAE | 1.61 | 1.59 |
| RMSE | 2.22 | 2.21 |
| R² | 0.438 | 0.444 |
| **Qualitative Behavior** | | |
| Length Bias | Extreme (Long incorrect answers were predicted as "Excellent") | Reduced. Length is log-normalized. However, due to synthetic data limits, long meaningless strings still sometimes fool the classifier, though less severely than before. |
| Synonym Handling | Failed (exact keyword match only) | Improved. Sentence embeddings recognize conceptually identical descriptions. |
| Calibration | Unverified | Verified (Multi-class Brier Score: 0.1382). Calibration curve plotted for 'Excellent'. |
| Robustness | High failure rate on varied structures | Still struggling with synthetic dataset biases, but feedback mechanisms now accurately flag short/missing content via semantic limits. |

## Why Regression Generalization Remains Low
The gap between Seen Question RMSE (0.68) and Unseen Question RMSE (2.21) persists because the synthetic dataset generation heavily relies on rigid templates. When a *new* question is introduced, the distribution of TF-IDF vectors changes significantly, meaning the models struggle to regress perfectly without having seen the base question before. Semantic embeddings improved this slightly (R² increased from 0.438 to 0.444), but true generalization requires a dataset not bound by 20 rigid templates.
