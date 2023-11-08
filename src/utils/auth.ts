import jwt from "jsonwebtoken";

type UserType = {
  id: number;
};

export const generateToken = (user: UserType) => {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};
