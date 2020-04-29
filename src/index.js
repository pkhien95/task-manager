const express = require('express')
require('./db/mongoose')
const usersRouter = require('./routers/users')
const tasksRouter = require('./routers/tasks')

const app = express()
app.use(express.json())
app.use(usersRouter, tasksRouter)

const PORT = process.env.PORT
app.listen(PORT, () => {
	console.log('Server is up on port', PORT)
})


