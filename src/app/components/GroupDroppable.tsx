// import React, { ReactNode } from "react";
// import { useDroppable } from "@dnd-kit/core";
// import GroupDraggable from "./GroupDraggable";
// import { DroppableProps } from "@/utils/dnd";

// interface ExtendedDroppableProps extends DroppableProps {
//   children?: ReactNode;
// }
// const GroupDroppable: React.FC<ExtendedDroppableProps> = ({ id, items }) => {
//   const { setNodeRef } = useDroppable({ id });

//   return (
//     <div ref={setNodeRef}>
//       {items.map((user) => (
//         <GroupDraggable key={user.id} user={user} />
//       ))}
//     </div>
//   );
// };

// export default GroupDroppable;
