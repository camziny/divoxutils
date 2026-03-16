export const getRealmSurfaceClass = (realm: string): string => {
  switch (realm) {
    case "Albion":
      return "bg-red-900/10";
    case "Midgard":
      return "bg-blue-900/10";
    case "Hibernia":
      return "bg-green-900/10";
    default:
      return "bg-gray-800/10";
  }
};

export const getRealmSurfaceInteractiveClass = (realm: string): string => {
  switch (realm) {
    case "Albion":
      return "bg-red-900/10 hover:bg-red-900/20";
    case "Midgard":
      return "bg-blue-900/10 hover:bg-blue-900/20";
    case "Hibernia":
      return "bg-green-900/10 hover:bg-green-900/20";
    default:
      return "bg-gray-800/10 hover:bg-gray-800/20";
  }
};
