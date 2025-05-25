import React, { useState } from 'react';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToList: (listName: string) => void;
  existingLists: string[];
}

const AddToListModal: React.FC<AddToListModalProps> = ({
  isOpen,
  onClose,
  onAddToList,
  existingLists
}) => {
  const [newListName, setNewListName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-semibold">Add to download list</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <button 
            className="w-full bg-gray-700 text-white py-2 px-4 rounded mb-2"
            onClick={() => onAddToList('download')}
          >
            download
          </button>
          {existingLists.map((list) => (
            <button
              key={list}
              className="w-full bg-gray-700 text-white py-2 px-4 rounded mb-2"
              onClick={() => onAddToList(list)}
            >
              {list}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-white mb-2">Create new list</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Name"
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded"
            />
            <button
              onClick={() => {
                if (newListName.trim()) {
                  onAddToList(newListName);
                  setNewListName('');
                }
              }}
              className="bg-emerald-500 text-white px-4 py-2 rounded"
            >
              Créer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToListModal; 