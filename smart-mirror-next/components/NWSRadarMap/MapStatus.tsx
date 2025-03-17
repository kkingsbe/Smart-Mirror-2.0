import React from 'react';

interface MapStatusProps {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const MapStatus: React.FC<MapStatusProps> = ({ isLoading, error, onRetry }) => {
  if (isLoading) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        zIndex: 1000,
        fontSize: '1.5rem',
      }}>
        Loading radar...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        color: 'red',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
      }}>
        Error: {error}
        <button 
          onClick={onRetry}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
}; 