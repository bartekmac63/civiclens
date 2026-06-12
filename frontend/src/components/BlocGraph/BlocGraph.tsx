import { useEffect, useRef, useState } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { select } from 'd3-selection';
import type { APIBlocEdge, APIBlocNode } from '@/api/types';
import { isPartyName } from '@/lib/party';
import { partyColor } from '@/tokens';
import { edgeOpacity, graphAriaLabel, nodeRadius } from './graphMath';

export interface BlocGraphProps {
  nodes: APIBlocNode[];
  /** Pre-filtered edges (threshold + visibility applied by the page). */
  edges: APIBlocEdge[];
  threshold: number;
  selectedId?: number | null;
  onSelect?: (id: number | null) => void;
  height?: number;
}

interface SimNode extends SimulationNodeDatum {
  id: number;
  label: string;
  club: string | null;
  score: number | null;
}

type SimLink = SimulationLinkDatum<SimNode> & { similarity: number };

interface TooltipState {
  x: number;
  y: number;
  label: string;
  sublabel: string;
}

function nodeFill(club: string | null): string {
  // Party branding from the token source (§2.3); neutral token otherwise.
  if (isPartyName(club ?? '')) return partyColor[club as keyof typeof partyColor].bg;
  return 'var(--color-abstain)';
}

/**
 * §3.3 — D3 force-directed graph of co-voting MPs. This component is the
 * sanctioned D3 carve-out (§6): it sets inline attributes/styles and uses the
 * single custom class `civic-graph`. Simulation: alphaDecay 0.05 to prevent
 * infinite ticking; paused while the tab is hidden (visibilitychange).
 */
export function BlocGraph({
  nodes,
  edges,
  threshold,
  selectedId = null,
  onSelect,
  height = 480,
}: BlocGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = svgEl.clientWidth || 800;
    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      label: `${n.firstName} ${n.lastName}`,
      club: n.club,
      score: n.defectionScore,
    }));
    const byId = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks: SimLink[] = edges
      .filter((e) => byId.has(e.a) && byId.has(e.b))
      .map((e) => ({ source: e.a, target: e.b, similarity: e.similarity }));

    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const linkSel = svg
      .append('g')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', 'var(--color-border-subtle)')
      .attr('stroke-opacity', (d) => edgeOpacity(d.similarity));

    const nodeSel = svg
      .append('g')
      .selectAll('circle')
      .data(simNodes)
      .join('circle')
      .attr('r', (d) => nodeRadius(d.score))
      .attr('fill', (d) => nodeFill(d.club))
      .attr('fill-opacity', 0.8)
      .attr('data-mp-id', (d) => d.id)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => onSelectRef.current?.(d.id))
      .on('mousemove', (event: MouseEvent, d) => {
        const rect = svgEl.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left + 12,
          y: event.clientY - rect.top + 12,
          label: d.label,
          sublabel: `${d.club ?? 'No club'} · defection ${
            d.score === null ? 'n/a' : d.score.toFixed(2)
          }`,
        });
      })
      .on('mouseleave', () => setTooltip(null));

    const simulation = forceSimulation(simNodes)
      .alphaDecay(0.05)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(40)
          .strength((d) => d.similarity * 0.5),
      )
      .force('charge', forceManyBody().strength(-30))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide<SimNode>().radius((d) => nodeRadius(d.score) + 1))
      .on('tick', () => {
        linkSel
          .attr('x1', (d) => (d.source as SimNode).x ?? 0)
          .attr('y1', (d) => (d.source as SimNode).y ?? 0)
          .attr('x2', (d) => (d.target as SimNode).x ?? 0)
          .attr('y2', (d) => (d.target as SimNode).y ?? 0);
        nodeSel
          .attr('cx', (d) => d.x ?? 0)
          .attr('cy', (d) => d.y ?? 0);
      });

    // §3.3 — pause the simulation when the tab is not visible.
    const onVisibility = () => {
      if (document.hidden) simulation.stop();
      else simulation.restart();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      simulation.stop();
    };
  }, [nodes, edges, height]);

  // Selected-node accent stroke (§3.3) without restarting the simulation.
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    select(svgEl)
      .selectAll<SVGCircleElement, SimNode>('circle')
      .attr('stroke', (d) =>
        d.id === selectedId ? 'var(--color-accent)' : 'none',
      )
      .attr('stroke-width', (d) => (d.id === selectedId ? 2 : 0));
  }, [selectedId, nodes, edges]);

  return (
    <div className="civic-graph relative w-full">
      <svg
        ref={svgRef}
        role="img"
        aria-label={graphAriaLabel(nodes.length, edges.length, threshold)}
        className="w-full rounded-md border border-border-subtle bg-bg-primary"
        style={{ height }}
        onClick={(e) => {
          if (e.target === svgRef.current) onSelect?.(null);
        }}
      />
      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 rounded-sm border border-border bg-bg-elevated px-2 py-1 text-sm text-text-primary shadow-md"
          style={{ left: tooltip.x, top: tooltip.y, maxWidth: 240 }}
        >
          <span className="block">{tooltip.label}</span>
          <span className="block text-xs text-text-secondary">
            {tooltip.sublabel}
          </span>
        </div>
      )}
    </div>
  );
}

export default BlocGraph;
