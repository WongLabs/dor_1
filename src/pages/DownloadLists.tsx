import React, { useState } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  mood: string;
  releaseDate: string;
}

interface DownloadList {
  id: string;
  name: string;
  isPrivate: boolean;
  tracks: Track[];
}

const DownloadLists: React.FC = () => {
  const [lists] = useState<DownloadList[]>([
    {
      id: 'download',
      name: 'download',
      isPrivate: true,
      tracks: []
    }
  ]);

  useState<string>('download');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">My download list</h1>
          <p className="text-gray-400">You can now share your download lists with other Fuvi Clan users.</p>
        </div>

        {/* List Settings */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-gray-400">Caption</h2>
            <button className="flex items-center gap-2 px-3 py-1 rounded bg-gray-800">
              <span>🌐</span>
              <span>Public list visible to everyone</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-1 rounded bg-gray-800">
              <span>🔒</span>
              <span>Private list and visible only for you</span>
            </button>
          </div>
        </div>

        {/* Lists */}
        {lists.map(list => (
          <div key={list.id} className="bg-gray-800 rounded-lg mb-4">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="text-gray-400">▼</button>
                <span className="text-red-400">🔒</span>
                <h3>{list.name}</h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400">{list.tracks.length} tracks</span>
                <button className="bg-gray-700 text-white px-4 py-1 rounded-full">
                  Download
                </button>
                <button className="text-red-400">
                  🗑
                </button>
              </div>
            </div>

            {/* Tracks */}
            <div className="border-t border-gray-700">
              {list.tracks.map(track => (
                <div key={track.id} className="p-4 flex items-center gap-4 hover:bg-gray-750">
                  <button className="text-gray-400">▼</button>
                  <button className="w-8 h-8 flex items-center justify-center">▶️</button>
                  <div className="flex-1">
                    <h4 className="font-medium">{track.title}</h4>
                    <p className="text-gray-400 text-sm">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="w-12 text-right">{track.bpm}</span>
                    <span className="w-8">{track.key}</span>
                    <span className="w-24 text-gray-400">{track.genre}</span>
                    <span className="bg-blue-500 px-3 py-1 rounded-full text-xs">
                      {track.mood}
                    </span>
                    <span className="text-gray-400 text-sm">{track.releaseDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Create New List Button */}
        <button className="mt-4 bg-emerald-500 text-white px-6 py-2 rounded-lg">
          Create new list
        </button>
      </div>
    </div>
  );
};

export default DownloadLists; 