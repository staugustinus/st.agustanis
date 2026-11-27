import { useCallback, useEffect, useState } from 'react';
import { calmMusicEngine } from '../utils/calmMusic';

export function useCalmMusic() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const toggleMusic = useCallback(async () => {
    if (calmMusicEngine.isPlaying()) {
      calmMusicEngine.stop();
      setIsMusicPlaying(false);
    } else {
      const started = await calmMusicEngine.start();
      setIsMusicPlaying(started);
    }
  }, []);

  useEffect(() => {
    return () => {
      calmMusicEngine.stop();
    };
  }, []);

  return {
    isMusicPlaying,
    toggleMusic,
  };
}
