const jwt=require('jsonwebtoken');
const HttpError=require('../Model/errorModel.js')
// this use for Authorization
const authMiddleware=async(req,res,next)=>{
    const Authorization=req.headers.Authorization||req.headers.authorization;
    if (Authorization && Authorization.startsWith("Bearer")) {
        const token=await Authorization.split(' ')[1];
        jwt.verify(token,process.env.JWT_SECRET,(err,info)=>{
            if (err) {
                if (err.name === 'TokenExpiredError') {
                  return res.status(401).json({ message: 'Unauthorized - Token has expired' });
                } else {
                  return res.status(401).json({ message: 'Unauthorized - Token is not valid' });
                }
              }
            req.user=info;
            next()
        })
    } else {
        return next(new HttpError("Unauthorized. No token",402))

    }
}

module.exports=authMiddleware;