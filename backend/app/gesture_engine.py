import mediapipe as mp
import cv2
import numpy as np

class GestureEngine:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=0,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_draw = mp.solutions.drawing_utils

    def process_frame(self, frame):
        h, w, _ = frame.shape
        # Resize for faster processing
        small_frame = cv2.resize(frame, (320, 240))
        img_rgb = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(img_rgb)
        
        all_landmarks_normalized = []
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Get the wrist landmark as reference (usually index 0)
                wrist = hand_landmarks.landmark[0]
                
                # First pass: Get pixel-consistent relative coordinates
                temp_coords = []
                max_dist = 0
                for lm in hand_landmarks.landmark:
                    dx = (lm.x - wrist.x) * (w / h)
                    dy = (lm.y - wrist.y)
                    dz = (lm.z - wrist.z) * (w / h)
                    
                    temp_coords.append((dx, dy, dz))
                    dist = (dx**2 + dy**2 + dz**2)**0.5
                    if dist > max_dist:
                        max_dist = dist
                
                # Second pass: Scale Invariance
                current_hand_landmarks = []
                if max_dist > 0:
                    for dx, dy, dz in temp_coords:
                        current_hand_landmarks.extend([dx/max_dist, dy/max_dist, dz/max_dist])
                else:
                    for dx, dy, dz in temp_coords:
                        current_hand_landmarks.extend([dx, dy, dz])
                
                all_landmarks_normalized.append(current_hand_landmarks)
                
                # Draw landmarks
                self.mp_draw.draw_landmarks(
                    frame, 
                    hand_landmarks, 
                    self.mp_hands.HAND_CONNECTIONS
                )
                
        return frame, results, all_landmarks_normalized
