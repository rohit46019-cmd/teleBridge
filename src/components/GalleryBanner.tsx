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
    <div className="relative h-[250px] w-full rounded-[2rem] overflow-hidden shadow-2xl group">
      <AnimatePresence mode='wait'>
        <motion.img
          key={photos[currentIndex]._id}
          src={photos[currentIndex].imageUrl}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
        <div className="text-white">
          <p className="font-bold text-lg">{photos[currentIndex].caption || 'Gallery'}</p>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-2">
        <input type="text" placeholder="Add URL" className="bg-white/20 p-2 rounded-lg text-xs text-white placeholder:text-white/50 border border-white/20" value={newUrl} onChange={e => setNewUrl(e.target.value)}/>
        <button onClick={addPhoto} className="bg-white/20 p-2 rounded-lg text-white hover:bg-white/40"><Icons.Plus size={16} /></button>
      </div>
    </div>
  );
};
