"use client";
import GroupUserSearch from "./GroupUserSearch";

type Group = {
  id: number;
  name: string;
};

type GroupBuilderFormProps = {
  group: Group | null;
};

const GroupBuilderForm: React.FC<GroupBuilderFormProps> = ({ group }) => {
  return (
    <div>
      <h2>Group Management</h2>
      {group ? (
        <>
          <div>Group Name: {group.name}</div>
          <GroupUserSearch groupId={group.id} />
        </>
      ) : (
        <p>Group not found or failed to load.</p>
      )}
    </div>
  );
};

export default GroupBuilderForm;
