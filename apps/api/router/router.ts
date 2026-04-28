import { Router } from "express";
import {register,login} from "./../controller/register.js"
import {authMiddleware} from "./../middleware/authMiddleware.js"
import { authorizeRoles } from "../controller/authorizeRoles.js"
import {createDepartment} from "../controller/createDepartment.js" 
const router:Router = Router();
router.post("/auth/register",register)
router.post("/auth/login",login)
router.post("/admin/create/department",authMiddleware,authorizeRoles("ADMIN"),createDepartment)
export default router;  