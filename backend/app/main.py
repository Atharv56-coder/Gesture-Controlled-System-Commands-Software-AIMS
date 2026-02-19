from fastapi import FastAPI, WebSocket, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import cv2
import asyncio
from typing import List, Optional
from .gesture_engine import GestureEngine
from .trainer import ModelTrainer
from .actions import ActionExecutor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import threading

# --- Global State & Initialization ---
class ThreadedCamera:
    def __init__(self, src=0):
        self.cap = cv2.VideoCapture(src)
        # Hardware Optimization: Set buffer size to 1 to ensure we always get the latest frame
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        # Capture at native low resolution to save USB bandwidth and CPU
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        self.grabbed, self.frame = self.cap.read()
        self.read_lock = threading.Lock()
        self.running = True
        self.thread = threading.Thread(target=self.update, args=())
        self.thread.daemon = True
        self.thread.start()

    def update(self):
        while self.running:
            grabbed, frame = self.cap.read()
            with self.read_lock:
                self.grabbed = grabbed
                self.frame = frame

    def read(self):
        with self.read_lock:
            return self.grabbed, self.frame.copy() if self.frame is not None else None

    def stop(self):
        self.running = False
        self.cap.release()

gesture_engine = GestureEngine()
model_trainer = ModelTrainer()
action_executor = ActionExecutor()
camera = ThreadedCamera(0)

class SystemState:
    current_prediction: str = "Initializing..."
    is_recording: bool = False
    recording_label: str = ""
    recording_frames_left: int = 0
    recording_total_frames: int = 0

state = SystemState()
connected_websockets: List[WebSocket] = []

# --- Pydantic Models ---
class RecordRequest(BaseModel):
    label: str
    num_frames: int = 50

class ActionUpdateRequest(BaseModel):
    label: str
    action_type: str # 'predefined' or 'custom'
    command: str

# --- Video Processing Loop ---
async def generate_frames():
    frame_count = 0
    last_results = None
    last_hand_landmarks = None
    
    while True:
        success, frame = camera.read()
        if not success or frame is None:
            await asyncio.sleep(0.01)
            continue
        
        frame_count += 1
        # AI Throttle: Process landmarks every 2nd frame to keep video at 30fps
        should_process = frame_count % 2 == 0
        
        if should_process:
            annotated_frame, results, hand_landmarks_list = gesture_engine.process_frame(frame)
            last_results = results
            last_hand_landmarks = hand_landmarks_list[0] if hand_landmarks_list else None
        else:
            # For non-AI frames, just mirror (if it's not done in engine) or use the raw frame
            # The engine already annotates, so on skipped frames we might not see skeletons
            # but the video will be twice as fast.
            annotated_frame = frame
            
        landmarks = last_hand_landmarks

        # Logic: Recording or Prediction
        status_text = "System: Active"
        
        if landmarks:
            # 1. Recording Mode
            if state.is_recording and state.recording_frames_left > 0:
                # We record every frame if a hand is present, regardless of processing throttle
                model_trainer.add_sample(landmarks, state.recording_label)
                state.recording_frames_left -= 1
                status_text = f"Recording: {state.recording_label} ({state.recording_frames_left})"
                
                if state.recording_frames_left == 0:
                    state.is_recording = False
                    model_trainer.train() # Auto-train after recording
                    status_text = "Training Complete"
            
            # 2. Prediction Mode (only if not recording and model is trained)
            elif model_trainer.is_trained:
                pred = model_trainer.predict(landmarks)
                if pred:
                    state.current_prediction = pred
                    status_text = f"Detected: {pred}"
                    
                    # Execute Action
                    executed = action_executor.execute(pred)
                    if executed:
                        status_text = f"Action: {pred}"
                else:
                    state.current_prediction = "None"
                    status_text = "Unknown Gesture"
                    action_executor.execute(None) # Heartbeat for debouncer
            else:
                status_text = "Model Untrained"
        else:
            state.current_prediction = "None"
            status_text = "No Hand"
            action_executor.execute(None) # Heartbeat for debouncer

        # Encode (resize and lower quality for faster streaming)
        display_frame = cv2.resize(annotated_frame, (480, 360))
        cv2.putText(display_frame, status_text, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        ret, buffer = cv2.imencode('.jpg', display_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        await asyncio.sleep(0.001) # Ultra-short sleep to yield control

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"status": "GestureFlow Backend Running"}

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/gestures")
def get_gestures():
    return {"gestures": model_trainer.get_gestures()}

@app.get("/actions")
def get_actions():
    return action_executor.config_manager.config

@app.post("/actions")
def update_action(req: ActionUpdateRequest):
    action_executor.config_manager.set_action(req.label, req.action_type, req.command)
    return {"status": "success"}

@app.post("/gestures/record")
def start_recording(req: RecordRequest):
    if state.is_recording:
        raise HTTPException(status_code=400, detail="Already recording")
    
    state.recording_label = req.label
    state.recording_frames_left = req.num_frames
    state.recording_total_frames = req.num_frames
    state.is_recording = True
    return {"status": "started", "label": req.label}

@app.delete("/gestures/{label:path}")
def delete_gesture(label: str):
    model_trainer.remove_gesture(label)
    action_executor.config_manager.remove_action(label)
    return {"status": "deleted", "gestures": model_trainer.get_gestures()}

@app.post("/train")
def train_model():
    success = model_trainer.train()
    if success:
        return {"status": "success", "message": "Model trained successfully"}
    else:
        raise HTTPException(status_code=400, detail="Training failed (no data?)")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)

    try:
        while True:
            # Push state updates every 100ms
            await websocket.send_json({
                "prediction": state.current_prediction,
                "is_recording": state.is_recording,
                "recording_progress": 0 if state.recording_total_frames == 0 else 1 - (state.recording_frames_left / state.recording_total_frames)
            })
            await asyncio.sleep(0.1)
    except Exception:
        connected_websockets.remove(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
