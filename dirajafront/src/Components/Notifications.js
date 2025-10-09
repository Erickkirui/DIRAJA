import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const NotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const token = localStorage.getItem("token");
  const shop_id = localStorage.getItem("shop_id");
  const user_id = localStorage.getItem("users_id");

  const VAPID_PUBLIC_KEY =
    "BN2Uo7zu3eIz4tHBpNnQAY5z5tyX8SjW87iPZINkh5gn3Qick2YyUSVxX58cXG5_3ViYNgGo8QJbW2ynvcbcL4I";

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.log("Push notifications not supported in this browser.");
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const existingSub = await reg.pushManager.getSubscription();

        if (!existingSub) {
          console.log("No subscription found — showing subscribe prompt.");
          setShowPrompt(true);
        } else {
          console.log("Existing subscription found — not showing subscribe prompt.");
        }
      } catch (err) {
        console.error("Subscription check failed:", err);
      }
    };

    checkSubscription();
  }, []);

  const subscribeToNotifications = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await axios.post(
        "api/diraja/subscribe",
        { shop_id, user_id, subscription: sub },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowPrompt(false);
    } catch (err) {
      console.error("Subscription failed:", err);
      alert("Failed to subscribe to notifications.");
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  // Inline styles
  const containerStyle = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "white",
    boxShadow: "0 -4px 15px rgba(0,0,0,0.1)",
    padding: "24px",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  };

  const headingStyle = {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "8px",
  };

  const paragraphStyle = {
    color: "#4b5563",
    fontSize: "14px",
    marginBottom: "16px",
    maxWidth: "90%",
  };

  const buttonContainerStyle = {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  };

  const allowButtonStyle = {
    background: "#2563eb",
    color: "white",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
  };

  const laterButtonStyle = {
    background: "#e5e7eb",
    color: "#1f2937",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 80 }}
          style={containerStyle}
        >
          <h3 style={headingStyle}>Enable Notifications</h3>
          <p style={paragraphStyle}>
            Stay updated with important alerts and updates directly from your shop.
          </p>
          <div style={buttonContainerStyle}>
            <button
              style={allowButtonStyle}
              onClick={subscribeToNotifications}
              onMouseOver={(e) => (e.target.style.background = "#1d4ed8")}
              onMouseOut={(e) => (e.target.style.background = "#2563eb")}
            >
              Allow
            </button>
            <button
              style={laterButtonStyle}
              onClick={() => setShowPrompt(false)}
              onMouseOver={(e) => (e.target.style.background = "#d1d5db")}
              onMouseOut={(e) => (e.target.style.background = "#e5e7eb")}
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
