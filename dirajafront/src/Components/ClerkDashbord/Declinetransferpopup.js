import React, { useEffect, useState } from "react";
import { Modal, Button } from "antd";
import axios from "axios";

const TransferNotificationPopup = ({ shopId }) => {
  const [notifications, setNotifications] = useState([]);
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("Authentication required");

        const response = await axios.get("/https://kulima.co.ke/api/diraja/transfer-notifications", {
          headers: { Authorization: `Bearer ${token}` },
          params: { shop_id: shopId },
        });

        const notifs = response.data || [];
        setNotifications(notifs);
        if (notifs.length > 0) {
          setCurrent(notifs[0]);
          setVisible(true);
        }
      } catch (err) {
        console.error("Failed to fetch transfer notifications:", err);
      }
    };

    if (shopId) fetchNotifications();
  }, [shopId]);

  // 🔄 Reopen modal every 60s if dismissed temporarily (via X)
  useEffect(() => {
    if (!current) return;

    const interval = setInterval(() => {
      if (current && !visible) {
        setVisible(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [current, visible]);

  // ✅ Close permanently (acknowledge decline)
  const handleClose = async () => {
    if (!current) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `/https://kulima.co.ke/api/diraja/acknowledge-notification/${current.transfer_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to acknowledge notification:", err);
    }

    const remaining = notifications.slice(1);
    setNotifications(remaining);
    setCurrent(remaining.length > 0 ? remaining[0] : null);

    if (remaining.length === 0) {
      setVisible(false);
    } else {
      setVisible(true);
    }
  };

  // ❌ Temporary dismiss (user clicks X)
  const handleCancel = () => {
    setVisible(false); // hide, but it will reopen after 1 min
  };

  return (
    <>
      {current && (
        <Modal
          open={visible}
          title="Transfer Rejected"
          footer={[
            <Button key="close" type="primary" onClick={handleClose}>
              Close
            </Button>,
          ]}
          closable={true} // show X button
          maskClosable={false} // clicking outside won’t close
          onCancel={handleCancel} // only dismiss temporarily
        >
          <p>
            <strong>Item:</strong> {current.itemname}</p>
          <p>
            <strong>Rejected By:</strong> {current.to_shop_name}</p>
          <p>
            <strong>Quantity Returned:</strong> {current.quantity_returned}</p>
          <p>
            <strong>Reason:</strong> {current.decline_note}</p>
        </Modal>
      )}
    </>
  );
};

export default TransferNotificationPopup;
