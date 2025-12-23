import axios from 'axios';

// List of items that should always use "kg" as metric
const kgItems = [
  "boneless breast", "thighs", "drumstick", "big legs", "backbone", 
  "liver", "gizzard", "neck", "feet", "wings", "broiler", "pork", "nile perch",
  "maize", "ndengu", "mbaazi", "yellow beans", "njahi"
];

// Format numbers: no decimals if whole, else show up to 3 decimals
const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return Number(value) % 1 === 0 ? Number(value).toString() : Number(value).toFixed(3);
};

// Process quantity display with proper negative number handling
export const processQuantityDisplay = (itemname, quantity, metric, items) => {
  const itemInfo = items.find((item) => item.item_name === itemname);

  // Always use kg for specific items regardless of incoming metric
  const shouldUseKg = kgItems.some(kgItem => 
    itemname.toLowerCase().includes(kgItem.toLowerCase())
  );

  if (shouldUseKg) {
    return `${formatNumber(quantity)} kg`;
  }

  if (!itemInfo) {
    return `${formatNumber(quantity)} ${metric || "pcs"}`;
  }

  // Kgs stay as kgs
  if (metric && metric.toLowerCase() === "kgs") {
    return `${formatNumber(quantity)} kgs`;
  }

  // Handle negative quantities properly
  const isNegative = quantity < 0;
  const absoluteQuantity = Math.abs(quantity);

  // Eggs → trays + pieces
  const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
  if (isEggs && itemInfo.pack_quantity > 0) {
    const trays = Math.floor(absoluteQuantity / itemInfo.pack_quantity);
    const pieces = absoluteQuantity % itemInfo.pack_quantity;
    const formatted = trays > 0
      ? `${formatNumber(trays)} tray${trays !== 1 ? "s" : ""}${
          pieces > 0 ? `, ${formatNumber(pieces)} pcs` : ""
        }`
      : `${formatNumber(pieces)} pcs`;
    return isNegative ? `-${formatted}` : formatted;
  }

  // Other items with pack quantity → pkts + pcs
  if (itemInfo.pack_quantity > 0) {
    const packets = Math.floor(absoluteQuantity / itemInfo.pack_quantity);
    const pieces = absoluteQuantity % itemInfo.pack_quantity;
    const formatted = packets > 0
      ? `${formatNumber(packets)} pkt${packets !== 1 ? "s" : ""}${
          pieces > 0 ? `, ${formatNumber(pieces)} pcs` : ""
        }`
      : `${formatNumber(pieces)} pcs`;
    return isNegative ? `-${formatted}` : formatted;
  }

  // Fallback
  return `${formatNumber(quantity)} ${metric || "pcs"}`;
};

// Special function for difference display that handles negative pack quantities correctly
export const processDifferenceDisplay = (itemname, difference, metric, items) => {
  const itemInfo = items.find((item) => item.item_name === itemname);

  // Always use kg for specific items regardless of incoming metric
  const shouldUseKg = kgItems.some(kgItem => 
    itemname.toLowerCase().includes(kgItem.toLowerCase())
  );

  if (shouldUseKg) {
    return `${formatNumber(difference)} kg`;
  }

  if (!itemInfo) {
    return `${formatNumber(difference)} ${metric || "pcs"}`;
  }

  // Kgs stay as kgs
  if (metric && metric.toLowerCase() === "kgs") {
    return `${formatNumber(difference)} kgs`;
  }

  // Handle negative differences with pack quantities
  const isNegative = difference < 0;
  const absoluteDifference = Math.abs(difference);

  // Eggs → trays + pieces
  const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
  if (isEggs && itemInfo.pack_quantity > 0) {
    const trays = Math.floor(absoluteDifference / itemInfo.pack_quantity);
    const pieces = absoluteDifference % itemInfo.pack_quantity;
    const formatted = trays > 0
      ? `${formatNumber(trays)} tray${trays !== 1 ? "s" : ""}${
          pieces > 0 ? `, ${formatNumber(pieces)} eggs` : ""
        }`
      : `${formatNumber(pieces)} eggs`;
    return isNegative ? `-${formatted}` : formatted;
  }

  // Other items with pack quantity → pkts + pcs
  if (itemInfo.pack_quantity > 0) {
    const packets = Math.floor(absoluteDifference / itemInfo.pack_quantity);
    const pieces = absoluteDifference % itemInfo.pack_quantity;
    const formatted = packets > 0
      ? `${formatNumber(packets)} pkt${packets !== 1 ? "s" : ""}${
          pieces > 0 ? `, ${formatNumber(pieces)} pcs` : ""
        }`
      : `${formatNumber(pieces)} pcs`;
    return isNegative ? `-${formatted}` : formatted;
  }

  // Fallback
  return `${formatNumber(difference)} ${metric || "pcs"}`;
};

// Fetch stock items for proper metric conversion
export const fetchStockItems = async () => {
  try {
    const response = await axios.get("api/diraja/stockitems", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    return response.data.stock_items || [];
  } catch (err) {
    console.error("Error fetching stock items:", err);
    return [];
  }
};

// Main resolve function
export const resolveReconciliation = async (
  reconciliation, 
  resolveComment, 
  stockItems,
  processQuantityDisplay,
  processDifferenceDisplay
) => {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found, please log in.');
    }

    const response = await axios.put(
      `/api/diraja/stock-reconciliation/${reconciliation.id}`,
      {
        comment: resolveComment,
        status: 'Solved',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Return the updated reconciliation object
    return {
      ...reconciliation,
      comment: resolveComment,
      status: 'Solved',
      formattedStockValue: processQuantityDisplay(
        reconciliation.item,
        reconciliation.stock_value,
        reconciliation.metric,
        stockItems
      ),
      formattedReportValue: processQuantityDisplay(
        reconciliation.item,
        reconciliation.report_value,
        reconciliation.metric,
        stockItems
      ),
      formattedDifference: processDifferenceDisplay(
        reconciliation.item,
        reconciliation.difference,
        reconciliation.metric,
        stockItems
      )
    };

  } catch (err) {
    console.error('Error resolving reconciliation:', err);
    throw new Error('Error resolving reconciliation. Please try again.');
  }
};