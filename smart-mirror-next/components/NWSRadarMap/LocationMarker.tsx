import React from 'react';

interface LocationMarkerProps {
  markerSize?: number;
  pulseSize?: number;
}

/**
 * Component that displays a location marker with a pulsing effect
 */
const LocationMarker: React.FC<LocationMarkerProps> = ({
  markerSize = 20,
  pulseSize = 40,
}) => {
  return (
    <>
      {/* Pulsing circle effect */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${pulseSize}px`,
          height: `${pulseSize}px`,
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 120, 255, 0.3)',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse 2s infinite',
          zIndex: 10,
        }}
      />
      
      {/* Marker dot */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${markerSize}px`,
          height: `${markerSize}px`,
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 120, 255, 0.8)',
          border: '2px solid white',
          transform: 'translate(-50%, -50%)',
          zIndex: 11,
          boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
        }}
      />
      
      {/* Add CSS animation for the pulse effect */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
          }
          70% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default LocationMarker; 