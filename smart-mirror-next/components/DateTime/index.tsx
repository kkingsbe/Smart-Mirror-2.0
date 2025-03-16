"use client";

import { useState, useEffect } from 'react';

const DateTime = () => {
  const [time, setTime] = useState({ hour: "00", minute: "00" });
  const [dateText, setDateText] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const date = new Date();
      
      // Format the date
      const formattedDate = `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
      
      // Format the time
      const hours = date.getHours() < 10 ? "0" + date.getHours().toString() : date.getHours().toString();
      const minutes = date.getMinutes() < 10 ? "0" + date.getMinutes().toString() : date.getMinutes().toString();
      
      setTime({ hour: hours, minute: minutes });
      setDateText(formattedDate);
    };

    // Update immediately
    updateDateTime();
    
    // Set interval to update every 100ms
    const intervalId = setInterval(updateDateTime, 100);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center p-5">
      <div className="text-[15rem]">
        <h1 className="m-0 font-['Big_Shoulders_Inline'] font-black">{time.hour}:{time.minute}</h1>
      </div>
      <div className="text-[3em] font-thin">
        <p>{dateText}</p>
      </div>
    </div>
  );
};

export default DateTime; 