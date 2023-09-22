# PIXELWAND BACKEND ASSIGNMENT

To Setup the Project Locally,

- Clone the repo
- cd into the pixelwand-assignment folder
- cp .env.example .env 
- Enter your MONGO_URL in the .env file
- Install the Necessary Dependencies using, npm install
- Run, npm start to start the project locally

Now open Postman and hit the Routes.

# ROUTES

- Signup ('/signup')
    - method : "POST"
    - Name, Email, Password are validated using Zod
    - Password is hashed using bcrypt.
    - If the zod validation is successfull, we create an account in D.B
    - Then, generate a token, create a new Session in D.B and return back the token to the user
    - If the validation get's failed, the appropriate error message will be given by zod and we can return
        the message to the user

- Login ('/login')
    - method : "POST"
    - We check if the email exists , if not we ask the user to signup
    - Else we authenticate the user, generate a new token 
    - create a new session using the token and userId
    - Finally return the token back to the user

- Logout ('/logout')
    - method : "POST"
    - Checks for a particular session in D.B using the token,
    - If the session exists, we delete the session from the D.B

- Me ('/me')
    - method : "GET"
    - This is a protected route, Only authenticated users can hit this route
    - Get's user detials such as name and email from D.B and return the details back to the user


# Middlewares

- auth
    - Extracts the token from header
    - If the token doesn't exists, it restricts the user 
    - If the token get's successfully decrypted, then it calls the further route functions.
    - Else, it checks for the particular token in DB
        - If the token is available, (Renew the session)
            - We generate a new token
            - Set the new token in headers, create a new Session in D.B
            - Call the next function
        - Else, we restrict the user and ask the user to send a valid token.