// higher order function take function as an parameter and return function.
// 1. Method

//  const asyncHandler = (fn) => async(req,res,next) =>{
//    try {
        //  await fn(req,res,next);
//    } catch (error) {
//        res.status(err.code || 500).json({
//           success:false,
//           message: err.message
//        })
//    }
// }

// 2. Method

const asyncHandler = (requestHandler) =>{
    (req, res, next) =>{
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export {asyncHandler};