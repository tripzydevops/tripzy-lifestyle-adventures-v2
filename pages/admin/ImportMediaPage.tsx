import React, { useState } from 'react';
import { mediaService } from '../../services/mediaService';
import { useToast } from '../../hooks/useToast';
import { Link2, LoaderCircle, PlayCircle } from 'lucide-react';
import { MediaItem } from '../../types';

const ImportMediaPage = () => {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importedItem, setImportedItem] = useState<MediaItem | null>(null);
  const { addToast } = useToast();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      addToast('Please enter a valid URL.', 'error');
      return;
    }

    setIsImporting(true);
    setImportedItem(null);
    try {
      const newItem = await mediaService.importMediaFromUrl(url);
      setImportedItem(newItem);
      addToast('Media imported successfully!', 'success');
      setUrl('');
    } catch (error) {
      if (error instanceof Error) {
        addToast(error.message, 'error');
      } else {
        addToast('Failed to import media.', 'error');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Import External Media</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <p className="text-gray-600 mb-4">
          Paste the URL of an image or video to import it directly into your media library.
        </p>
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label htmlFor="media-url" className="block text-sm font-medium text-gray-700 mb-1">
              Media URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="media-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="https://example.com/image.jpg"
                required
                disabled={isImporting}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isImporting}
            className="w-full bg-primary text-white py-2 px-4 rounded-md flex items-center justify-center hover:bg-blue-800 transition disabled:bg-gray-400"
          >
            {isImporting ? (
              <>
                <LoaderCircle size={20} className="mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Media'
            )}
          </button>
        </form>
        {importedItem && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Last Imported Item</h3>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md">
              <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md relative">
                {importedItem.mediaType === 'video' ? (
                  <>
                    <video src={importedItem.url} className="w-full h-full object-cover rounded-md" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayCircle size={24} className="text-white/80" />
                    </div>
                  </>
                ) : (
                  <img src={importedItem.url} alt={importedItem.fileName} className="w-full h-full object-cover rounded-md" />
                )}
              </div>
              <div className="truncate">
                <p className="font-medium text-gray-900 truncate" title={importedItem.fileName}>
                  {importedItem.fileName}
                </p>
                <p className="text-sm text-gray-500 capitalize">{importedItem.mediaType}</p>
                <a href={importedItem.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">
                  {importedItem.url}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportMediaPage;