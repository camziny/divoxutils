import React from "react";
import GroupDroppable from "./GroupDroppable";
import GroupDraggable from "./GroupDraggable";
import GroupCharacterSelector from "./GroupCharacterSelector";
import { User, GroupRosterProps, UserWithCharacters } from "../../utils/group";

const GroupRoster: React.FC<GroupRosterProps> = ({
  users,
  onUserInteract,
  groupId,
}) => {
  const handleUserDrop = (newOrder: string[]) => {
    const reorderedUsers = newOrder.map(
      (userId) => users.find((user) => user.id === userId) as UserWithCharacters
    );
    onUserInteract(reorderedUsers, "roster");
  };

  const logUsers = users.map((user) => {
    console.log(
      "User and Characters in parent component: ",
      user,
      user.characters
    );
  });
  console.log(logUsers);

  return (
    <div>
      <GroupDroppable
        id="roster"
        items={users.map((user) => user.name)}
        onDrop={handleUserDrop}
      >
        <div className="text-center">
          {users.map((user) => (
            <GroupDraggable key={user.id} user={user}>
              <div className="user-item-style">{user.name}</div>
              <GroupCharacterSelector
                clerkUserId={user.clerkUserId}
                characters={user.characters}
              />
            </GroupDraggable>
          ))}
        </div>
      </GroupDroppable>
    </div>
  );
};

export default GroupRoster;
