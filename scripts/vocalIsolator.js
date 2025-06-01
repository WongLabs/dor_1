const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const uvr = require('ultimatevocalremover_api');

async function processAudioFile(inputPath, outputDir) {
  try {
    const fileName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${fileName}_vocals.wav`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Initialize the model
    const model = new uvr.models.Demucs({
      name: "hdemucs_mmi",
      other_metadata: { segment: 2, split: true },
      device: "cuda", // Use "cpu" if no GPU available
      logger: console
    });

    // Process the audio file
    const result = await model(inputPath);
    const vocals = result.separated.vocals;

    // Save the vocals
    fs.writeFileSync(outputPath, vocals);
    
    return {
      success: true,
      vocalPath: outputPath
    };
  } catch (error) {
    console.error('Error processing file:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Process all audio files in a directory
async function processDirectory(inputDir, outputDir) {
  const files = fs.readdirSync(inputDir);
  const audioFiles = files.filter(file => 
    ['.mp3', '.wav', '.m4a', '.aac'].includes(path.extname(file).toLowerCase())
  );

  const results = [];
  for (const file of audioFiles) {
    const inputPath = path.join(inputDir, file);
    const result = await processAudioFile(inputPath, outputDir);
    results.push({
      fileName: file,
      ...result
    });
  }

  return results;
}

module.exports = {
  processAudioFile,
  processDirectory
}; 