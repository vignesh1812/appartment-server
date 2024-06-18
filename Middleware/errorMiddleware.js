// Unsupported 404 Routes
const notFound=(req,res,next)=>{
    const error=new Error(`not found-${req.originalUrl}`)
    res.status(404);
    next(error)
    }
    
    const erorMiddleware=(error,req,res,next)=>{
         if(res.headerSent){
            return next(error)
         } 
         res.status(error.code||500).json({message:error.message|| "An Unknown Error Occured"})
    }
    
    module.exports={notFound,erorMiddleware}