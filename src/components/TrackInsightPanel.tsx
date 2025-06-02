import React, { useEffect, useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import moodDataJson from '../data/mood.json'; // Renamed to avoid conflict
import { getTracksData } from '../utils/trackUtils'; // To get packs.json data
import { type PackTrack } from '../pages/FilteredMood'; // Type for tracks from packs.json

interface MoodProbability {
  mood: string;
  value: number;
  color: string;
}

interface MirexCluster {
  clusterId: number;
  percentageMatch?: number;
}

interface TrackInsightData {
  trackId: string;
  moodProbabilities: MoodProbability[];
  danceability: number;
  voiceInstrumentalRatio: number;
  mirexCluster: MirexCluster;
}

interface TrackInsightPanelProps {
  trackId: string | undefined;
}

const MIREX_MOOD_CLUSTERS: { [key: number]: string } = {
  1: "Passionate, rousing, confident, boisterous, rowdy",
  2: "Rollicking, cheerful, fun, sweet, good-natured",
  3: "Poignant, wistful, bittersweet, autumnal, brooding",
  4: "Quirky, witty, whimsical, silly, campy",
  5: "Intense, volatile, aggressive, tense, anxious"
};

const getClusterColor = (clusterId: number): string => {
  const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0']; // Green, Blue, Orange, Pink, Purple
  return colors[clusterId - 1] || '#757575'; // Default to grey
};

const TrackInsightPanel: React.FC<TrackInsightPanelProps> = ({ trackId }) => {
  const [insightData, setInsightData] = useState<TrackInsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const STANDARD_MOOD_CONFIG: ReadonlyArray<{ name: string; color: string }> = useMemo(() => [
    { name: "Melancholic", color: "#673AB7" }, 
    { name: "Chilled",     color: "#00BCD4" }, 
    { name: "Uplifting",   color: "#E91E63" }, 
    { name: "Sad",         color: "#3F51B5" }, 
    { name: "Energetic",   color: "#FFC107" }, 
    { name: "Relaxing",    color: "#8BC34A" }, 
    { name: "Dark",        color: "#424242" }, 
    { name: "Tense",       color: "#FF9800" }, 
    { name: "Calm",        color: "#03A9F4" }, 
    { name: "Ethereal",    color: "#9C27B0" }, 
    { name: "Romantic",    color: "#D81B60" }, 
    { name: "Sexy",        color: "#C2185B" }, 
    { name: "Epic",        color: "#F44336" }, 
    { name: "Happy",       color: "#FFEB3B" }, 
  ], []);

  const voicePercentage = useMemo(() => {
    if (!insightData) return 0;
    return Math.round(insightData.voiceInstrumentalRatio * 100);
  }, [insightData]);

  const instrumentalPercentage = useMemo(() => 100 - voicePercentage, [voicePercentage]);

  const dominantMoodColor = useMemo(() => {
    if (!insightData || insightData.moodProbabilities.length === 0) {
      return "#8884d8"; // Default color
    }
    let maxVal = 0;
    let dominantColor = "#8884d8";
    let foundMoodWithValue = false;

    insightData.moodProbabilities.forEach(moodProb => {
      if (moodProb.value > 0) foundMoodWithValue = true;
      if (moodProb.value > maxVal) {
        maxVal = moodProb.value;
        const configMood = STANDARD_MOOD_CONFIG.find(sm => sm.name === moodProb.mood);
        dominantColor = configMood ? configMood.color : "#8884d8";
      }
    });
    if (!foundMoodWithValue || maxVal === 0) return "#8884d8";
    return dominantColor;
  }, [insightData, STANDARD_MOOD_CONFIG]);

  useEffect(() => {
    if (!trackId) {
      setIsLoading(false);
      setInsightData(null);
      return;
    }

    setIsLoading(true);
    const explicitInsightSource = moodDataJson.insights.find(item => item.trackId === trackId);

    if (explicitInsightSource) {
      const processedMoods: MoodProbability[] = STANDARD_MOOD_CONFIG.map(stdMood => {
        const foundMood = explicitInsightSource.moodProbabilities.find(
          (em: any) => em.mood.toLowerCase() === stdMood.name.toLowerCase()
        );
        return {
          mood: stdMood.name, 
          value: foundMood ? foundMood.value : 0, 
          color: stdMood.color,
        };
      });
      setInsightData({ ...explicitInsightSource, moodProbabilities: processedMoods });
      setIsLoading(false);
    } else {
      const allPacksTracks = getTracksData();
      const packTrack = allPacksTracks?.find((t: PackTrack) => t.id === trackId);

      if (packTrack) {
        const packMoodName = packTrack.mood?.trim().toLowerCase();
        let defaultMoodProbs: MoodProbability[];

        if (packMoodName && STANDARD_MOOD_CONFIG.some(sm => sm.name.toLowerCase() === packMoodName)) {
          defaultMoodProbs = STANDARD_MOOD_CONFIG.map(stdMood => ({
            mood: stdMood.name,
            value: stdMood.name.toLowerCase() === packMoodName ? 28 : 0.5, 
            color: stdMood.color,
          }));
        } else {
          const lowBaselineValue = 0.5; 
           defaultMoodProbs = STANDARD_MOOD_CONFIG.map(stdMood => ({
            mood: stdMood.name,
            value: lowBaselineValue, 
            color: stdMood.color,
          }));
        }

        const defaultData: TrackInsightData = {
          trackId: packTrack.id,
          moodProbabilities: defaultMoodProbs, 
          danceability: packTrack.bpm ? Math.min(95, Math.max(40, Math.round(packTrack.bpm / 1.8))) : 65,
          voiceInstrumentalRatio: (packTrack.genre === 'Instrumental' || !packTrack.genre) ? 0.05 : 0.25,
          mirexCluster: {
            clusterId: 2, 
          }
        };
        setInsightData(defaultData);
      } else {
        setInsightData(null); 
      }
      setIsLoading(false);
    }
  }, [trackId, STANDARD_MOOD_CONFIG]);
  
  if (isLoading) {
    return (
      <div className="bg-[#1A1A1A] rounded-lg p-6 mt-6 text-gray-400 text-center">
        Loading track insights...
      </div>
    );
  }

  if (!insightData) {
    return (
      <div className="bg-[#1A1A1A] rounded-lg p-6 mt-6 text-gray-400 text-center">
        Track insights not available for this track (ID: {trackId}).
      </div>
    );
  }

  const radarChartData = insightData.moodProbabilities.map(item => ({
    subject: item.mood, 
    A: item.value,      
    fullMark: 50,       
  })); 

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6 mt-8">
      <h3 className="text-xl font-semibold text-white mb-6">Track Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Radar Chart */}
        <div className="md:col-span-1">
          <h4 className="text-lg font-medium text-gray-200 mb-3">Mood Probability</h4>
          {radarChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                  <PolarGrid stroke="#4A4A4A" />
                  <PolarAngleAxis dataKey="subject" stroke="#888" tick={{ fontSize: 10, fill: '#B0B0B0' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 50]} stroke="#4A4A4A" tick={{ fontSize: 10 }} />
                  <Radar dataKey="A" stroke={dominantMoodColor} fill={dominantMoodColor} fillOpacity={0.6} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#2A2A2A', border: '1px solid #4A4A4A', borderRadius: '4px' }} 
                    itemStyle={{ color: '#E0E0E0' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {STANDARD_MOOD_CONFIG.map((moodConfig) => (
                  <div key={moodConfig.name} className="flex items-center text-xs text-gray-300">
                    <span style={{ width: '10px', height: '10px', backgroundColor: moodConfig.color, marginRight: '6px', borderRadius: '2px', display: 'inline-block' }}></span>
                    {moodConfig.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center h-[350px] flex items-center justify-center">Mood probability data not sufficient for chart.</p>
          )}
        </div>

        {/* Right: Bars and Cluster Info */}
        <div className="md:col-span-1 space-y-8">
          {/* Danceability Bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <h4 className="text-md font-medium text-gray-200">Danceability</h4>
              <span className="text-sm font-semibold text-blue-400">{insightData.danceability}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${insightData.danceability}%` }}
              ></div>
            </div>
          </div>

          {/* Voice vs Instrumental Bar */}
          <div>
            <h4 className="text-md font-medium text-gray-200 mb-1.5">Voice vs Instrumental</h4>
            <div className="w-full bg-gray-700 rounded-full h-3 flex overflow-hidden">
              <div 
                className="bg-pink-500 h-3 transition-all duration-500 ease-out flex items-center justify-center"
                style={{ width: `${voicePercentage}%` }}
                title={`Vocals: ${voicePercentage}%`}
              >
              </div>
              <div 
                className="bg-teal-500 h-3 transition-all duration-500 ease-out flex items-center justify-center"
                style={{ width: `${instrumentalPercentage}%` }}
                title={`Instrumental: ${instrumentalPercentage}%`}
              >
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{voicePercentage > 0 ? `${voicePercentage}% Vocals` : 'Fully Instrumental'}</span>
                <span>{instrumentalPercentage > 0 && voicePercentage < 100 ? `${instrumentalPercentage}% Instrumental` : voicePercentage === 100 ? 'Fully Vocal' : ''}</span>
            </div>
          </div>

          {/* MIREX Cluster Classification */}
          <div>
            <h4 className="text-md font-medium text-gray-200 mb-1.5">MIREX Audio Mood Classification</h4>
            <div className="flex items-center mb-1">
              <span 
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold mr-3"
                style={{ 
                    backgroundColor: getClusterColor(insightData.mirexCluster.clusterId),
                    color: '#FFFFFF' 
                }}
              >
                Cluster {insightData.mirexCluster.clusterId}
              </span>
            </div>

            {insightData.mirexCluster.percentageMatch && insightData.mirexCluster.percentageMatch > 0 && (
              <div className="my-2">
                <div className="w-full bg-gray-700 rounded-full h-2.5 relative">
                  <div 
                    className="h-2.5 rounded-full"
                    style={{ 
                      width: `${insightData.mirexCluster.percentageMatch}%`,
                      backgroundColor: getClusterColor(insightData.mirexCluster.clusterId)
                    }}
                  ></div>
                  <span className="absolute w-full text-center text-xs text-white inset-0 flex items-center justify-center"
                        style={{ lineHeight: '10px' }}
                  > 
                    {insightData.mirexCluster.percentageMatch}%
                  </span>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-400 leading-relaxed mt-1">
              {MIREX_MOOD_CLUSTERS[insightData.mirexCluster.clusterId] || 'Unknown Cluster'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackInsightPanel; 