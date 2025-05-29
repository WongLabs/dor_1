const fs = require('fs').promises;
const path = require('path');
const musicMetadata = require('music-metadata');

const audioDir = path.join(__dirname, '..', 'public', 'audio');
const packsJsonPath = path.join(__dirname, '..', 'src', 'data', 'packs.json');

const VALID_PACK_GENRES = [
  "Remix Hits", "Techno", "Tech House", "EDM & Electro", "Hard Techno",
  "Melodic House & Techno", "Electro Pop & Dance", "Hard Music",
  "Instrumental", "Grooves"
];

const GENRE_DEFINITIONS = {
  "Remix Hits": {
    description: "Tracks that are explicitly remixes, often indicated in the title.",
    rules: [ { field: 'title', regex: /remix/i } ]
  },
  "Tech House": {
    description: "A blend of house music's groove and techno's percussive elements and intensity.",
    rules: [
      { field: 'any', regex: /tech house/i },
      { field: 'any', regex: /techy\s?(groove|sound)/i }
    ]
  },
  "Melodic House & Techno": {
    description: "Focuses on melodies and harmonies within a house or techno structure.",
    rules: [
      { field: 'any', regex: /melodic house/i },
      { field: 'any', regex: /melodic techno/i },
      { field: 'any', regex: /progressive house/i }
    ]
  },
  "Hard Techno": {
    description: "A faster, more intense, and often distorted subgenre of techno.",
    rules: [ { field: 'any', regex: /hard\s?techno/i } ]
  },
  "Techno": {
    description: "Characterized by a repetitive four-on-the-floor beat, often instrumental and produced for use in a continuous DJ set.",
    rules: [ { field: 'any', regex: /techno/i } ] // Checked after more specific techno variants
  },
  "EDM & Electro": {
    description: "Broad category for mainstream electronic dance music and electro house sounds.",
    rules: [
      { field: 'any', regex: /edm/i },
      { field: 'any', regex: /electro\s(?!pop)/i }, // 'electro ' (avoids 'electronic' or 'electro pop')
      { field: 'any', regex: /big\s?room/i },
      { field: 'any', regex: /future rave/i }
    ]
  },
  "Electro Pop & Dance": {
    description: "Pop music with electronic and dance influences; often song-structured with vocals.",
    rules: [
      { field: 'any', regex: /electro\s?pop/i },
      { field: 'any', regex: /dance\s?pop/i },
      { field: 'any', regex: /synth\s?pop/i },
      { field: 'any', regex: /future house/i }
    ]
  },
  "Hard Music": {
    description: "High-energy, often distorted, hard electronic genres.",
    rules: [
      { field: 'any', regex: /hardstyle/i },
      { field: 'any', regex: /hardcore/i },
      { field: 'any', regex: /rawstyle/i },
      { field: 'any', regex: /gabber/i },
      { field: 'any', regex: /jumpstyle/i }
    ]
  },
  "Instrumental": {
    description: "Tracks primarily without vocals or lyrical content, focusing on the musical arrangement.",
    rules: [
      { field: 'title', regex: /instrumental/i },
      { field: 'title', regex: /instrum(\.|\sversion)?/i },
      { field: 'title', regex: /\((dub|version|radio edit instrumental)\)/i }
    ]
  },
  "Grooves": {
    description: "Music with a strong rhythmic groove, often incorporating elements of funk, soul, or disco.",
    rules: [
      { field: 'any', regex: /funk/i },
      { field: 'any', regex: /soul/i },
      { field: 'any', regex: /groove/i },
      { field: 'any', regex: /disco/i },
      { field: 'any', regex: /nu\s?disco/i }
    ]
  }
};

const GENRE_CHECK_ORDER = [
  "Remix Hits",
  "Tech House",
  "Melodic House & Techno",
  "Hard Techno",
  "Techno", // General after specific
  "EDM & Electro",
  "Electro Pop & Dance",
  "Hard Music",
  "Grooves",
  "Instrumental"
];

const MIX_VERSION_TERMS_TO_CLEAN = /(\(|\s|-)(original|extended|club|radio edit|album version|single version|vocal mix|dirty version|clean version|vip mix|official video|official audio|lyric video|edit)(\)|\s|-)?/gi;
const INSTRUMENTAL_INDICATOR_REGEX = /(\(|\s|-)(instrumental|dub|instrum\.?(\sversion)?|version)(\)|\s|-)?/i;

// Helper function to generate a unique ID
let nextId = 1;
function generateUniqueId(existingIds) {
  while (existingIds.has(String(nextId))) {
    nextId++;
  }
  existingIds.add(String(nextId));
  return String(nextId);
}

