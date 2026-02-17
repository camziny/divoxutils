import test from "node:test";
import assert from "node:assert/strict";
import { groupUsersByLetter } from "../src/server/users";

test("groupUsersByLetter groups users by first letter and sorts names", () => {
  const result = groupUsersByLetter([
    { id: 1, clerkUserId: "u_1", name: "zane" },
    { id: 2, clerkUserId: "u_2", name: "alice" },
    { id: 3, clerkUserId: "u_3", name: "andrew" },
  ]);

  assert.deepEqual(Object.keys(result), ["A", "Z"]);
  assert.deepEqual(result.A.map((u) => u.name), ["alice", "andrew"]);
  assert.deepEqual(result.Z.map((u) => u.name), ["zane"]);
});
