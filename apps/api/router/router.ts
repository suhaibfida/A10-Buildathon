import { Router } from "express";
import {login} from "./../controller/register.js"
const router:Router = Router();
router.post("/register",login)
export default router;  