function determineGenreFromMetadata(title, artist) {
  const originalTitleLower = title ? title.toLowerCase() : '';
  const artistLower = artist ? artist.toLowerCase() : '';

  // 1. Initial check for strong instrumental indicators in the original title
  if (INSTRUMENTAL_INDICATOR_REGEX.test(originalTitleLower)) {
    // Check if it's specifically an instrumental rule from GENRE_DEFINITIONS for Instrumental
    const instrumentalGenreDef = GENRE_DEFINITIONS["Instrumental"];
    if (instrumentalGenreDef && instrumentalGenreDef.rules) {
      for (const rule of instrumentalGenreDef.rules) {
        if (rule.field === 'title' && rule.regex.test(originalTitleLower)) {
          console.log(`Genre determined: 'Instrumental' for track '${title}' based on explicit instrumental indicator: /${rule.regex.source}/i`);
          return "Instrumental";
        }
      }
    }
    // If not a specific rule but general instrumental indicator matched, and "Instrumental" is a valid genre
    if (VALID_PACK_GENRES.includes("Instrumental")){
        console.log(`Genre determined: 'Instrumental' for track '${title}' based on general instrumental indicator.`);
        return "Instrumental";
    }
  }

  // 2. Clean the title by removing common mix/version terms for general genre keyword matching
  let cleanedTitleLower = originalTitleLower.replace(MIX_VERSION_TERMS_TO_CLEAN, ' ').trim();
  // Replace multiple spaces with a single space that might result from cleaning
  cleanedTitleLower = cleanedTitleLower.replace(/\s\s+/g, ' '); 

  // 3. Perform keyword matching using the cleaned title and artist
  for (const genreName of GENRE_CHECK_ORDER) {
    const genreDef = GENRE_DEFINITIONS[genreName];
    if (!genreDef || !genreDef.rules) continue;

    // Skip "Instrumental" here if we are trying to avoid re-assigning after general check above
    // or if its rules are only for specific title patterns already checked.
    // However, if the rules for "Instrumental" are broad, they might still apply to cleaned titles.
    // For now, we proceed, assuming Instrumental rules could also apply to cleaned titles if not caught by specific indicators.

    for (const rule of genreDef.rules) {
      let textToTest = '';
      let fieldForLog = rule.field;
      if (rule.field === 'title') {
        textToTest = cleanedTitleLower; // Use cleaned title for 'title' field rules
      } else if (rule.field === 'artist') {
        textToTest = artistLower;
      } else { // 'any' field means check combination of cleaned title and artist
        textToTest = `${cleanedTitleLower} ${artistLower}`;
        fieldForLog = 'any (cleaned title + artist)';
      }

      if (rule.regex.test(textToTest)) {
        console.log(`Genre determined: '${genreName}' for track '${title}' (cleaned: '${cleanedTitleLower}') based on rule: /${rule.regex.source}/i on field '${fieldForLog}'`);
        return genreName;
      }
    }
  }

  // 4. Fallback: if no rules match, assign to "Instrumental" and log a warning.
  console.warn(`WARNING: No specific genre rule matched for track '${title}' (Artist: '${artist}', Cleaned Title: '${cleanedTitleLower}'). Defaulting to 'Instrumental'. Consider refining rules.`);
  return "Instrumental";
}

async function getAiPredictions(filePath, title, artist) {
  const determinedGenre = determineGenreFromMetadata(title, artist);
  
  return {
    bpm: Math.floor(Math.random() * (180 - 70 + 1)) + 70, // Placeholder BPM
    key: ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A', '1B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B', '10B', '11B', '12B'][Math.floor(Math.random() * 24)], // Placeholder Key
    genre: determinedGenre, // Fully deterministic genre
    mood: ['Energetic', 'Uplifting', 'Happy', 'Sexy', 'Dark', 'Tense', 'Calm', 'Relaxing', 'Ethereal', 'Epic', 'Romantic', 'Melancholic', 'Sad', 'Chilled'][Math.floor(Math.random() * 14)], // Placeholder Mood
    category: ['Electronic', 'Latino', 'Urban', 'Rock', 'Pop', 'Soul & Funk', 'Tools'][Math.floor(Math.random() * 7)], // Placeholder Category
  };
}

