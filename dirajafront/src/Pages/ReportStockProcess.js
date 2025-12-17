import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ManualStockReport from "../Components/ClerkDashbord/ManualStockReport";
import TransferManagement from "./Transfersmanagement";
import AddCashDeposit from "../Components/ClerkDashbord/CashDeposit";

function ReportStockProcess() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    <TransferManagement />,
    <ManualStockReport />,
    <AddCashDeposit />,
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const finishProcess = () => {
    navigate("/clerk");
  };

  return (
    <div>
      {/* Render current step */}
      {steps[step]}

      {/* Navigation buttons */}
      <div className="nav-button-group">
    <button
        className="nav-button"
        onClick={prevStep}
        disabled={step === 0}
    >
        ← Previous
    </button>

    {step < steps.length - 1 ? (
        <button
        className="nav-button"
        onClick={nextStep}
        >
        Next →
        </button>
    ) : (
        <button
        className="nav-button"
        onClick={finishProcess}
        >
        Finish
        </button>
    )}
    </div>

    </div>
  );
}

export default ReportStockProcess;
