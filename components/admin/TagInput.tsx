import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (newTags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value.includes(',')) {
      const newTags = value.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag && !tags.includes(tag));
      
      if (newTags.length > 0) {
        onTagsChange([...tags, ...newTags]);
      }
      setInputValue('');
    } else {
      setInputValue(value);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs flex items-center">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-500 hover:text-gray-800">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        id="tags"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full border-gray-300 rounded-md"
        placeholder="Add tags, separated by commas"
      />
    </div>
  );
};

export default React.memo(TagInput);