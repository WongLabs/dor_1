import os
import sys
import torch
import soundfile as sf
from demucs.apply import apply_model
from demucs.pretrained import DEFAULT_MODEL, get_model
from demucs.audio import AudioFile
import numpy as np
import warnings
warnings.filterwarnings("ignore")

def process_audio(input_path, output_dir, debug=True):
    try:
        if debug:
            print("\nProcessing file:", input_path)
            print("Output directory:", output_dir)
        
        # Load model
        model = get_model(DEFAULT_MODEL)
        if debug:
            print("Model loaded:", DEFAULT_MODEL)
            print("Model sources:", model.sources)
        
        model.cpu()  # Use CPU, change to cuda() if you have a GPU
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Load audio file
        if debug:
            print("Loading audio file...")
        audio_file = AudioFile(input_path)
        wav = audio_file.read()
        sample_rate = audio_file.samplerate()  # Call the method to get the sample rate
        if debug:
            print("Audio loaded. Shape:", wav.shape)
            print("Sample rate:", sample_rate)
        
        # Apply the model to get stems
        if debug:
            print("Separating audio stems...")
        sources = apply_model(model, wav, shifts=1, split=True, overlap=0.25, progress=True)
        sources = sources.cpu().numpy()
        if debug:
            print("Separation complete. Output shape:", sources.shape)
            print("Source array min/max:", np.min(sources), np.max(sources))
        
        # Find vocals index
        vocals_idx = model.sources.index('vocals')
        if debug:
            print(f"Vocals index: {vocals_idx}")
        
        # Extract vocals - sources shape is (batch, sources, channels, samples)
        vocals = sources[0, vocals_idx]  # Take first batch, vocals source
        if debug:
            print("Vocals shape:", vocals.shape)
            print("Vocals min/max:", np.min(vocals), np.max(vocals))
        
        # Normalize audio to prevent clipping
        max_val = np.max(np.abs(vocals))
        if max_val > 1.0:
            vocals = vocals / max_val * 0.95  # Leave some headroom
        
        # Generate output path
        filename = os.path.splitext(os.path.basename(input_path))[0]
        output_path = os.path.join(output_dir, f"{filename}_vocals.wav")
        
        # Save vocals using soundfile
        if debug:
            print(f"Saving vocals to: {output_path}")
            print(f"Using sample rate: {sample_rate}")
        
        # Convert vocals to float32 and ensure proper shape
        vocals = vocals.astype(np.float32)
        # Transpose if needed - soundfile expects (samples, channels)
        if vocals.shape[0] == 2:  # if shape is (channels, samples)
            vocals = vocals.T
        
        sf.write(
            output_path, 
            vocals,
            sample_rate,
            format='WAV',
            subtype='FLOAT'
        )
        
        print(f"\nSuccessfully processed: {filename}")
        print(f"Vocals saved to: {output_path}")
        
        return {
            "success": True,
            "output_path": output_path
        }
        
    except Exception as e:
        print(f"\nError processing {input_path}:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        return {
            "success": False,
            "error": str(e)
        }

def process_directory(input_dir, output_dir, single_file=True):
    files = [f for f in os.listdir(input_dir) 
             if f.lower().endswith(('.mp3', '.wav', '.m4a', '.aac'))]
    
    if not files:
        print(f"No audio files found in {input_dir}")
        return []
    
    print(f"\nFound {len(files)} audio files")
    
    if single_file:
        # Process only the first file
        file = files[0]
        print(f"\nProcessing single file: {file}")
        input_path = os.path.join(input_dir, file)
        result = process_audio(input_path, output_dir, debug=True)
        return [{"file": file, **result}]
    else:
        # Process all files
        results = []
        for i, file in enumerate(files, 1):
            print(f"\nProcessing file {i}/{len(files)}: {file}")
            input_path = os.path.join(input_dir, file)
            result = process_audio(input_path, output_dir, debug=False)
            results.append({
                "file": file,
                **result
            })
        return results

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python vocal_isolator.py <input_dir> <output_dir>")
        sys.exit(1)
        
    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    
    print("Starting vocal isolation process...")
    print(f"Input directory: {input_dir}")
    print(f"Output directory: {output_dir}")
    
    try:
        # Start with processing just one file
        results = process_directory(input_dir, output_dir, single_file=True)
        
        print("\nProcessing Summary:")
        successful = sum(1 for r in results if r['success'])
        print(f"Successfully processed: {successful}/{len(results)} files")
        
        if successful < len(results):
            print("\nFailed files:")
            for result in results:
                if not result['success']:
                    print(f"✗ {result['file']} - {result['error']}")
                    
        # Ask user if they want to continue with remaining files
        if len(results) == 1 and successful == 1:
            response = input("\nFirst file processed successfully. Process remaining files? (y/n): ")
            if response.lower() == 'y':
                print("\nProcessing remaining files...")
                results = process_directory(input_dir, output_dir, single_file=False)
                print("\nFinal Processing Summary:")
                successful = sum(1 for r in results if r['success'])
                print(f"Successfully processed: {successful}/{len(results)} files")
    except Exception as e:
        print(f"Error during processing: {str(e)}")
        sys.exit(1) 