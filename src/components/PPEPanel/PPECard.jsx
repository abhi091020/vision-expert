import helmetImg from "../../assets/helmet.png";
import handglovesImg from "../../assets/handgloves.png";
import gogglesImg from "../../assets/googles.png";
import armSleevesImg from "../../assets/armsleeces.png";
import shoesImg from "../../assets/shoes.png";
import vestImg from "../../assets/vest.png";

const IMAGES = {
  helmet: helmetImg,
  goggles: gogglesImg,
  arm_sleeves: armSleevesImg,
  hand_gloves: handglovesImg,
  vest: vestImg,
  shoes: shoesImg,
};

export default function PPECard({ item, isViolation }) {
  const bgClass = isViolation
    ? "bg-red-100 border-red-300"
    : "bg-green-50 border-green-100";
  const labelClass = isViolation
    ? "text-red-500 font-bold animate-pulse"
    : "text-gray-600";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border-2
        transition-all duration-500 p-1 overflow-hidden ${bgClass}
        ${isViolation ? "shadow-md shadow-red-200" : ""}`}
    >
      {/* Image wrapper */}
      <div className="flex items-center justify-center flex-1 w-full min-h-0">
        <img
          src={IMAGES[item.icon]}
          alt={item.label}
          className={`object-contain w-full h-full ${isViolation ? "ppe-violation-blink" : ""}`}
          style={{ maxHeight: "5vh", maxWidth: "5vw" }}
        />
      </div>

      {/* Label */}
      <span
        className={`font-semibold tracking-wide text-center leading-tight flex-shrink-0 ${labelClass}`}
        style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.9rem)" }}
      >
        {item.label}
      </span>
    </div>
  );
}
