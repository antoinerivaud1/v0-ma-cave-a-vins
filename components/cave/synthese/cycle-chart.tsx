"use client"

/**
 * CycleChart — courbe en cloche SVG fidèle au prototype (components.jsx l.211)
 * Affiche la courbe de vie d'un vin avec la position courante.
 */

import { useEffect, useRef, useState } from "react"
import type { UnifiedApogee } from "@/lib/apogee-unified"

interface CycleChartProps {
  unified: UnifiedApogee
  millesime: number
  /** Couleur principale (trait + aire) — ex: "var(--rouge)" */
  accent?: string
  /** Couleur du texte et des repères */
  fg?: string
}

export function CycleChart({
  unified,
  millesime,
  accent = "var(--rouge)",
  fg = "var(--ink)",
}: CycleChartProps) {
  const W = 320
  const H = 150
  const PAD = 16

  const now = new Date().getFullYear()
  const end = unified.end ?? millesime + 10
  const start = unified.start ?? millesime + 1

  // peakPct : centre de la fenêtre d'apogée sur [millesime, end]
  const lifespan = end - millesime
  const peakYear = Math.round((start + end) / 2)
  const peakPct = lifespan > 0 ? Math.max(0, Math.min(100, ((peakYear - millesime) / lifespan) * 100)) : 50
  const cyclePct = lifespan > 0 ? Math.max(0, Math.min(100, ((now - millesime) / lifespan) * 100)) : 0

  const xOf = (p: number) => PAD + (W - PAD * 2) * (p / 100)
  const yPeak = 18
  const yBase = H - 32

  const xPk = xOf(peakPct)
  const x0 = PAD
  const x1 = W - PAD

  const path = [
    `M ${x0} ${yBase}`,
    `C ${x0 + (xPk - x0) * 0.35} ${yBase - 2} ${xPk - (xPk - x0) * 0.45} ${yPeak + 4} ${xPk} ${yPeak}`,
    `C ${xPk + (x1 - xPk) * 0.45} ${yPeak + 4} ${x1 - (x1 - xPk) * 0.35} ${yBase - 2} ${x1} ${yBase}`,
  ].join(" ")

  const pathRef = useRef<SVGPathElement>(null)
  const [curPt, setCurPt] = useState({ x: xOf(cyclePct), y: yBase })

  useEffect(() => {
    if (!pathRef.current) return
    const svgPath = pathRef.current
    const len = svgPath.getTotalLength()
    const target = xOf(cyclePct)
    let lo = 0
    let hi = len
    let mid = len / 2
    for (let i = 0; i < 22; i++) {
      mid = (lo + hi) / 2
      const pt = svgPath.getPointAtLength(mid)
      if (pt.x < target) lo = mid
      else hi = mid
    }
    const pt = svgPath.getPointAtLength(mid)
    setCurPt({ x: pt.x, y: pt.y })
  }, [cyclePct, peakPct])

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        aria-label="Courbe de cycle du vin"
      >
        {/* Baseline */}
        <line
          x1={PAD}
          y1={yBase}
          x2={W - PAD}
          y2={yBase}
          stroke={fg}
          strokeWidth="1"
          opacity="0.18"
        />

        {/* Aire sous courbe */}
        <path
          d={`${path} L ${x1} ${yBase} L ${x0} ${yBase} Z`}
          fill={accent}
          opacity="0.18"
        />

        {/* Courbe */}
        <path
          ref={pathRef}
          d={path}
          fill="none"
          stroke={accent}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Ligne verticale position courante */}
        <line
          x1={curPt.x}
          y1={yBase}
          x2={curPt.x}
          y2={curPt.y}
          stroke={fg}
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.7"
        />

        {/* Point position courante */}
        <circle cx={curPt.x} cy={curPt.y} r="4" fill={fg} />

        {/* Label "aujourd'hui" */}
        <text
          x={curPt.x}
          y={yBase + 22}
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 12,
            fill: fg,
          }}
        >
          {unified.estimated ? "estimé" : "aujourd'hui"}
        </text>

        {/* Marqueur pic */}
        <circle
          cx={xOf(peakPct)}
          cy={yPeak}
          r="6"
          fill="var(--bg, white)"
          stroke={fg}
          strokeWidth="1.8"
        />
        <text
          x={xOf(peakPct)}
          y={yPeak - 10}
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 13,
            fontWeight: 500,
            fill: fg,
          }}
        >
          {`★ pic ${peakYear}`}
        </text>

        {/* Ticks axe */}
        <text
          x={x0}
          y={H - 4}
          textAnchor="start"
          style={{ fontFamily: "var(--font-sans)", fontSize: 9, fill: fg, opacity: 0.6 }}
        >
          {millesime}
        </text>
        <text
          x={x1}
          y={H - 4}
          textAnchor="end"
          style={{ fontFamily: "var(--font-sans)", fontSize: 9, fill: fg, opacity: 0.6 }}
        >
          {end}
        </text>
      </svg>

      {/* Marqueur "estimé" en Cormorant italique si estimated */}
      {unified.estimated && (
        <p
          className="text-center text-xs italic mt-1"
          style={{
            fontFamily: "var(--font-display)",
            color: fg,
            opacity: 0.6,
          }}
        >
          Estimation heuristique — analysez ce vin pour affiner
        </p>
      )}
    </div>
  )
}
