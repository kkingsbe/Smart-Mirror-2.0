import React from 'react';
import { RadarFrame } from './types';

interface RadarOverlayProps {
  frames: RadarFrame[];
  currentFrame: number;
  opacity: number;
  darkTheme: boolean;
  loadedFrames?: boolean[];
}

/**
 * Component that displays the radar frames as an overlay on the map
 */
const RadarOverlay: React.FC<RadarOverlayProps> = ({
  frames,
  currentFrame,
  opacity,
  darkTheme,
  loadedFrames = [],
}) => {
  return (
    <>
      {frames.map((frame, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: index === currentFrame && (loadedFrames.length === 0 || loadedFrames[index]) ? opacity : 0,
            transition: 'opacity 0.2s ease-in-out',
            overflow: 'hidden',
            zIndex: 5,
          }}
        >
          <img
            src={frame.imageData}
            alt={`Weather radar frame ${index + 1}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              mixBlendMode: darkTheme ? 'screen' : 'normal', // Improve visibility on dark backgrounds
            }}
          />
        </div>
      ))}
      
      {/* Frame timestamp indicator */}
      {frames.length > 0 && currentFrame < frames.length && (
        <div style={{
          position: 'absolute',
          bottom: 5,
          right: 5,
          fontSize: '1.5rem',
          color: 'white',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '3px 6px',
          borderRadius: '3px',
          zIndex: 100
        }}>
          {new Date(frames[currentFrame].timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      )}
    </>
  );
};

export default RadarOverlay; 