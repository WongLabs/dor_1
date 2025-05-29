import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Replicate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.join(__dirname, 'public', 'audio');
const packsFilePath = path.join(__dirname, 'src', 'data', 'packs.json');
const bpmFilePath = path.join(__dirname, 'src', 'data', 'bpm.json');
const pythonScriptName = 'detect_bpm.py';
const pythonScriptPath = path.join(__dirname, pythonScriptName); // Assuming detect_bpm.py is in the root

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function getBPM(filePath) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath, filePath]);
        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                try {
                    const errOutput = JSON.parse(stderrData);
                    console.error(`Error processing ${path.basename(filePath)} with Python script: ${errOutput.error || stderrData}`);
                    resolve(null); // Resolve with null on error to continue processing other files
                } catch (e) {
                    console.error(`Error processing ${path.basename(filePath)} with Python script (stderr not JSON): ${stderrData}`);
                    resolve(null);
                }
                return;
            }
            try {
                const result = JSON.parse(stdoutData);
                resolve(result);
            } catch (e) {
                console.error(`Error parsing JSON from Python script for ${path.basename(filePath)}: ${e.message}. Data: ${stdoutData}`);
                resolve(null);
            }
        });

        pythonProcess.on('error', (err) => {
            console.error(`Failed to start Python script for ${path.basename(filePath)}: ${err.message}`);
            resolve(null); // Resolve with null to allow other files to be processed
        });
    });
}

async function main() {
    if (!fs.existsSync(pythonScriptPath)) {
        console.error(`Error: Python script ${pythonScriptName} not found at ${pythonScriptPath}. Please ensure it exists and is executable.`);
        process.exit(1);
    }
    
    console.log(isDryRun ? '--- DRY RUN MODE ---' : '--- BPM GENERATION ---');

    let packsData;
    try {
        packsData = JSON.parse(fs.readFileSync(packsFilePath, 'utf-8'));
    } catch (e) {
        console.error(`Error reading or parsing ${packsFilePath}: ${e.message}`);
        process.exit(1);
    }

    let bpmData;
    try {
        const bpmFileContent = fs.readFileSync(bpmFilePath, 'utf-8');
        bpmData = JSON.parse(bpmFileContent);
        if (!bpmData.trackSpecificBPMs) {
            bpmData.trackSpecificBPMs = {};
        }
    } catch (e) {
        console.warn(`Warning: Could not read or parse ${bpmFilePath}. Starting with an empty BPM map. Error: ${e.message}`);
        bpmData = { trackSpecificBPMs: {} };
    }

    const audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
    console.log(`Found ${audioFiles.length} MP3 files in ${audioDir}.`);

    const trackMapByAudioSrc = {};
    if (packsData && packsData.tracks) {
        packsData.tracks.forEach(track => {
            if (track.audioSrc) {
                // Normalize audioSrc to match the filename from readdirSync
                const audioFileName = path.basename(track.audioSrc);
                trackMapByAudioSrc[audioFileName] = track.id;
            }
        });
    }

    let changesMade = 0;

    for (const fileName of audioFiles) {
        const filePath = path.join(audioDir, fileName);
        const trackId = trackMapByAudioSrc[fileName];

        if (!trackId) {
            console.warn(`Skipping ${fileName}: No matching track ID found in ${path.basename(packsFilePath)} for audioSrc '/audio/${fileName}'.`);
            continue;
        }

        console.log(`Processing ${fileName}...`);
        const analysisResult = await getBPM(filePath);

        if (analysisResult && analysisResult.bpm) {
            const existingEntry = bpmData.trackSpecificBPMs[trackId];
            const newEntry = {
                bpm: analysisResult.bpm,
                source: analysisResult.source,
                confidence: analysisResult.confidence
            };

            // Update if new, or different from existing, or if the structure is different
            if (!existingEntry || 
                existingEntry.bpm !== newEntry.bpm || 
                existingEntry.source !== newEntry.source || 
                existingEntry.confidence !== newEntry.confidence) {
                
                if (isDryRun) {
                    console.log(`  [DRY RUN] Would update BPM for track ID ${trackId} (${fileName}):`);
                    console.log(`    Old: ${existingEntry ? JSON.stringify(existingEntry) : 'N/A'}`);
                    console.log(`    New: ${JSON.stringify(newEntry)}`);
                } else {
                    console.log(`  Updating BPM for track ID ${trackId} (${fileName}) to ${newEntry.bpm}.`);
                }
                bpmData.trackSpecificBPMs[trackId] = newEntry;
                changesMade++;
            } else {
                console.log(`  BPM for track ID ${trackId} (${fileName}) is already up-to-date.`);
            }
        } else {
            console.warn(`  Could not retrieve BPM for ${fileName}.`);
        }
    }

    if (changesMade > 0 && !isDryRun) {
        try {
            fs.writeFileSync(bpmFilePath, JSON.stringify(bpmData, null, 2));
            console.log(`
Successfully updated ${bpmFilePath} with ${changesMade} changes.`);
        } catch (e) {
            console.error(`Error writing ${bpmFilePath}: ${e.message}`);
        }
    } else if (changesMade === 0 && !isDryRun) {
        console.log(`
No BPM updates were necessary for ${bpmFilePath}.`);
    } else if (isDryRun) {
        console.log(`
[DRY RUN] Finished. ${changesMade} potential changes identified.`);
    }

}

main().catch(console.error); 