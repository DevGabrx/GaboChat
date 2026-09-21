import express from 'express'
import logger from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

import {Server} from 'socket.io'
import {createServer} from 'node:http'


dotenv.config()

const puerto = process.env.PORT || 3000


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


//Conexion a la base de datos

const db = createClient({
  url : process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

await db.execute(
  `CREATE TABLE IF NOT EXISTS messages(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  context TEXT
  )`
)

const app = express()
const server = createServer(app)
//Añade comunicacion en tiempo real
const io = new Server(server)

io.on("connection",async (socket)=>{
  console.log("El cliente se ha conectado!!!!")


  socket.on('disconnect',()=>{
    console.log("El cliente se ha desconectado")
  })

  //socket.on recibe el mensaje del cliente por el formulario
  //io.emit("Emite el mensaje funciona como broadcast porque hace un send a todos los usuarios correspondientes")
  socket.on('chat message',async (msj)=>{
    //


    let result;

    try {
      
      result = await  db.execute({
        sql : `INSERT INTO messages(context) VALUES (:msj)`, // no poner literalmente la variable msj porque nos podrian hacer un sql injection
        args:{msj} //con los args evitamos sql injection 
      })


    } catch (error) {
      console.error(error)
      return
    }
  
    //                           Ultimo ID y volverlo a String 
    io.emit("chat message" ,msj, result.lastInsertRowid.toString())
  })

  console.log("Informacion que viene desde la request")
  console.log(socket.handshake.auth.serverOffset)


  if(!socket.recovered){
    try { 
      const results = await db.execute({
        sql:"SELECT id,context FROM messages WHERE id > ?" ,
        args:[socket.handshake.auth.serverOffset ?? 0]
      })


      //Investigar Para Que Sirve HASTA AQUI QUEDE 21/09/2026
      // results.rows.forEach(row =>{
      //   socket.emit('chat message', row.content, row.id.toString())
      // })


    }catch(error){
      console.log(error)
    }
  }
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

