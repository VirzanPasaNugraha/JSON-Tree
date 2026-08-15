import { useCallback, useEffect, useMemo, useState } from 'react'
import { Background, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import { Braces, Brackets, CircleDot, Gauge, Plus } from 'lucide-react'
import { countNodes, matchesQuery, previewValue, type JsonTreeNode } from '../utils/json'

interface GraphNodeData extends Record<string, unknown> { treeNode: JsonTreeNode; matched: boolean; collapsed: boolean; onToggle: (id: string) => void; onCopy: (path: string) => void }
type GraphNode = Node<GraphNodeData, 'json'>

function JsonGraphNode({ data }: NodeProps<GraphNode>) {
  const { treeNode, matched, collapsed, onToggle, onCopy } = data
  const isContainer = treeNode.children.length > 0
  const Icon = treeNode.kind === 'array' ? Brackets : treeNode.kind === 'object' || treeNode.kind === 'root' ? Braces : CircleDot
  return <button className={`json-node ${treeNode.kind} ${matched ? 'matched' : ''}`} onClick={() => isContainer && onToggle(treeNode.id)} onDoubleClick={() => onCopy(treeNode.path)} title={isContainer ? 'Klik untuk expand/collapse · klik ganda untuk salin path' : 'Klik ganda untuk salin path'}><Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: 'none' }} /><span className="node-icon"><Icon size={14} /></span><span className="node-copy"><b>{treeNode.key}</b><small>{previewValue(treeNode)}</small></span>{isContainer && <span className="node-toggle">{collapsed ? '+' : '−'}</span>}<Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: 'none' }} /></button>
}

const nodeTypes = { json: JsonGraphNode }
const PERFORMANCE_THRESHOLD = 180
const INITIAL_RENDER_LIMIT = 420
const RENDER_STEP = 300

function createInitialCollapsed(root: JsonTreeNode, total: number): Set<string> {
  if (total <= PERFORMANCE_THRESHOLD) return new Set()
  const collapsed = new Set<string>()
  const visit = (node: JsonTreeNode) => {
    if (node.depth >= 2 && node.children.length > 0) collapsed.add(node.id)
    node.children.forEach(visit)
  }
  visit(root)
  return collapsed
}

function collectMatchingBranches(root: JsonTreeNode, query: string): Set<string> {
  const branches = new Set<string>()
  if (!query.trim()) return branches
  const visit = (node: JsonTreeNode): boolean => {
    const childMatches = node.children.map(visit).some(Boolean)
    const currentMatches = matchesQuery(node, query)
    if (currentMatches || childMatches) branches.add(node.id)
    return currentMatches || childMatches
  }
  visit(root)
  return branches
}

function layoutTree(root: JsonTreeNode, collapsed: Set<string>, query: string, nodeLimit: number, matchingBranches: Set<string>, onToggle: (id: string) => void, onCopy: (path: string) => void): { nodes: GraphNode[]; edges: Edge[] } {
  const nodes: GraphNode[] = []
  const edges: Edge[] = []
  const rowByDepth = new Map<number, number>()
  const addNode = (treeNode: JsonTreeNode, parentId?: string) => {
    if (nodes.length >= nodeLimit) return
    const row = rowByDepth.get(treeNode.depth) ?? 0
    rowByDepth.set(treeNode.depth, row + 1)
    const isCollapsed = !query.trim() && collapsed.has(treeNode.id)
    nodes.push({ id: treeNode.id, type: 'json', position: { x: treeNode.depth * 250 + 36, y: row * 102 + 34 }, data: { treeNode, matched: matchesQuery(treeNode, query), collapsed: isCollapsed, onToggle, onCopy } })
    if (parentId) {
      const highlighted = matchesQuery(treeNode, query)
      const stroke = highlighted ? '#6d5efc' : '#8797bd'
      edges.push({ id: `${parentId}-${treeNode.id}`, source: parentId, target: treeNode.id, type: 'smoothstep', animated: highlighted, markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 15, height: 15 }, style: { stroke, strokeWidth: highlighted ? 2.2 : 1.65 } })
    }
    const shouldExpandForSearch = query.trim() && matchingBranches.has(treeNode.id)
    const visibleChildren = query.trim() ? treeNode.children.filter((child) => matchingBranches.has(child.id)) : treeNode.children
    if (!isCollapsed || shouldExpandForSearch) visibleChildren.forEach((child) => addNode(child, treeNode.id))
  }
  addNode(root)
  return { nodes, edges }
}

export default function TreeGraph({ root, query, onCopied }: { root: JsonTreeNode; query: string; onCopied: (path: string) => void }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [nodeLimit, setNodeLimit] = useState(INITIAL_RENDER_LIMIT)
  const totalNodes = useMemo(() => countNodes(root), [root])
  const isLargeStructure = totalNodes > PERFORMANCE_THRESHOLD
  useEffect(() => { setCollapsed(createInitialCollapsed(root, totalNodes)); setNodeLimit(INITIAL_RENDER_LIMIT) }, [root, totalNodes])
  const toggle = useCallback((id: string) => setCollapsed((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next }), [])
  const copy = useCallback((path: string) => { void navigator.clipboard?.writeText(path); onCopied(path) }, [onCopied])
  const matchingBranches = useMemo(() => collectMatchingBranches(root, query), [root, query])
  const { nodes, edges } = useMemo(() => layoutTree(root, collapsed, query, isLargeStructure ? nodeLimit : Number.POSITIVE_INFINITY, matchingBranches, toggle, copy), [root, collapsed, query, isLargeStructure, nodeLimit, matchingBranches, toggle, copy])
  const limited = isLargeStructure && nodes.length >= nodeLimit && nodes.length < totalNodes
  return <div className="tree-graph"><ReactFlow<GraphNode, Edge> nodes={nodes} edges={edges} nodeTypes={nodeTypes} minZoom={0.25} maxZoom={1.6} fitView fitViewOptions={{ padding: 0.3 }}><Background gap={22} size={1} color="#dfe4f1" /><Controls showInteractive={false} /><MiniMap nodeColor={(node: GraphNode) => node.data.treeNode.kind === 'array' ? '#9973f3' : node.data.treeNode.kind === 'object' || node.data.treeNode.kind === 'root' ? '#4c73ff' : '#20b989'} maskColor="rgba(19, 26, 52, 0.12)" /></ReactFlow>{isLargeStructure && <div className="performance-overlay"><Gauge size={14} /><span><b>Mode performa aktif</b> · {nodes.length.toLocaleString('id-ID')} dari {totalNodes.toLocaleString('id-ID')} node dirender</span>{limited && <button onClick={() => setNodeLimit((current) => Math.min(current + RENDER_STEP, totalNodes))}><Plus size={13} /> Tambah {RENDER_STEP} node</button>}</div>}</div>
}
