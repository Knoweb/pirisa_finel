import { useEffect, useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { TranslatableText } from "../languages/TranslatableText";

const RealtimeInsightCard: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [isDay, setIsDay] = useState(true);
  const [greeting, setGreeting] = useState("");

  // Update the time every second and determine greeting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now);

      // Determine if it's day or night (6 AM to 6 PM is day)
      const hours = now.getHours();
      const isDaytime = hours >= 6 && hours < 18;
      setIsDay(isDaytime);

      // Set appropriate greeting based on time of day
      if (hours >= 5 && hours < 12) {
        setGreeting("Good morning");
      } else if (hours >= 12 && hours < 17) {
        setGreeting("Good afternoon");
      } else if (hours >= 17 && hours < 21) {
        setGreeting("Good evening");
      } else {
        setGreeting("Good night");
      }
    };

    // Initial update
    updateTime();

    // Set interval for updates
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format the time as HH:MM:SS AM/PM
  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Format the date as "Day, Month Date, Year"
  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-600">
          {isDay ? (
            <FaSun className="text-yellow-500 text-4xl" />
          ) : (
            <FaMoon className="text-gray-700 text-4xl" />
          )}
        </div>
        {/* Time */}
        <div className="text-3xl font-bold text-gray-400">
          {formattedTime}
        </div>
      </div>

      {/* Date */}
      <div className="text-sm text-gray-600 mb-4">
        <span className="font-bold">
          <TranslatableText text="Today:" />
        </span>{" "}
        <TranslatableText text={formattedDate} />
      </div>

      {/* Greeting Message */}
      <div className="text-center py-2">
        <h3 className="text-2xl font-semibold text-gray-700">
          <TranslatableText text={greeting} />!
        </h3>
        <p className="text-gray-500 mt-1">
          {isDay ? (
            <TranslatableText text="Have a wonderful day!" />
          ) : (
            <TranslatableText text="Have a peaceful night!" />
          )}
        </p>
      </div>
    </div>
  );
};

export default RealtimeInsightCard;
