import { useState, useEffect, useRef } from "react";
import { aiService } from "../services/ai";
import {
  Sparkles,
  X,
  Send,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  Bot,
  User,
} from "lucide-react";
import "./MedicineAiModal.css";

export function MedicineAiModal({ isOpen, onClose, medicine }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Initialize welcome state when modal opens or medicine changes
  useEffect(() => {
    if (isOpen && medicine) {
      const initialSuggestions = [
        `What is ${medicine.name}?`,
        `What is the generic composition of ${medicine.name}?`,
        `What is ${medicine.name} generally used for?`,
        `What are the general precautions for ${medicine.name}?`,
        `What should I discuss with a pharmacist?`,
      ];

      setSuggestedQuestions(initialSuggestions);
      setMessages([
        {
          id: "welcome",
          sender: "assistant",
          text: `Hello! I am your **MediLink Medicine Information Assistant**.\n\nI can help you understand educational details regarding **${medicine.name}** (Generic: *${medicine.genericName || "N/A"}*), including its composition, category, and documented precautions.\n\n*Please note: I cannot diagnose conditions, recommend personalized dosages, or prescribe medicines.*`,
          source: `MediLink Verified Catalog (${medicine.name})`,
          timestamp: new Date(),
        },
      ]);
      setInputValue("");
    }
  }, [isOpen, medicine]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen || !medicine) return null;

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await aiService.chat({
        message: query,
        medicineId: medicine.id,
      });

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: result.message,
        source: result.source,
        blockedCategory: result.blockedCategory,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (result.suggestedQuestions && result.suggestedQuestions.length > 0) {
        setSuggestedQuestions(result.suggestedQuestions);
      }
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text:
          err.response?.data?.message ||
          "The AI assistant is temporarily unavailable. Please refer to the verified medicine specifications on this page or consult a pharmacist.",
        source: "MediLink System",
        blockedCategory: "ERROR",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="medicine-ai-backdrop" onClick={onClose}>
      <div
        className="medicine-ai-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assistant-title"
      >
        {/* Header */}
        <div className="medicine-ai-header">
          <div className="medicine-ai-header-left">
            <div className="medicine-ai-header-icon">
              <Sparkles size={22} />
            </div>
            <div className="medicine-ai-header-info">
              <h3 id="ai-assistant-title">MediLink Medicine AI</h3>
              <p>
                <span>{medicine.name}</span>
                <span className="medicine-ai-badge">
                  {medicine.prescriptionRequired ? "Rx Required" : "OTC"}
                </span>
              </p>
            </div>
          </div>
          <button
            className="medicine-ai-close-btn"
            onClick={onClose}
            aria-label="Close Assistant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="medicine-ai-safety-banner">
          <Info size={16} />
          <span>
            <strong>Educational Purpose:</strong> This assistant provides verified medicine info only. It does not replace clinical consultation, diagnosis, or prescription.
          </span>
        </div>

        {/* Messages Stream */}
        <div className="medicine-ai-messages">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const isEmergency = msg.blockedCategory === "EMERGENCY";
            const isGuardrail = Boolean(msg.blockedCategory && !isEmergency);

            return (
              <div
                key={msg.id}
                className={`medicine-ai-msg ${isUser ? "user" : "assistant"} ${
                  isEmergency ? "emergency-alert" : ""
                } ${isGuardrail ? "guardrail-alert" : ""}`}
              >
                <div className="medicine-ai-msg-avatar">
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className="medicine-ai-msg-body">
                  {msg.blockedCategory && (
                    <div className="medicine-ai-guardrail-badge">
                      <ShieldAlert size={13} />
                      {msg.blockedCategory === "EMERGENCY"
                        ? "Emergency Escalation"
                        : "Clinical Safety Policy"}
                    </div>
                  )}

                  <div style={{ whiteSpace: "pre-line" }}>
                    {msg.text}
                  </div>

                  {msg.source && (
                    <div className="medicine-ai-source-tag">
                      <CheckCircle2 size={12} />
                      Source: {msg.source}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="medicine-ai-msg assistant">
              <div className="medicine-ai-msg-avatar">
                <Bot size={16} />
              </div>
              <div className="medicine-ai-msg-body">
                <div className="medicine-ai-typing">
                  <span className="medicine-ai-dot"></span>
                  <span className="medicine-ai-dot"></span>
                  <span className="medicine-ai-dot"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        {suggestedQuestions.length > 0 && !isLoading && (
          <div className="medicine-ai-suggestions">
            {suggestedQuestions.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="medicine-ai-chip"
                onClick={() => handleSendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form className="medicine-ai-input-form" onSubmit={handleFormSubmit}>
          <input
            type="text"
            className="medicine-ai-input"
            placeholder={`Ask about ${medicine.name}'s generic composition, uses, precautions...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            maxLength={1000}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="medicine-ai-send-btn"
            disabled={isLoading || !inputValue.trim()}
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
