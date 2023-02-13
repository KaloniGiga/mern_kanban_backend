import {Request, Response, NextFunction } from "express";
import { fstat } from "fs";
import multer from "multer";
import path from "path";
import { createRandomToken } from "../utils/misc";
import fs from 'fs'








export const multerUpload = async (req:any, res:Response, next: NextFunction, fileName: string) => {


    console.log(fileName);
  

    // const storage = multer.diskStorage({
    //     destination: function async (req, file, callback) {
            
    //         callback(null, path.resolve(__dirname, '../public'))
    //     },
    //     filename: function(req, file, callback) {
    //         callback(null, file.originalname)
    //     }
    // });
  
    const storage = multer.memoryStorage();

    const fileFilter = (req:Request, file:any, cb: multer.FileFilterCallback) => {

        const ext = file.mimetype.split("/")[1];
    
        if (ext === "jpeg" || ext === "png" || ext === "jpg") {
            return cb(null, true);
          }
        
          return cb(new Error("image type unsupported."));
    }


    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: 1024 * 1024 * 10
        },
    })


    const file = upload.single(fileName)
   

    file(req, res, (err) => {
    console.log(req.file);

        if(err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false, message: err.message
            })
        } else if(err) {
            
            return res.status(400).json({
                success: false,
                error: err
            })
        }

        next();
    });

}