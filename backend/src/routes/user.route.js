// import {Router} from "express"
// import { 
//     login,
//     registerUser,
//     logout,
//     refreshAcessToken,
//     changeCurrentPassword,
//     updateAccountDetails,
//     getCurrentUser,
//     deleteUser,
//     getAllUsers,
//     updateUserRole,
// } from "../controllers/user.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { verifyAdmin } from "../middlewares/adminCheck.middleware.js";

// const router = Router();

// router.route("/register").post(registerUser);
// router.route("/login").post(login);
// router.route("/logout",verifyJWT).post(logout);
// router.route("/refresh-access-token",verifyJWT).post(refreshAcessToken);
// router.route("/change-password").patch(verifyJWT,changeCurrentPassword);
// router.route("/update-account-details").patch(verifyJWT,updateAccountDetails);
// router.route("/me").get(verifyJWT,getCurrentUser);

// //admin only
// router.route("/delete-user/:userId").delete(verifyJWT, verifyAdmin, deleteUser);
// router.route("/get-all-users").get(verifyJWT, verifyAdmin, getAllUsers);
// router.route("/update-role/:userId").patch(verifyJWT, verifyAdmin, updateUserRole);

// export default router;




// routes/user.routes.js
import { Router } from "express";
import {
  login,
  registerUser,
  logout,
  refreshAcessToken,
  changeCurrentPassword,
  getCurrentUser,
  deleteUser,
  getAllUsers,
  updateUserRole,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/adminCheck.middleware.js";

const userRouter = Router();

// Public endpoints
userRouter.post("/register", registerUser);
userRouter.post("/login", login);

// Protected endpoints (requires authentication)
userRouter.post("/logout", verifyJWT, logout);
userRouter.post("/refresh-token", refreshAcessToken);
userRouter.patch("/password", verifyJWT, changeCurrentPassword);
userRouter.get("/me", verifyJWT, getCurrentUser);

// Admin-only endpoints
userRouter.delete("/:userId", verifyJWT, verifyAdmin, deleteUser);
userRouter.get("/", verifyJWT, verifyAdmin, getAllUsers);
userRouter.patch("/:userId/role", verifyJWT, verifyAdmin, updateUserRole);

export default userRouter;