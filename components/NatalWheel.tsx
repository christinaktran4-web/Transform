import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Path } from 'react-native-svg';
import type { NatalChart, PlanetData } from '../lib/chartTypes';
import { ZODIAC_SIGNS, ZODIAC_SYMBOLS, PLANET_ORDER } from '../lib/natalEngine';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const SIZE       = 320;
const CX         = SIZE / 2;
const CY         = SIZE / 2;
const R_OUTER    = 148;   // zodiac ring outer edge
const R_ZODIAC   = 124;   // zodiac ring inner edge / house ring outer
const R_HOUSE    = 104;   // house lines reach inward to here
const R_PLANET   = 88;    // planet glyph orbit
const R_CENTER   = 38;    // blank center hub
const R_ASPECT   = 54;    // aspect lines drawn within this radius

// ---------------------------------------------------------------------------
// Zodiac sign metadata
// ---------------------------------------------------------------------------

const ZODIAC_ELEMENTS = [
  'Fire','Earth','Air','Water',
  'Fire','Earth','Air','Water',
  'Fire','Earth','Air','Water',
] as const;

const ELEMENT_FILL: Record<string, string> = {
  Fire:  'rgba(255, 100, 50,  0.18)',
  Earth: 'rgba( 90, 180, 90,  0.18)',
  Air:   'rgba(150, 100, 220, 0.18)',
  Water: 'rgba( 50, 130, 220, 0.18)',
};
const ELEMENT_STROKE: Record<string, string> = {
  Fire:  'rgba(255, 120, 60,  0.55)',
  Earth: 'rgba(100, 200, 100, 0.50)',
  Air:   'rgba(170, 120, 240, 0.55)',
  Water: 'rgba( 80, 160, 240, 0.50)',
};

// ---------------------------------------------------------------------------
// Planet glyph symbols
// ---------------------------------------------------------------------------

const PLANET_GLYPH: Record<string, string> = {
  Sun:       '☉',
  Moon:      '☽',
  Mercury:   '☿',
  Venus:     '♀',
  Mars:      '♂',
  Jupiter:   '♃',
  Saturn:    '♄',
  Uranus:    '♅',
  Neptune:   '♆',
  Pluto:     '♇',
  NorthNode: '☊',
  Chiron:    '⚷',
};

const ASPECT_COLORS: Record<string, string> = {
  conjunction: 'rgba(255,200,100,0.35)',
  sextile:     'rgba(100,220,150,0.30)',
  square:      'rgba(255,100,100,0.30)',
  trine:       'rgba(100,180,255,0.30)',
  opposition:  'rgba(220,100,220,0.30)',
  quincunx:    'rgba(200,150,100,0.25)',
};

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

function svgAngle(lon: number, asc: number): number {
  // SVG angle (degrees): 0 = right, increases CW in y-down coords
  // ASC placed at 180° (9 o'clock, left), zodiac goes CCW visually
  return ((180 + asc - lon) % 360 + 360) % 360;
}

