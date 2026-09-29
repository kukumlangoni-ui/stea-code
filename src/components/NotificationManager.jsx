import React from "react";
import NotificationPrompt from "./NotificationPrompt.jsx";

export const NotificationManager = ({ user = null, enabled = true }) => {
  if (!enabled) return null;
  return <NotificationPrompt user={user} />;
};

export default NotificationManager;
