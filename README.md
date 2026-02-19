# AIMS: Artificial Intelligence Gesture Controlled System 🖐️🤖

**AIMS (Gesture-Controlled System Commands Software)** is a state-of-the-art desktop automation platform that leverages Artificial Neural Networks (ANN) to translate hand gestures into powerful system actions. Built for speed, precision, and ease of use, AIMS allows you to control your entire computer without touching a mouse or keyboard.

---

## ✨ Key Features

- **🧠 ANN-Powered Recognition**: Uses a Multi-Layer Perceptron (MLP) Artificial Neural Network for robust, high-accuracy gesture classification.
- **🖐️ Hand-Agnostic (Mirror Invariant)**: Record a gesture with your left hand, and it works instantly with your right! (Powered by automated data augmentation).
- **⚡ Ultra-Low Latency**: Optimized video pipeline using background threading, AI-throttling, and hardware buffer tuning for near-zero lag.
- **📸 Custom Actions**:
  - **Multimedia**: Play/Pause, Next/Prev Track, Volume Control.
  - **System**: State-aware Mute/Unmute (Windows), Screenshot capture.
  - **Productivity**: Tab switching and custom shell command execution.
- **🎨 Premium UI**: A sleek, dark-mode dashboard built with React and Tailwind CSS featuring real-time activity logs and live video feedback.
- **⚙️ Dynamic Training**: One-click retraining system—record a new gesture and the model updates in milliseconds.

---

## 🚀 Tech Stack

### Backend (The Brain)
- **FastAPI**: High-performance Python web framework for asynchronous communication.
- **MediaPipe**: Google's industry-leading hand tracking for 21-point landmark detection.
- **Scikit-Learn**: Powering the MLP Neural Network for gesture prediction.
- **OpenCV**: Advanced video capture and real-time frame processing.
- **PyAutoGUI**: Cross-platform system automation and screenshot capturing.

### Frontend (The Control Center)
- **React 18**: Component-based UI with hooks for state management.
- **TypeScript**: Ensuring type-safety and robust data flow between services.
- **Tailwind CSS**: Modern utility-first CSS for a premium, responsive design.
- **WebSockets**: Real-time duplex communication for low-latency status updates.

---

## 🛠️ Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- Webcam

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Atharv56-coder/Gesture-Controlled-System-Commands-Software-AIMS.git
   cd Gesture-Controlled-System-Commands-Software-AIMS
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start Backend**
   ```bash
   # From 'backend' directory
   python -m app.main
   ```

2. **Start Frontend**
   ```bash
   # From 'frontend' directory
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`.

---

## 🏗️ Project Structure

```text
AIMS/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI server & Threaded Camera loop
│   │   ├── gesture_engine.py # MediaPipe landmark processing
│   │   ├── trainer.py        # ANN Model & Data Augmentation logic
│   │   └── actions.py        # System command execution logic
│   ├── models/               # Saved pickle models (.pkl)
│   ├── screenshots/          # Automatically saved screenshots
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard, Gestures, Training pages
│   │   ├── components/       # Layouts and Sidebar
│   │   └── App.tsx           # Main routing
│   └── tailwind.config.ts
└── README.md
```

---

## 🔧 Training Your First Gesture

1. Navigate to the **Gestures** page in the dashboard.
2. Click **Record New Gesture**.
3. Perform your desired hand shape for 50 frames.
4. Name the gesture (e.g., "Mute") and link it to a **Predefined** or **Custom** action.
5. The system automatically trains the ANN model. 
6. Switch to the **Dashboard** and test it out!

---

Developed by [Atharv56-coder](https://github.com/Atharv56-coder)