function polar(angleDeg: number, r: number): [number, number] {
  const rad = angleDeg * (Math.PI / 180);
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function lonToXY(lon: number, asc: number, r: number): [number, number] {
  return polar(svgAngle(lon, asc), r);
}

// SVG arc path for an annular sector (CCW visually = sweep 0)
function annularSector(
  θ1: number, θ2: number,
  rOuter: number, rInner: number,
): string {
  // θ1 > θ2 (CCW arc = decreasing angle)
  const [ox1, oy1] = polar(θ1, rOuter);
  const [ox2, oy2] = polar(θ2, rOuter);
  const [ix1, iy1] = polar(θ1, rInner);
  const [ix2, iy2] = polar(θ2, rInner);
  const large = Math.abs(θ1 - θ2) > 180 ? 1 : 0;
  return [
    `M ${ox1} ${oy1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 0 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${rInner} ${rInner} 0 ${large} 1 ${ix1} ${iy1}`,
    'Z',
  ].join(' ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  chart: NatalChart;
  size?: number;
}

export default function NatalWheel({ chart, size = SIZE }: Props) {
  const scale = size / SIZE;
  const asc = chart.ascendant;

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background */}
        <Circle cx={CX} cy={CY} r={R_OUTER} fill="rgba(10,10,20,0.95)" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

        {/* Zodiac ring: 12 colored sectors + sign symbols */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const lonStart = i * 30;
          const lonEnd   = (i + 1) * 30;
          const θ1 = svgAngle(lonStart, asc);
          const θ2 = svgAngle(lonEnd,   asc);
          const el = ZODIAC_ELEMENTS[i];
          const fill   = ELEMENT_FILL[el];
          const stroke = ELEMENT_STROKE[el];
          const midLon = lonStart + 15;
          const [tx, ty] = lonToXY(midLon, asc, (R_ZODIAC + R_OUTER) / 2);
          const sym = ZODIAC_SYMBOLS[i];
          return (
            <G key={sign}>
              <Path d={annularSector(θ1, θ2, R_OUTER, R_ZODIAC)} fill={fill} stroke={stroke} strokeWidth={0.5} />
              <SvgText
                x={tx} y={ty}
                textAnchor="middle" alignmentBaseline="middle"
                fontSize={10} fill={stroke}
              >{sym}</SvgText>
            </G>
          );
        })}

        {/* Zodiac ring inner border */}
        <Circle cx={CX} cy={CY} r={R_ZODIAC} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />

        {/* House cusp lines */}
        {chart.houses.map((cusp, i) => {
          const [x1, y1] = lonToXY(cusp.lon, asc, R_ZODIAC);
          const [x2, y2] = lonToXY(cusp.lon, asc, R_CENTER);
          const isAxis = i === 0 || i === 3 || i === 6 || i === 9;
          return (
            <Line
              key={`cusp-${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isAxis ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)'}
              strokeWidth={isAxis ? 1.2 : 0.6}
            />
          );
        })}

        {/* ASC/DSC and MC/IC axis labels */}
        {chart.hasTime && chart.hasLocation && (() => {
          const [ax, ay] = lonToXY(asc, asc, R_ZODIAC - 10);
          const [mx, my] = lonToXY(chart.midheaven, asc, R_ZODIAC - 10);
          const [dx, dy] = lonToXY(((asc + 180) % 360), asc, R_ZODIAC - 10);
          const [icx, icy] = lonToXY(((chart.midheaven + 180) % 360), asc, R_ZODIAC - 10);
          return (
            <G>
              <SvgText x={ax} y={ay} textAnchor="middle" alignmentBaseline="middle" fontSize={7} fill="rgba(255,255,255,0.7)" fontWeight="600">AC</SvgText>
              <SvgText x={dx} y={dy} textAnchor="middle" alignmentBaseline="middle" fontSize={7} fill="rgba(255,255,255,0.5)">DC</SvgText>
              <SvgText x={mx} y={my} textAnchor="middle" alignmentBaseline="middle" fontSize={7} fill="rgba(255,255,255,0.7)" fontWeight="600">MC</SvgText>
              <SvgText x={icx} y={icy} textAnchor="middle" alignmentBaseline="middle" fontSize={7} fill="rgba(255,255,255,0.5)">IC</SvgText>
            </G>
          );
        })()}

        {/* Aspect lines (drawn inside R_ASPECT) */}
        {chart.aspects.slice(0, 20).map((asp, i) => {
          const p1 = chart.planets[asp.planet1];
          const p2 = chart.planets[asp.planet2];
          if (!p1 || !p2) return null;
          const [x1, y1] = lonToXY(p1.lon, asc, R_ASPECT);
          const [x2, y2] = lonToXY(p2.lon, asc, R_ASPECT);
          const color = ASPECT_COLORS[asp.type] ?? 'rgba(200,200,200,0.2)';
          return (
            <Line key={`asp-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.8} />
          );
        })}

        {/* Center hub */}
        <Circle cx={CX} cy={CY} r={R_CENTER} fill="rgba(8,8,16,0.97)" stroke="rgba(255,255,255,0.10)" strokeWidth={0.5} />

        {/* House number labels (small) */}
        {chart.houses.map((cusp, i) => {
          const next = chart.houses[(i + 1) % 12];
          const midLon = cusp.lon + ((((next.lon - cusp.lon) % 360) + 360) % 360) / 2;
          const [tx, ty] = lonToXY(midLon, asc, (R_HOUSE + R_CENTER) / 2 + 4);
          return (
            <SvgText key={`hnum-${i}`} x={tx} y={ty} textAnchor="middle" alignmentBaseline="middle"
              fontSize={7} fill="rgba(255,255,255,0.25)">{i + 1}</SvgText>
          );
        })}

        {/* Planet glyphs */}
        {PLANET_ORDER.map((name) => {
          const pd = chart.planets[name];
          if (!pd) return null;
          const [x, y] = lonToXY(pd.lon, asc, R_PLANET);
          const glyph = PLANET_GLYPH[name] ?? '·';
          const retro = pd.retrograde ? 'Rx' : '';
          return (
            <G key={name}>
              <SvgText x={x} y={y} textAnchor="middle" alignmentBaseline="middle"
                fontSize={11} fill="rgba(220,210,255,0.92)">{glyph}</SvgText>
              {retro !== '' && (
                <SvgText x={x + 8} y={y - 5} textAnchor="middle" alignmentBaseline="middle"
                  fontSize={5} fill="rgba(220,160,100,0.8)">{retro}</SvgText>
              )}
            </G>
          );
        })}

        {/* Chart center: show ASC sign if available */}
        {chart.hasTime && chart.hasLocation && (() => {
          const ascSign = chart.houses[0]?.sign ?? '';
          return (
            <SvgText x={CX} y={CY - 6} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.5)">{ascSign}</SvgText>
          );
        })()}
        <SvgText x={CX} y={CY + 8} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.25)">Placidus</SvgText>
      </Svg>
    </View>
  );
}
