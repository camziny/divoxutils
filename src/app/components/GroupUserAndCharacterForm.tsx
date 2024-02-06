// import React, { useState } from "react";

// const GroupUserAndCharacterForm = ({ onUserCreated }) => {
//   const [newUserName, setNewUserName] = useState("");
//   const [newCharacterName, setNewCharacterName] = useState("");
//   const [newCharacterClass, setNewCharacterClass] = useState("");

//   const handleSubmit = async (e: eny) => {
//     e.preventDefault();

//     try {
//       const newUser = await createNewUserAndCharacter(
//         newUserName,
//         newCharacterName,
//         newCharacterClass
//       );
//       onUserCreated(newUser);

//       setNewUserName("");
//       setNewCharacterName("");
//       setNewCharacterClass("");
//     } catch (error) {
//       console.error("Error creating user and character:", error);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input
//         type="text"
//         placeholder="User Name"
//         value={newUserName}
//         onChange={(e) => setNewUserName(e.target.value)}
//         required
//       />
//       <input
//         type="text"
//         placeholder="Character Name"
//         value={newCharacterName}
//         onChange={(e) => setNewCharacterName(e.target.value)}
//       />
//       <input
//         type="text"
//         placeholder="Character Class"
//         value={newCharacterClass}
//         onChange={(e) => setNewCharacterClass(e.target.value)}
//         required
//       />
//       <button type="submit">Create User and Character</button>
//     </form>
//   );
// };

// export default GroupUserAndCharacterForm;

// async function createNewUserAndCharacter(
//   userName,
//   characterName,
//   characterClass
// ) {}
