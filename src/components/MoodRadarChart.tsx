import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface MoodProbability {
  label: string;
  value: number;
  color: string;
}

interface MoodRadarChartProps {
  moodProbabilities: MoodProbability[];
}

const MoodRadarChart: React.FC<MoodRadarChartProps> = ({ moodProbabilities }) => {
  const data = {
    labels: moodProbabilities.map(m => m.label),
    datasets: [
      {
        label: 'Mood Probability',
        data: moodProbabilities.map(m => m.value),
        backgroundColor: 'rgba(0, 163, 255, 0.2)',
        borderColor: '#00A3FF',
        borderWidth: 2,
        pointBackgroundColor: moodProbabilities.map(m => m.color),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: moodProbabilities.map(m => m.color),
      },
    ],
  };

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 0.2,
          display: false,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: '#fff',
          font: {
            size: 12,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full h-full">
      <Radar data={data} options={options} />
    </div>
  );
};

export default MoodRadarChart; 