import React, { useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Wind, 
  CloudLightning, 
  Snowflake, 
  Droplets, 
  AlertCircle, 
  ThermometerSnowflake, 
  Sun, 
  Info
} from 'lucide-react';
import { WeatherAlert, AlertCounts } from './types';
import { getAlertColor } from './utils';

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
  currentAlert: number;
  alertCounts: AlertCounts;
}

/**
 * Component that displays weather alerts with scrolling text
 */
const WeatherAlerts: React.FC<WeatherAlertsProps> = ({
  alerts,
  currentAlert,
  alertCounts,
}) => {
  const alertTextRef = useRef<HTMLDivElement>(null);
  const textScrollRef = useRef<number | null>(null);
  
  // Text scrolling effect for alert text
  useEffect(() => {
    if (alerts.length === 0 || !alertTextRef.current) return;
    
    // Clear any existing interval
    if (textScrollRef.current !== null) {
      clearInterval(textScrollRef.current);
      textScrollRef.current = null;
    }
    
    const textElement = alertTextRef.current;
    
    // Reset scroll position to the beginning
    textElement.scrollLeft = 0;
    
    const textWidth = textElement.scrollWidth;
    const containerWidth = textElement.clientWidth;
    
    // Only scroll if text is overflowing
    if (textWidth > containerWidth) {
      // Start scrolling after a delay
      const startDelay = setTimeout(() => {
        // Calculate total scroll distance and duration
        const scrollDistance = textWidth - containerWidth;
        const scrollDuration = Math.min(scrollDistance * 25, 6000); // 25ms per pixel, max 6 seconds
        
        // Calculate scroll step size based on distance and duration
        const scrollStep = 1;
        const scrollInterval = Math.max(10, Math.floor(scrollDuration / scrollDistance));
        
        let currentPosition = 0;
        
        // Create the scrolling interval
        textScrollRef.current = window.setInterval(() => {
          // Increment position
          currentPosition += scrollStep;
          
          // Apply the scroll position
          textElement.scrollLeft = currentPosition;
          
          // If we've reached the end, stop scrolling
          if (currentPosition >= scrollDistance) {
            if (textScrollRef.current !== null) {
              clearInterval(textScrollRef.current);
              textScrollRef.current = null;
            }
          }
        }, scrollInterval);
      }, 2000); // Wait 2 seconds before starting to scroll
      
      // Clean up the timeout if the component unmounts
      return () => {
        clearTimeout(startDelay);
        if (textScrollRef.current !== null) {
          clearInterval(textScrollRef.current);
          textScrollRef.current = null;
        }
      };
    }
    
    return () => {
      if (textScrollRef.current !== null) {
        clearInterval(textScrollRef.current);
        textScrollRef.current = null;
      }
    };
  }, [currentAlert, alerts]);
  
  // Get icon for alert type
  const getAlertIcon = (eventType: string) => {
    const iconProps = { size: 16, strokeWidth: 2 };
    
    if (eventType.includes('Tornado')) {
      return <Wind {...iconProps} />;
    } else if (eventType.includes('Thunderstorm') || eventType.includes('Lightning')) {
      return <CloudLightning {...iconProps} />;
    } else if (eventType.includes('Snow') || eventType.includes('Blizzard') || eventType.includes('Winter')) {
      return <Snowflake {...iconProps} />;
    } else if (eventType.includes('Flood') || eventType.includes('Rain')) {
      return <Droplets {...iconProps} />;
    } else if (eventType.includes('Wind')) {
      return <Wind {...iconProps} />;
    } else if (eventType.includes('Freeze') || eventType.includes('Frost') || eventType.includes('Cold')) {
      return <ThermometerSnowflake {...iconProps} />;
    } else if (eventType.includes('Heat') || eventType.includes('Hot')) {
      return <Sun {...iconProps} />;
    } else if (eventType.includes('Warning')) {
      return <AlertTriangle {...iconProps} />;
    } else if (eventType.includes('Watch')) {
      return <AlertCircle {...iconProps} />;
    } else {
      return <Info {...iconProps} />;
    }
  };
  
  if (alerts.length === 0 || currentAlert >= alerts.length) {
    return null;
  }
  
  const alert = alerts[currentAlert];
  const alertColor = getAlertColor(alert.severity);
  
  return (
    <div 
      style={{
        width: '100%',
        color: alertColor.text,
        background: alertColor.bg,
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Alert header with icon, title and counter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '4px',
        width: '100%',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{ 
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
          }}>
            {getAlertIcon(alert.event)}
          </div>
          <div style={{ 
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}>
            {alert.event}
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          marginLeft: '8px',
          flexShrink: 0,
        }}>
          {currentAlert + 1}/{alerts.length}
        </div>
      </div>
      
      {/* Alert description */}
      <div 
        ref={alertTextRef}
        style={{ 
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          scrollBehavior: 'smooth',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          paddingTop: '4px',
        }}
      >
        {alert.headline || alert.description.substring(0, 100)}
      </div>
    </div>
  );
};

export default WeatherAlerts; 