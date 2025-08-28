import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res,userId) =>{
    const token = jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:"15m",
    })

    res.cookie("token",token,{
        httpOnly:true,// prevents client-side JavaScript from accessing the cookie, enhancing security by mitigating the risk of cross-site scripting (XSS) attacks
        secure:process.env.NODE_ENV === "production",
        secure:true, // ensures the cookie is only sent over HTTPS in production environments
        sameSite:"Strict",// helps prevent CSRF attacks by ensuring that the cookie is only sent in a first-party context
        maxAge:7*24*60*60*1000 // 7 days // sets the maximum age of the cookie to 7 days, after which it will expire and be removed from the user's browser
    })
}

// this function generates a JWT token using the userId and a secret key from the environment variables. The token is set to expire in 7 days.
//it is typically used to authenticate users and maintain their session in a web application. The generated token can be sent to the client, which can then include it in subsequent requests to access protected resources.
// The token is signed with a secret key to ensure its integrity and authenticity. The function can be used in various parts of the application, such as during user login or signup, to create a session for the user.
//jwt.sign() is a method from the jsonwebtoken library that creates a new JSON Web Token (JWT) based on the provided payload and secret key. The payload typically contains user information or claims, and the secret key is used to sign the token, ensuring its integrity and authenticity.
//jwt is used for securely transmitting information between parties as a JSON object. It is commonly used for authentication and information exchange in web applications.
//json is a lightweight data interchange format that is easy for humans to read and write, and easy for machines to parse and generate. It is often used in web applications to transmit data between a server and a client.
//res.cookie() is a method used to set a cookie in the HTTP response. It allows you to specify the name, value, and various options for the cookie, such as expiration time, security settings, and path.
//a cookie is a small piece of data stored on the user's computer by the web browser while browsing a website. It is used to remember information about the user, such as login status, preferences, and session data.
