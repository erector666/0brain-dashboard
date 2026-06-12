import { motion, useReducedMotion } from "motion/react";

const nodes = [
  [8, 18], [22, 12], [37, 24], [54, 10], [73, 18], [88, 9],
  [12, 48], [31, 42], [47, 56], [66, 46], [83, 58],
  [19, 78], [41, 84], [59, 76], [77, 86], [93, 72]
];

const links = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [0, 6], [2, 7], [7, 8], [8, 9], [9, 10],
  [6, 11], [11, 12], [12, 13], [13, 14], [10, 15],
  [7, 12], [8, 13], [9, 14]
];

export function NeuralBackdrop() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="neural-backdrop" aria-hidden="true">
      <div className="neural-grid" />
      <svg className="neural-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {links.map(([a, b], index) => {
          const start = nodes[a];
          const end = nodes[b];

          return (
            <motion.line
              key={`${a}-${b}`}
              x1={start[0]}
              y1={start[1]}
              x2={end[0]}
              y2={end[1]}
              className="neural-line"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: reducedMotion ? 0.08 : [0.04, 0.16, 0.04]
              }}
              transition={{
                duration: reducedMotion ? 0 : 6 + index * 0.15,
                repeat: reducedMotion ? 0 : Infinity,
                delay: index * 0.08
              }}
            />
          );
        })}

        {nodes.map(([x, y], index) => (
          <motion.circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="0.45"
            className="neural-node"
            animate={reducedMotion ? undefined : {
              opacity: [0.25, 0.9, 0.25],
              scale: [1, 1.8, 1]
            }}
            transition={{
              duration: 4 + (index % 4),
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
        ))}
      </svg>
      <div className="neural-orb neural-orb-one" />
      <div className="neural-orb neural-orb-two" />
    </div>
  );
}
