import React, { useState } from "react";
import axios from "axios";
import { Upload, Button, Table, Alert, Spin, Card } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const CSVUploader = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post("https://kulima.co.ke/api/diraja/process-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;

      // Check if the response has the new structure
      if (data && data.transactions && data.summary) {
        // Sort transactions: matched first, then unmatched
        const sortedTransactions = [...data.transactions].sort((a, b) => {
          if (a.matched === "yes" && b.matched !== "yes") return -1;
          if (a.matched !== "yes" && b.matched === "yes") return 1;
          return 0;
        });
        
        setResults(sortedTransactions);
        setSummary(data.summary);
      } else {
        // Fallback for old structure (array response)
        const transactions = Array.isArray(data) ? data : [];
        
        // Sort transactions: matched first, then unmatched
        const sortedTransactions = [...transactions].sort((a, b) => {
          if (a.matched === "yes" && b.matched !== "yes") return -1;
          if (a.matched !== "yes" && b.matched === "yes") return 1;
          return 0;
        });
        
        setResults(sortedTransactions);
        
        // Compute summary from transactions for old format
        const notMatchedCount = transactions.filter((tx) => tx.matched !== "yes").length;
        const totalCsvAmount = transactions.reduce(
          (sum, tx) => sum + (parseFloat(tx.amount_csv) || 0),
          0
        );
        const totalDbAmount = transactions.reduce(
          (sum, tx) => sum + (parseFloat(tx.amount_paid_db) || 0),
          0
        );
        const matchedCsvAmount = transactions
          .filter((tx) => tx.matched === "yes")
          .reduce((sum, tx) => sum + (parseFloat(tx.amount_csv) || 0), 0);

        setSummary({
          notMatchedCount,
          totalCsvAmount,
          totalDbAmount,
          matchedCsvAmount,
          total_csv_transactions: transactions.length,
          total_matched_transactions: transactions.filter(tx => tx.matched === "yes").length,
          total_unmatched_transactions: notMatchedCount,
          duplicate_transactions: transactions.filter(tx => tx.duplicate === "yes").length
        });
      }

    } catch (err) {
      console.error("CSV processing failed:", err);
      setError(err.response?.data?.error || "Error processing CSV on server");
    } finally {
      setLoading(false);
    }
  };

  // --- Export function ---
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Add summary sheet
    if (summary) {
      const summaryData = [
        { Metric: "Total CSV Transactions", Value: summary.total_csv_transactions },
        { Metric: "Matched Transactions", Value: summary.total_matched_transactions },
        { Metric: "Unmatched Transactions", Value: summary.total_unmatched_transactions },
        { Metric: "Duplicate Transactions", Value: summary.duplicate_transactions },
        { Metric: "Total CSV Amount", Value: summary.total_csv_amount },
        { Metric: "Matched CSV Amount", Value: summary.total_csv_matched_amount },
        { Metric: "Total DB Amount", Value: summary.total_db_amount },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    }

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "transactions_report.xlsx");
  };

  const columns = [
    { title: "CSV Code", dataIndex: "transaction_code_csv", key: "transaction_code_csv" },
    { title: "Client", dataIndex: "client_name_csv", key: "client_name_csv" },
    { title: "CSV Amount", dataIndex: "amount_csv", key: "amount_csv" },
    {
      title: "Matched",
      dataIndex: "matched",
      key: "matched",
      render: (v) => (v === "yes" ? "✅" : "❌"),
    },
    // {
    //   title: "Duplicate",
    //   dataIndex: "duplicate",
    //   key: "duplicate",
    //   render: (v) => (v === "yes" ? "⚠️" : ""),
    // },
    { title: "DB Code", dataIndex: "transaction_code_db", key: "transaction_code_db" },
    { title: "DB Amount", dataIndex: "amount_paid_db", key: "amount_paid_db" },
    { title: "Item", dataIndex: "item", key: "item" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "User", dataIndex: "username", key: "user" },
  ];

  return (
    <div style={{ maxWidth: "100%", padding: 20 }}>
      <h1>Compare Sasapay Transactions</h1>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Upload
        accept=".csv"
        customRequest={({ file, onSuccess, onError }) => {
          handleFileUpload(file)
            .then(() => onSuccess("ok"))
            .catch((err) => onError(err));
        }}
        showUploadList={false}
      >
        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={loading}
          disabled={loading}
          style={{ marginBottom: 16 }}
        >
          Upload CSV
        </Button>
      </Upload>

      {loading && (
        <Spin size="large" style={{ display: "block", margin: "20px auto" }} />
      )}

      {results.length > 0 && (
        <>
          <Table
            dataSource={results}
            columns={columns}
            rowKey={(record, idx) => idx}
            bordered
            pagination={{ pageSize: 50 }}
          />

          <div style={{ marginTop: 20, textAlign: "right" }}>
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={exportToExcel}
            >
              Export to Excel
            </Button>
          </div>

          {summary && (
            <Card
              title="Analysis Summary"
              bordered={true}
              style={{ marginTop: 20 }}
            >
              <p>
                <strong>Total CSV Transactions:</strong>{" "}
                {summary.total_csv_transactions}
              </p>
              <p>
                <strong>Matched Transactions:</strong>{" "}
                {summary.total_matched_transactions}
              </p>
              <p>
                <strong>Unmatched Transactions:</strong>{" "}
                {summary.total_unmatched_transactions}
              </p>
              {/* <p>
                <strong>Duplicate Transactions:</strong>{" "}
                {summary.duplicate_transactions}
              </p> */}
              <p>
                <strong>Total Amount in CSV:</strong>{" "}
                {summary.total_csv_amount?.toLocaleString()}
              </p>
              <p>
                <strong>Total CSV Amount for Matched Transactions:</strong>{" "}
                {summary.total_csv_matched_amount?.toLocaleString()}
              </p>
              <p>
                <strong>Total Amount in DB:</strong>{" "}
                {summary.total_db_amount?.toLocaleString()}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default CSVUploader;