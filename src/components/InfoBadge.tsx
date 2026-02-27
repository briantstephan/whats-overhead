type InfoBadgeProps = {
  label: string;
  value: string;
};

const InfoBadge = ({ label, value }: InfoBadgeProps) => (
  <div className="info-badge">
    <span className="info-label">{label}</span>
    <span className="info-value">{value}</span>
  </div>
);

export default InfoBadge;
