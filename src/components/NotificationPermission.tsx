import { useEffect } from "react";

const NotificationPermission = () => {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Small delay so the app loads first
      const timer = setTimeout(() => {
        Notification.requestPermission();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
};

export default NotificationPermission;
