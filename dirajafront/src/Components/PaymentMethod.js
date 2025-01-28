import React from 'react';

const PaymentMethods = ({ 
    paymentMethods, 
    validPaymentMethods, 
    handlePaymentChange, 
    addPaymentMethod, 
    removePaymentMethod 
}) => {
    return (
        <div>
            <h3>Payment Methods</h3>
            {paymentMethods.map((method, index) => (
                <div key={index} className="payment-method">
                    <select
                        value={method.method}
                        onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                        className="input"
                    >
                        <option value="">Payment Method</option>
                        {validPaymentMethods.map((validMethod) => (
                            <option key={validMethod} value={validMethod}>
                                {validMethod.charAt(0).toUpperCase() + validMethod.slice(1)}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={method.amount}
                        onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                        placeholder="Amount"
                        className="input"
                    />
                    {index > 0 && (
                        <button 
                            type="button" 
                            onClick={() => removePaymentMethod(index)} 
                            className="button remove"
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={addPaymentMethod} className='payment-button' >
                Add Another Payment Method
            </button>
        </div>
    );
};

export default PaymentMethods;

