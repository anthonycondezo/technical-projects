# This creates a JWT secret for secure API access
export LC_CTYPE=C
secret=$(< /dev/urandom tr -dc A-Za-z0-9 | head -c32)
echo "jwt-secret = $secret"
node ./generate_token.js $secret