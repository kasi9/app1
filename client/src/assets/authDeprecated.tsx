
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  exp: number;
};

export const isAuthenticatedDeprecated = () => {

  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const { exp } = jwtDecode<JwtPayload>(token); 
    if (exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("token");
    return false;
  }
};
/*
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
};
*/