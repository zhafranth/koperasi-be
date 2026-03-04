import jwt from "jsonwebtoken";

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decode;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

export default authenticateToken;
