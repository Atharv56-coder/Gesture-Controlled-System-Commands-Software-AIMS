from sklearn.neural_network import MLPClassifier
import pickle
import numpy as np
import os

class ModelTrainer:
    def __init__(self, model_path=os.path.join(os.path.dirname(__file__), "..", "models", "gesture_model.pkl")):
        self.model_path = model_path
        # Simplified MLP for better stability on small datasets
        self.model = MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation='relu',
            solver='adam',
            max_iter=2000, # Increased iterations for better convergence
            random_state=42,
            learning_rate_init=0.001
        )
        self.gestures = [] # List of landmark arrays
        self.labels = []   # List of string labels
        self.X_train_cache = None # Cached numpy array for fast similarity checks
        self.is_trained = False
        self.load_model()

    def add_sample(self, landmarks, label_name):
        self.gestures.append(landmarks)
        self.labels.append(label_name)

    def remove_gesture(self, label_name):
        # Remove all samples associated with this label
        new_gestures = []
        new_labels = []
        for g, l in zip(self.gestures, self.labels):
            if l != label_name:
                new_gestures.append(g)
                new_labels.append(l)
        self.gestures = new_gestures
        self.labels = new_labels
        # Retrain if possible, otherwise mark as untrained
        if self.gestures:
            self.train()
        else:
            self.is_trained = False
            self.save_model()

    def get_gestures(self):
        return sorted(list(set(self.labels)))

    def train(self):
        if not self.gestures:
            self.is_trained = False
            return False
        
        # Data Augmentation: Mirroring
        # For every gesture, create a mirrored version (flip X axis)
        # X is at index 0, 3, 6, ..., 60 in the 63-element landmark array
        X_orig = np.array(self.gestures)
        X_mirrored = X_orig.copy()
        for i in range(0, 63, 3):
            X_mirrored[:, i] *= -1
            
        X = np.vstack([X_orig, X_mirrored])
        y = np.hstack([self.labels, self.labels]) # Duplicate labels for mirrored samples
        
        self.model.fit(X, y)
        self.X_train_cache = X_orig # Cache original gestures as numpy array
        self.is_trained = True
        self.save_model()
        return True

    def save_model(self):
        with open(self.model_path, 'wb') as f:
            pickle.dump({
                'model': self.model if self.is_trained else None, 
                'labels': self.labels, 
                'gestures': self.gestures,
                'is_trained': self.is_trained
            }, f)

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    data = pickle.load(f)
                    self.gestures = data.get('gestures', [])
                    self.labels = data.get('labels', [])
                    self.is_trained = data.get('is_trained', False)
                    if self.is_trained and data.get('model'):
                        self.model = data['model']
                        self.X_train_cache = np.array(self.gestures) if self.gestures else None
                        # FORCE re-training to ensure data augmentation is applied to old models
                        if self.gestures:
                            print("Auto-retraining on load to apply hand-agnostic augmentation...")
                            self.train()
                return True
            except Exception as e:
                print(f"Error loading model: {e}")
                return False
        return False

    def predict(self, landmarks):
        if not self.is_trained or not self.gestures:
            return None
        
        unique_labels = list(set(self.labels))
        if len(unique_labels) < 1:
            return None

        try:
            # 1. Similarity Check (Reality Check)
            # Find the distance to the closest training sample.
            # Use cached X_train if available to avoid conversion overhead
            if self.X_train_cache is not None:
                X_train = self.X_train_cache
            else:
                X_train = np.array(self.gestures)
                self.X_train_cache = X_train
            
            # Mirrored input
            mirrored_landmarks = np.array(landmarks).copy()
            for i in range(0, 63, 3):
                mirrored_landmarks[i] *= -1
            
            dist_orig = np.linalg.norm(X_train - landmarks, axis=1)
            dist_mirrored = np.linalg.norm(X_train - mirrored_landmarks, axis=1)
            
            min_dist = min(np.min(dist_orig), np.min(dist_mirrored))
            is_mirrored_match = np.min(dist_mirrored) < np.min(dist_orig)
            
            # LOOSE threshold for better hand invariance. 1.5 is very generous.
            if min_dist > 1.5:
                return None

            # 2. DNN Prediction
            # Predict for both original and mirrored and take the best confidence
            probs_orig = self.model.predict_proba([landmarks])[0]
            probs_mirrored = self.model.predict_proba([mirrored_landmarks])[0]
            
            # Predict with both original and mirrored inputs
            pred_idx_orig = np.argmax(probs_orig)
            pred_idx_mirrored = np.argmax(probs_mirrored)
            
            # We favor the one with higher confidence
            if np.max(probs_orig) >= np.max(probs_mirrored):
                probs = probs_orig
                final_pred = self.model.classes_[pred_idx_orig]
            else:
                probs = probs_mirrored
                final_pred = self.model.classes_[pred_idx_mirrored]

            max_prob = np.max(probs)
            
            # Enhanced logging
            if max_prob > 0.4:
                match_type = "MIRRORED" if is_mirrored_match else "ORIGINAL"
                print(f"Prediction: {final_pred} | Match: {match_type} | Conf: {max_prob:.2f} | Sim: {min_dist:.2f}")

            # Confidence threshold: 0.5 is the minimum for a binary choice, safe for Multi-class
            if max_prob < 0.5:
                return None
                
            return final_pred
        except Exception as e:
            print(f"Prediction error: {e}")
            return None
