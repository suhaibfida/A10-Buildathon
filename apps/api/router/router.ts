import { Router } from "express";
import {register,login} from "./../controller/register.js"
const router:Router = Router();
router.post("/auth/register",register)
router.post("/auth/login",login)
export default router;  