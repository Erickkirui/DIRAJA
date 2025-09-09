import { useState } from "react";
import axios from "axios";


const StockTransfer = () => {
    const [formData, setFormData] = useState({
        from_shop_id: "",
        to_shop_id: "",
        stock_id: "",
        quantity: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await axios.post("api/diraja/transfer-sysytem-stock", formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setMessage(response.data.message);
            setFormData({ from_shop_id: "", to_shop_id: "", stock_id: "", quantity: "" });
        } catch (err) {
            setError(err.response?.data?.error || "An error occurred");
        }
        setLoading(false);
    };

    return (
        <div className="container">
            <h2>Transfer Stock</h2>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit} className="stock-form">
                <input
                    type="text"
                    name="from_shop_id"
                    value={formData.from_shop_id}
                    onChange={handleChange}
                    placeholder="From Shop ID"
                    required
                />
                <input
                    type="text"
                    name="to_shop_id"
                    value={formData.to_shop_id}
                    onChange={handleChange}
                    placeholder="To Shop ID"
                    required
                />
                <input
                    type="text"
                    name="stock_id"
                    value={formData.stock_id}
                    onChange={handleChange}
                    placeholder="Stock ID"
                    required
                />
                <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="Quantity"
                    required
                />
                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? "Transferring..." : "Transfer Stock"}
                </button>
            </form>
        </div>
    );
};

export default StockTransfer;
