export default function BlurText({ text, delayStep = 55, startDelay = 80 }) {
  const words = String(text || '').split(' ');
  return (
    <>
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className="lx-blur-word"
          style={{
            animationDelay: `${startDelay + idx * delayStep}ms`,
            marginRight: idx < words.length - 1 ? '0.26em' : 0,
          }}
        >
          {word}
        </span>
      ))}
    </>
  );
}