function formatDuration(durationInSeconds) {
  if (!durationInSeconds || typeof durationInSeconds !== 'number') return '0:00';
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function updatePacksJson() {
  let packsData;
  try {
    const rawData = await fs.readFile(packsJsonPath, 'utf-8');
    packsData = JSON.parse(rawData);
    if (!packsData.tracks || !Array.isArray(packsData.tracks)) {
      console.log('Invalid packs.json structure. Initializing with an empty tracks array.');
      packsData = { tracks: [] };
    }
  } catch (error) {
    console.log('packs.json not found or unreadable. Initializing a new one.');
    packsData = { tracks: [] };
  }

  const existingTrackIds = new Set(packsData.tracks.map(t => t.id));
  if (packsData.tracks.length > 0) {
    nextId = Math.max(...packsData.tracks.map(t => parseInt(t.id, 10)).filter(id => !isNaN(id))) + 1 || 1;
  }


  const audioFiles = await fs.readdir(audioDir);
  const processedAudioSrcs = new Set();
  const tracksToManuallyCheck = [];

  console.log(`Found ${audioFiles.length} files in ${audioDir}`);

  for (const file of audioFiles) {
    if (path.extname(file).match(/\.(mp3|wav|aac|flac|ogg)$/i)) {
      const filePath = path.join(audioDir, file);
      const audioSrc = `/audio/${file}`;
      processedAudioSrcs.add(audioSrc);

      let trackData;
      try {
        const stats = await fs.stat(filePath);
        const metadata = await musicMetadata.parseFile(filePath);
        
        const title = metadata.common.title || path.basename(file, path.extname(file));
        const artist = metadata.common.artist || 'Unknown Artist';
        const aiPredictions = await getAiPredictions(filePath, title, artist);

        trackData = {
          title: title,
          artist: artist,
          audioSrc: audioSrc,
          imageUrl: '', // Placeholder, can be set manually or via another process
          bpm: aiPredictions.bpm,
          key: aiPredictions.key,
          genre: aiPredictions.genre,
          mood: aiPredictions.mood,
          category: aiPredictions.category,
          downloadUrls: { mp3: '', wav: '' }, // Placeholder
          duration: formatDuration(metadata.format.duration),
          releaseDate: stats.mtime.toISOString(),
        };

        const existingTrackIndex = packsData.tracks.findIndex(t => t.audioSrc === audioSrc);
        if (existingTrackIndex !== -1) {
          const existingTrack = packsData.tracks[existingTrackIndex];
          console.log(`Updating existing track: ${trackData.title} (ID: ${existingTrack.id})`);
          packsData.tracks[existingTrackIndex] = {
            ...existingTrack, // Preserve existing ID and other fields not directly extracted
            title: trackData.title,
            artist: trackData.artist,
            duration: trackData.duration,
            releaseDate: trackData.releaseDate, // Always update release date from file
            // Update AI-predicted fields if they are fresh
            bpm: trackData.bpm,
            key: trackData.key,
            genre: trackData.genre,
            mood: trackData.mood,
            category: trackData.category,
            // Keep existing imageUrl and downloadUrls unless explicitly changed
            imageUrl: existingTrack.imageUrl || '',
            downloadUrls: existingTrack.downloadUrls || { mp3: '', wav: '' },
          };
        } else {
          trackData.id = generateUniqueId(existingTrackIds);
          console.log(`Adding new track: ${trackData.title} (ID: ${trackData.id})`);
          packsData.tracks.push(trackData);
        }

      } catch (error) {
        console.error(`Error processing file ${file}:`, error.message);
        console.error(`Skipping ${file}. Please check its format or tags.`);
      }
    }
  }

  // Check existing tracks in packs.json and update releaseDate if file exists and date is missing
  for (let i = 0; i < packsData.tracks.length; i++) {
    const track = packsData.tracks[i];
    if (!track.releaseDate || track.releaseDate === "") {
      const audioFileName = track.audioSrc ? path.basename(track.audioSrc) : null;
      if (audioFileName) {
        const filePath = path.join(audioDir, audioFileName);
        try {
          if (await fs.stat(filePath)) { // Check if file exists
             const stats = await fs.stat(filePath);
             packsData.tracks[i].releaseDate = stats.mtime.toISOString();
             console.log(`Updated missing releaseDate for existing track: ${track.title} (ID: ${track.id}) to ${stats.mtime.toISOString()}`);
          } else {
            if (!processedAudioSrcs.has(track.audioSrc)) { // If not processed in the loop above (meaning file might be missing)
               tracksToManuallyCheck.push(`Track ID ${track.id} ('${track.title}') has no releaseDate and its audio file '${track.audioSrc}' was not found in ${audioDir}.`);
            }
          }
        } catch (err) { // fs.stat throws if file doesn't exist
            if (!processedAudioSrcs.has(track.audioSrc)) {
              tracksToManuallyCheck.push(`Track ID ${track.id} ('${track.title}') has no releaseDate and its audio file '${track.audioSrc}' was not found in ${audioDir} (Error: ${err.code}).`);
            }
        }
      } else {
         tracksToManuallyCheck.push(`Track ID ${track.id} ('${track.title}') has no releaseDate and no valid audioSrc.`);
      }
    }
  }
  
  if (tracksToManuallyCheck.length > 0) {
    console.warn("\nTracks requiring manual attention (missing releaseDate and/or audio file):");
    tracksToManuallyCheck.forEach(msg => console.warn(`- ${msg}`));
  }

  try {
    await fs.writeFile(packsJsonPath, JSON.stringify(packsData, null, 2), 'utf-8');
    console.log(`
Successfully updated ${packsJsonPath}`);
  } catch (error) {
    console.error(`Error writing ${packsJsonPath}:`, error);
  }
}

updatePacksJson().catch(console.error); 