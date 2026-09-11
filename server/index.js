import express from 'express'
import logger from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {Server} from 'socket.io'
import {createServer} from 'node:http'


const puerto = process.env.PORT || 3000


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const app = express()
const server = createServer(app)
//Añade comunicacion en tiempo real
const io = new Server(server)

io.on("connection",(socket)=>{
  console.log("El cliente se ha conectado!!!!")


  socket.on('disconnect',()=>{
    console.log("El cliente se ha desconectado")
  })
})

app.use(logger('dev'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'))
})

app.get('/home/:name',(req,res)=>{
    const nombre = req.params.name;
    res.send("Hola " + nombre + " Estado de la solicitud " + res.statusCode)
})
server.listen(puerto, () => {
  console.log(`Servidor escuchando en el puerto localhost:${puerto}`)
})

