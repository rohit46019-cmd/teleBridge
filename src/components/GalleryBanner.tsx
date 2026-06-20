import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from '../../constants.tsx';

interface Photo {
  _id: string;
  imageUrl: string;
  caption?: string;
}

export const GalleryBanner: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(setPhotos)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [photos]);

  const addPhoto = async () => {
    if (!newUrl) return;
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: newUrl })
    });
    if (res.ok) {
      const added = await res.json();
      setPhotos([...photos, added]);
      setNewUrl('');
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-slate-100 p-6 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center gap-4">
        <input type="text" placeholder="Enter Image URL" className="w-full p-3 rounded-xl border" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
        <button onClick={addPhoto} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Add Photo</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[250px] w-full rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 group">
        <AnimatePresence mode='wait'>
          <motion.img
            key={photos[currentIndex]._id}
            src={photos[currentIndex].imageUrl}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-8">
          <div className="text-white">
            <p className="font-bold text-2xl tracking-tight">{photos[currentIndex].caption || 'Gallery Highlights'}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder="Add new banner image URL..." className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-2xl text-sm border border-slate-200 dark:border-slate-700 shadow-sm" value={newUrl} onChange={e => setNewUrl(e.target.value)}/>
        <button onClick={addPhoto} className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-[#0088cc]/20 transition-all flex items-center gap-2"><Icons.Plus size={16} /> Add to Banner</button>
      </div>
    </div>
  );
};
