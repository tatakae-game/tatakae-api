# Tatakae API
Entirely controls the users, matchmaking and other things.

## Technologies
It uses [Babel](https://babeljs.io/) JavaScript compiler to allow use of pending JavaScript's functionnalities such as [Optional Chaining](https://tc39.es/proposal-optional-chaining/), [`public` and `private` class fields](https://tc39.es/proposal-class-fields/) or also [`static` class fields](https://tc39.es/proposal-static-class-features/).

To create a HTTP server, [Express](https://expressjs.com/) is used along with [Helmet](https://helmetjs.github.io/) in order to improve the security of incoming HTTP requests.

[Socket.IO](https://socket.io/) is used to provide a WebSocket server for real-time purposes.

Because security is one of the application's priorities, [Argon2id](https://en.wikipedia.org/wiki/Argon2) algorithm is used to hash and compare passwords.

Finally, [MongoDB](https://www.mongodb.com/) is the used database program as it has great performances and is easily scalable.

# How to run
## Development
In order to improve productivity and ease development it uses `nodemon` to automatically restart the server.
```bash
npm run dev
```
## Production
```bash
npm start
```
