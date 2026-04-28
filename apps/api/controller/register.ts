import type { Request, Response } from "express";
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
   
    res.status(201).json({ });
}