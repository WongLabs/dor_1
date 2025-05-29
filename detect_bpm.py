import sys
import librosa
import json

def analyze_bpm(file_path):
    try:
        y, sr = librosa.load(file_path)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        return {
            "bpm": round(float(tempo), 2),
            "confidence": 0.9,  # Placeholder confidence from librosa
            "source": "librosa"
        }
    except Exception as e:
        # Print error to stderr for the Node.js script to catch
        print(json.dumps({"error": str(e), "file": file_path}), file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path_arg = sys.argv[1]
        result = analyze_bpm(file_path_arg)
        if result:
            print(json.dumps(result))
    else:
        print(json.dumps({"error": "No file path provided"}), file=sys.stderr) 