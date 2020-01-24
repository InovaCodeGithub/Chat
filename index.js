
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path')

const exphbs = require('express-handlebars')

app.set('views',path.join(__dirname,"src", 'app', 'views'))

app.engine('.hbs', exphbs(
  { extname: '.hbs',
    layoutsDir: path.join('src', 'app', 'views', 'layouts'),
    partialsDir: path.join('src', 'app', 'views', 'partials') 
  })
)

app.set('view engine', '.hbs');

app.get('/', function(req, res){
  res.render('chat', {})
});

const users = []

io.on('connection', function(socket){

  socket.on('newUser', user => {
    users.push(user)
    io.emit('usersUpdated', users.length)
  })

  socket.on('chat message', ({id: userId, name, message: msg}) => {

    if(msg.includes('|')){
      const msgArray = msg.split('|');
      const targetedUsers = []
      const socketIds = []

      msg = msgArray[0]

      const usersArray= msgArray[1].split(';')
      for (let index = 0; index < usersArray.length; index++) {
        targetedUsers.push(usersArray[index].trim());
      }

        for(const u of targetedUsers){  
        const matchedUsers = users.filter(user => user.name === u)
        if(matchedUsers[0]){
          let {id} = matchedUsers[0] 
          socketIds.push(id)
        }
        
      }

      socketIds.push(userId)

      if(socketIds.length > 1){
        for(const targetId of socketIds){
          console.log(`Mandando mensagem privada para: ${targetId}`)
          io.to(targetId).emit('chat message', msg)
        }
      }

      else{
        io.to(socketIds[0]).emit('userNotFound', `Usuário não encontrado.`);
      }

    }
    
    else io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    /*
    console.log('Usuários: ')
    console.log(users)
    console.log(`Usuário desconectado: ${socket.id}`)
    */
    const user = users.find(u => u.id === socket.id)
    if(user){
      users.splice(users.indexOf(user), 1)
    }
    /*
    console.log('Usuários logados: ')
    console.log(users)
    */
  })
    
});


 
// inicia o servidor na porta informada, no caso vamo iniciar na porta 3000
http.listen(3000, function(){
  console.log('Servidor rodando em: http://localhost:3000');
});