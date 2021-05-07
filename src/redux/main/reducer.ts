import { Node, GroupKind, Character, Quantifier } from "@/types"
import { remove, insert, group, character, quantifier } from "@/parser/utils"
type GuideConfig = {
  visible: boolean
  title: string
  content: JSX.Element | string
}
export type InitialStateType = {
  activeId: string
  nodes: Node[]
  selectedIds: string[]
  undoStack: Node[][]
  redoStack: Node[][]
  editorCollapsed: Boolean
  guiderConfig: GuideConfig
}

export const initialState: InitialStateType = {
  activeId: "",
  nodes: [],
  selectedIds: [],
  undoStack: [],
  redoStack: [],
  editorCollapsed: false,
  guiderConfig: { visible: false, title: "", content: "" },
}

export enum ActionTypes {
  SET_ACTIVE_CHART,
  INSERT,
  REMOVE,
  UPDATE_GROUP,
  SET_NODES,
  UNDO,
  REDO,
  SELECT_NODES,
  UPDATE_CHARACTER,
  SET_EDITOR_COLLAPSED,
  UPDATE_GUIDE_CONFIG,
  UPDATE_QUANTIFIER,
}

export type Action =
  | {
      type: ActionTypes.SET_ACTIVE_CHART
      payload: { id: string; nodes: Node[]; selectedIds: string[] }
    }
  | {
      type: ActionTypes.INSERT
      payload: { direction: "prev" | "next" | "branch" }
    }
  | { type: ActionTypes.REMOVE }
  | {
      type: ActionTypes.UPDATE_GROUP
      payload: { groupType: GroupKind | "nonGroup"; groupName: string }
    }
  | { type: ActionTypes.SET_NODES; payload: { nodes: Node[] } }
  | { type: ActionTypes.UNDO }
  | { type: ActionTypes.REDO }
  | {
      type: ActionTypes.SELECT_NODES
      payload: { selected: string[] | string }
    }
  | {
      type: ActionTypes.UPDATE_CHARACTER
      payload: { val: Character }
    }
  | { type: ActionTypes.SET_EDITOR_COLLAPSED; payload: { collapsed: boolean } }
  | { type: ActionTypes.UPDATE_GUIDE_CONFIG; payload: GuideConfig }
  | { type: ActionTypes.UPDATE_QUANTIFIER; payload: Quantifier | null }

const setNodes = (
  state: InitialStateType,
  nextNodes: Node[],
  attachState: Partial<InitialStateType> = {}
) => {
  const { undoStack, nodes } = state
  undoStack.push(nodes)
  return {
    ...state,
    ...attachState,
    nodes: nextNodes,
    undoStack,
  }
}

export const reducer = (state: InitialStateType, action: Action) => {
  switch (action.type) {
    case ActionTypes.SET_ACTIVE_CHART: {
      const { id, nodes, selectedIds } = action.payload
      return { ...state, activeId: id, nodes, selectedIds }
    }
    case ActionTypes.INSERT: {
      const { nodes, selectedIds } = state
      const { direction } = action.payload
      const nextNodes = insert(nodes, selectedIds, direction)
      return setNodes(state, nextNodes)
    }
    case ActionTypes.REMOVE: {
      const { nodes, selectedIds } = state
      const nextNodes = remove(nodes, selectedIds)
      return setNodes(state, nextNodes, { selectedIds: [] })
    }
    case ActionTypes.UPDATE_GROUP: {
      const { nodes, selectedIds } = state
      const { groupType, groupName } = action.payload
      const { nextNodes, nextSelectedIds } = group(
        nodes,
        selectedIds,
        groupType,
        groupName
      )
      return setNodes(state, nextNodes, { selectedIds: nextSelectedIds })
    }
    case ActionTypes.SET_NODES: {
      const { undoStack, nodes } = state
      const { nodes: nextNodes } = action.payload
      undoStack.push(nodes)
      return setNodes(state, nextNodes, { undoStack })
    }
    case ActionTypes.UNDO: {
      const { undoStack, redoStack, nodes } = state
      if (undoStack.length > 0) {
        const nextNodes = undoStack.pop()
        redoStack.push(nodes)
        return {
          ...state,
          nodes: nextNodes as Node[],
          undoStack,
          redoStack,
        }
      }
      return state
    }
    case ActionTypes.REDO: {
      const { undoStack, redoStack, nodes } = state
      if (redoStack.length > 0) {
        const nextNodes = redoStack.pop()
        undoStack.push(nodes)
        return {
          ...state,
          nodes: nextNodes as Node[],
          undoStack,
          redoStack,
        }
      }
      return state
    }
    case ActionTypes.SELECT_NODES: {
      const { selectedIds } = state
      let { selected: nextSelected } = action.payload

      if (
        !Array.isArray(nextSelected) &&
        selectedIds.length === 1 &&
        selectedIds[0] === nextSelected
      ) {
        return {
          ...state,
          selectedIds: [],
        }
      }
      if (!Array.isArray(nextSelected)) {
        nextSelected = [nextSelected]
      }
      return {
        ...state,
        selectedIds: nextSelected,
      }
    }
    case ActionTypes.UPDATE_CHARACTER: {
      const { nodes, selectedIds } = state
      const { val } = action.payload
      const id = selectedIds[0]
      const nextNodes = character(nodes, id, val)
      return setNodes(state, nextNodes)
    }
    case ActionTypes.SET_EDITOR_COLLAPSED: {
      const { collapsed } = action.payload
      return { ...state, editorCollapsed: collapsed }
    }
    case ActionTypes.UPDATE_GUIDE_CONFIG: {
      return { ...state, guiderConfig: action.payload }
    }
    case ActionTypes.UPDATE_QUANTIFIER: {
      const { nodes, selectedIds } = state
      const { nextNodes, nextSelectedIds } = quantifier(
        nodes,
        selectedIds,
        action.payload
      )
      return setNodes(state, nextNodes, { selectedIds: nextSelectedIds })
    }
    default:
      return state
  }
}
