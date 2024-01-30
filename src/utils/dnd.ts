import { GroupUser } from "./group";

// export interface DroppableProps {
//   id: string;
//   items: string[];
//   onDrop: (newOrder: string[]) => void;
//   selectedRealm: string;
//   onRemove: (id: string) => void;
//   selectedCharacters: { [key: string]: number | null };
//   handleCharacterSelect: (userId: string, characterId: number) => void;
// }
export interface DroppableProps {
  id: any;
  items: any;
  onDrop: (newOrder: string[]) => void;
  selectedRealm: string;
  onRemove: (user: GroupUser) => void;
  selectedCharacters: { [key: string]: number | null };
  handleCharacterSelect: (userId: string, characterId: number) => void;
}

export interface SortableItemProps {
  id: string;
  content: string;
}

export interface GroupItemProps {
  id: string;
  dragOverlay?: boolean;
  content: string;
}

export interface GroupDraggableProps {
  user: any;
  isOverlay: boolean;
  selectedRealm: string;
  selectedCharacters: { [key: string]: number | null };
  isInActiveGroup?: boolean;
  onCharacterSelect: (userId: string, characterId: number) => void;
}
