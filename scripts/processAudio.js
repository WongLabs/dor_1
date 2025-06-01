const path = require('path');
const { processDirectory } = require('./vocalIsolator');

const inputDir = path.join(__dirname, '../public/audio');
const outputDir = path.join(__dirname, '../public/audio/vocals');

async function main() {
  console.log('Starting vocal isolation process...');
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}`);

  try {
    const results = await processDirectory(inputDir, outputDir);
    
    console.log('\nProcessing Results:');
    results.forEach(result => {
      if (result.success) {
        console.log(`✓ ${result.fileName} -> ${result.vocalPath}`);
      } else {
        console.log(`✗ ${result.fileName} - Error: ${result.error}`);
      }
    });
  } catch (error) {
    console.error('Error during processing:', error);
  }
}

main(); 