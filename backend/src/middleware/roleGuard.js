// middleware/roleGuard.js
export function roleGuard(allowed = []) {
  return function (req, res, next) {
    try {
      const role = req.user?.role; // set by checkToken
      if (!role || !allowed.includes(role)) {
        return res.status(403).json({ message: "Forbidden: insufficient role" });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}
