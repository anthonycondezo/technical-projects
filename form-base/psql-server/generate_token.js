import jwt from "jsonwebtoken";
import dotenv from "dotenv"; 
dotenv.config();

const PAYLOAD = {"role": "student"};

const ERROR_MSG = "Invalid terminal arguments: too many arguments\n" 
    + "node ./generate_token.js [JWT_SECRET]";

/**
 * Generates a jwt-token from the supplied jwt-secret 
 * @param {string} secret - the jwt-secret string
 */
function generateToken(secret) {
    try {
        const jwtToken = jwt.sign(PAYLOAD, secret, { algorithm: "HS256" });
        console.log(`JWT_TOKEN = ${jwtToken}`)
    } catch (e) {
        console.log("Failed to create token:", e)
    }
}

function main() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        // check supplied argument(s)
        console.error(ERROR_MSG)
    } else {
        generateToken(args[0]);
    }
}

main();