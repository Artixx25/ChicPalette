import jwt from 'jsonwebtoken'

export default function(roles) {
    return function (req, res, next) {
        if(req.method === "OPTIONS") next();

    try {
        const {roles: userRoles} = jwt.verify(token, process.env.JWT_ACCESS_911GT)
        let hasRole = false
        userRoles.forEach(role => {
            if(roles.includes(role)) hasRole = true;
        });
        if(!hasRole) return res.status(403).json({message: "Sorry, u dont have access"})
        next()
    } catch (e) {
        console.log(e)
        return res.status(403).json({message: "User is not authorized"})
    }
    }
}