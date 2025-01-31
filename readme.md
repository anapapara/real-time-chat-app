start docker image for rabbitmq
start mongodb connection

## User service 
    - run on port 8081 
    - to run: <npm run dev>
    - APIs :    -/register POST {name, email, password}
                -/login POST {email, password} 
                -/users GET  

## Chat service 
    - run on port 8082 
    - to run: <npm run dev>
    - APIs :    -POST /send  {receiverId, message} + token
                -GET /get/{idUser} + token : get conversations for current user with idUser 

## Notification service 
    - run on port 8083 
    - to run: <npm run dev>

## Gateway
    - connect all microservices ports to one gateway : 8080
    - to run: < npx tsx index.ts>
    - APIs: -http://localhost:8080//api/auth/register
            -http://localhost:8080/api/auth/login
            -http://localhost:8080/api/messages/send

## Client
    - to run: npm run start