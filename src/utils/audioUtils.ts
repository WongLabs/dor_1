export const generateWaveformData = async (audioUrl: string): Promise<number[]> => {
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0); // Get the first channel
    const samples = 100; // Number of data points in the waveform
    const blockSize = Math.floor(channelData.length / samples);
    const waveformData = [];
    
    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      const end = start + blockSize;
      let sum = 0;
      
      for (let j = start; j < end; j++) {
        sum += Math.abs(channelData[j]);
      }
      
      waveformData.push(sum / blockSize);
    }
    
    // Normalize the data between 0 and 1
    const max = Math.max(...waveformData);
    return waveformData.map(val => val / max);
  } catch (error) {
    console.error('Error generating waveform data:', error);
    return [];
  }
};

export const drawWaveform = (canvas: HTMLCanvasElement, data: number[], color: string = '#FF69B4') => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  const barWidth = width / data.length;
  
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  
  data.forEach((value, index) => {
    const x = index * barWidth;
    const barHeight = value * height;
    const y = (height - barHeight) / 2;
    
    ctx.fillRect(x, y, barWidth - 1, barHeight);
  });
}; 