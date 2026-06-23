"use client";

interface ConfidenceBadgeProps {
  confidence: number;
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  if (confidence >= 70) return null;

  return (
    <div className="warning-msg">
      <span>
        ⚠️ A localização deste estabelecimento pode não ser precisa (confiança:{" "}
        {confidence.toFixed(0)}%).
      </span>
    </div>
  );
}
