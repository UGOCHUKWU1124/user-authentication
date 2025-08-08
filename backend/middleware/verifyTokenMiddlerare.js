import jwt from "jsonwebtoken"


export const verifyToken = (req,res,next) => {
    const token = req.cookies.token;
    if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Token verification error:', error); // Debug log
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

//THIS MIDDLEWARE IS USED TO VERIFY THE JWT TOKEN IN THE REQUEST COOKIES
//It checks if the token is present and valid, and if so, it extracts the user ID from the token and attaches it to the request object for further processing in the route handlers.
//If the token is missing or invalid, it responds with a 401 Unauthorized status and an error message.
//This middleware is typically used to protect routes that require authentication, ensuring that only authenticated users can access certain resources or perform specific actions in the application.
//It is important to ensure that the JWT_SECRET used for signing the token matches the one used for verification, as this is crucial for the integrity and security of the authentication process.
//This middleware is applied to routes that require user authentication, allowing the server to verify the user's identity before processing the request further.
//It is typically used in conjunction with other middleware or route handlers to ensure that only authenticated users can access certain resources or perform specific actions in the application.