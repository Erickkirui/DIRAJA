import React from 'react';

const PaymentMethods = ({ 
    paymentMethods, 
    validPaymentMethods, 
    handlePaymentChange, 
    addPaymentMethod, 
    removePaymentMethod 
}) => {
    return (
        <>
            <h5>Payment Methods</h5>
            {paymentMethods.map((method, index) => {
                const isNotPayed = method.method.toLowerCase() === 'not payed';
                
                return (
                    <div key={index} className="payment-method">
                        <select
                            value={method.method}
                            onChange={(e) => {
                                const newMethod = e.target.value;
                                handlePaymentChange(index, 'method', newMethod);
                                
                                // If "not payed" is selected, automatically set amount to 0
                                if (newMethod.toLowerCase() === 'not payed') {
                                    handlePaymentChange(index, 'amount', '0');
                                }
                            }}
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
                            className='input'
                            value={isNotPayed ? '0' : method.amount}
                            onChange={(e) => {
                                // Prevent changes if "not payed" is selected
                                if (!isNotPayed) {
                                    handlePaymentChange(index, 'amount', e.target.value);
                                }
                            }}
                            placeholder="Amount"
                            disabled={isNotPayed}
                            min="0"
                            step="0.01"
                        />

                        {/* Discount Field - Always defaults to 0 */}
                        <input
                            type="number"
                            className="input"
                            value={method.discount ?? 0}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Ensure we always have a valid number, default to 0
                                const processedValue = value === "" ? 0 : (parseFloat(value) || 0);
                                handlePaymentChange(index, "discount", processedValue);
                            }}
                            onBlur={(e) => {
                                // If field is empty on blur, set it to 0
                                if (e.target.value === "") {
                                    handlePaymentChange(index, "discount", 0);
                                }
                            }}
                            placeholder="Discount"
                            min="0"
                            step="0.01"
                        />

                      
                        {method.method && method.method.toLowerCase() !== 'cash' && method.method.toLowerCase() !== 'not payed' && (
                            <input
                                type="text"
                                value={method.transaction_code || ''}
                                onChange={(e) => handlePaymentChange(index, 'transaction_code', e.target.value)}
                                placeholder="Transaction Code (optional)"
                            />
                        )}
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
                );
            })}
            <button type="button" onClick={addPaymentMethod} className='complimentary-button'>
                Add Another Payment Method
            </button>
        </>
    );
};

export default PaymentMethods;