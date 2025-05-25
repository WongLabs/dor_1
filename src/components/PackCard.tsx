import React from 'react';

export interface PackCardType {
  id: string;
  name: string;
  trackCount: number;
  imageUrl?: string; // Optional image URL
}

interface PackCardProps {
  pack: PackCardType;
  onClick?: (packId: string) => void; // Optional click handler
}

const PackCard: React.FC<PackCardProps> = ({ pack, onClick }) => {
  return (
    <div
      key={pack.id}
      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors aspect-square flex flex-col justify-between cursor-pointer"
      onClick={() => onClick?.(pack.id)}
    >
      {pack.imageUrl ? (
        <img src={pack.imageUrl} alt={pack.name} className="h-32 w-full object-cover rounded-lg mb-4" />
      ) : (
        <div className="h-32 bg-gray-700 rounded-lg mb-4"></div>
      )}
      <div>
        <h3 className="font-semibold">{pack.name}</h3>
        <p className="text-gray-400 text-sm">{pack.trackCount} tracks</p>
      </div>
    </div>
  );
};

export default PackCard; 