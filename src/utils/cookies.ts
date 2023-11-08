import { NextApiRequest, NextApiResponse } from "next";

export const setCookie = (
  res: NextApiResponse,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    path?: string;
    maxAge?: number;
    sameSite?: "lax" | "strict" | "none";
    domain?: string;
  } = {}
) => {
  const defaultOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    ...options,
  };

  const serializedCookie = `${name}=${value}; ${Object.entries(defaultOptions)
    .map(([key, val]) => `${key}=${val}`)
    .join("; ")}`;

  res.setHeader("Set-Cookie", serializedCookie);
};

export const getCookie = (req: NextApiRequest, name: string): string | null => {
  const cookies =
    req.headers.cookie?.split(";").map((cookie) => cookie.trim()) || [];

  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=");

    if (cookieName === name) {
      return cookieValue;
    }
  }

  return null;
};

export const deleteCookie = (res: NextApiResponse, name: string) => {
  setCookie(res, name, "", {
    maxAge: 0,
  });
};
