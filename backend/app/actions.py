import pyautogui
import time
import subprocess
import json
import os

try:
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
    from comtypes import CLSCTX_ALL
    HAS_PYCAW = True
except ImportError:
    HAS_PYCAW = False

class ActionConfigManager:
    def __init__(self, config_path=os.path.join(os.path.dirname(__file__), "actions_config.json")):
        self.config_path = config_path
        self.config = {}
        self.load_config()

    def load_config(self):
        if os.path.exists(self.config_path):
            with open(self.config_path, 'r') as f:
                self.config = json.load(f)
        else:
            # Default predefined mappings
            self.config = {
                "Volume Up": {"type": "predefined", "command": "volume_up"},
                "Volume Down": {"type": "predefined", "command": "volume_down"},
                "Mute": {"type": "predefined", "command": "mute"},
                "Unmute": {"type": "predefined", "command": "unmute"},
                "Next Track": {"type": "predefined", "command": "next_track"},
                "Play": {"type": "predefined", "command": "play"},
                "Pause": {"type": "predefined", "command": "pause"},
                "Previous Track": {"type": "predefined", "command": "previous_track"},
                "Screenshot": {"type": "predefined", "command": "screenshot"},
                "Tab Switch": {"type": "predefined", "command": "tab_switch"},
                "Neutral": {"type": "predefined", "command": "none"}
            }
            self.save_config()

    def save_config(self):
        with open(self.config_path, 'w') as f:
            json.dump(self.config, f, indent=4)

    def get_action(self, label):
        return self.config.get(label)

    def set_action(self, label, action_type, command):
        self.config[label] = {"type": action_type, "command": command}
        self.save_config()

    def remove_action(self, label):
        if label in self.config:
            del self.config[label]
            self.save_config()

class ActionExecutor:
    def __init__(self):
        self.last_action_time = 0
        self.last_gesture = None
        self.last_gesture_time = 0 # Time when ANY gesture was last seen
        self.cooldown = 0.2
        self.discrete_cooldown = 0.5 # Minimum time between discrete actions
        self.debounce_time = 0.5    # Time required without the gesture to reset the trigger
        self.config_manager = ActionConfigManager()
        self.predefined_map = {
            "volume_up": self.volume_up,
            "volume_down": self.volume_down,
            "mute": self.mute,
            "unmute": self.unmute,
            "next_track": self.next_track,
            "previous_track": self.previous_track,
            "play_pause": self.play_pause,
            "play": self.play,
            "pause": self.pause,
            "screenshot": self.screenshot,
            "tab_switch": self.tab_switch,
            "none": lambda: None # Neutral action does nothing
        }
        
        # List of actions that should repeat while gesture is held
        self.continuous_actions = ["volume_up", "volume_down"]
    def execute(self, action_name):
        current_time = time.time()
        
        # Debounce Logic: 
        # If we haven't seen any gesture for debounce_time, reset the last_gesture state
        # This allows the next detection to trigger a 'One-Shot' action again.
        if current_time - self.last_gesture_time > self.debounce_time:
            self.last_gesture = None

        if action_name is None:
            return False

        action_info = self.config_manager.get_action(action_name)
        if not action_info:
            return False

        # Update the time we last saw a valid gesture
        self.last_gesture_time = current_time

        cmd = action_info['command']
        is_continuous = cmd in self.continuous_actions
        
        # Cooldown check
        needed_cooldown = self.cooldown if is_continuous else self.discrete_cooldown
        if current_time - self.last_action_time < needed_cooldown:
            return False
            
        # One-shot check for discrete actions
        if not is_continuous and action_name == self.last_gesture:
            return False

        print(f"Executing: {action_name} ({action_info['type']}) | Cmd: {cmd}")
        try:
            if action_info['type'] == 'predefined':
                if cmd in self.predefined_map:
                    self.predefined_map[cmd]()
            elif action_info['type'] == 'custom':
                subprocess.Popen(action_info['command'], shell=True)
            
            self.last_action_time = current_time
            self.last_gesture = action_name 
            return True
        except Exception as e:
            print(f"Error executing action: {e}")
            return False

    def volume_up(self):
        pyautogui.press("volumeup")

    def volume_down(self):
        pyautogui.press("volumedown")

    def _set_mute(self, mute_state):
        if HAS_PYCAW:
            try:
                import comtypes
                comtypes.CoInitialize()
                devices = AudioUtilities.GetSpeakers()
                if devices:
                    volume = devices.EndpointVolume
                    current_mute = volume.GetMute()
                    
                    if current_mute == mute_state:
                        return True
                        
                    volume.SetMute(mute_state, None)
                    return True
                else:
                    return False
            except Exception:
                return False
            finally:
                try:
                    comtypes.CoUninitialize()
                except:
                    pass
        
        # Fallback to toggle
        pyautogui.press("volumemute")
        return False

    def mute(self):
        print("Forcing Mute...")
        self._set_mute(True)

    def unmute(self):
        print("Forcing Unmute...")
        self._set_mute(False)

    def next_track(self):
        pyautogui.press("nexttrack")

    def previous_track(self):
        pyautogui.press("prevtrack")

    def play_pause(self):
        # 'playpause' is the most robust key for Windows/Browser media control
        pyautogui.press("playpause")
        
    def play(self):
        # Some systems need 'play' specifically
        try:
            pyautogui.press("play")
        except:
            pyautogui.press("playpause")

    def pause(self):
        # Some systems need 'pause' specifically
        try:
            pyautogui.press("pause")
        except:
            pyautogui.press("playpause")
        
    def screenshot(self):
        try:
            # Use absolute path relative to the backend directory
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            folder = os.path.join(backend_dir, "screenshots")
            
            if not os.path.exists(folder):
                os.makedirs(folder)
                print(f"Created folder: {folder}")
            
            filename = f"screenshot_{int(time.time())}.png"
            path = os.path.join(folder, filename)
            
            pyautogui.screenshot(path)
            print(f"Screenshot successfully saved to: {path}")
        except Exception as e:
            print(f"FATAL ERROR in screenshot action: {e}")
        
    def tab_switch(self):
        pyautogui.hotkey('alt', 'tab')
