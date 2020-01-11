const socketio = require('socket.io');
let guestNumber = 1;
let nickNames = {};
let namesUsed=[];
let currentRoom = {};
const defaultroom = 'room428'

exports.listen = (server)=>{
  // 监听 http_server
  const io = socketio.listen(server);
  io.set('log level',1);
 // 每次有用户登录时，执行以下
  io.sockets.on('connection', socket => {
    console.log('connection...,sockie.id=',socket.id);
  	// 分配昵称,返回当前用户数
  	guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
    // 默认加入房间
  	joinRoom(socket,defaultroom);
    // 广播消息
  	handleMessageBroadcasting(socket,nickNames);
    // 修改昵称 /nick
  	handleNameChangeAttempts(socket,nickNames,namesUsed);
    // 修改房间号 /join
  	handleRoomJoining(socket);

    // 广播(包括自己),更新房间列表
    socket.on('rooms', ()=>{
         // socket.emit('rooms',io.manager.rooms);

          socket.emit('rooms',io.sockets.adapter.rooms);
    });
    //用户断开后
   handleClientDisconnection(socket,nickNames,namesUsed);
})

// 分配昵称
  const assignGuestName = (socket,guestNumber,nickNames,namesUsed)=>{
  	// 默认用户名
  	let name = 'Guest_' + guestNumber;
  	// 用户名与socket id关联，存在nicknames中
  	nickNames[socket.id] = name;/////////////////////////////////
  	// 发布一个事件，告诉客户端，该用户分配好名称
  	socket.emit('nameResult',{
  		success: true,
  		name: name
  	});
  	namesUsed.push(name);
  	return guestNumber+1;
  }

//进入聊天室
  const joinRoom = (socket,room)=>{
  	socket.join(room); //
  	currentRoom[socket.id] = room;
  	// 发布事件，通知客户端，该用户进入聊天室成功
  	socket.emit('joinResult',{room: room});
  	// 广播，向该房间的其他用户通知，该用户进入房间
    // 发布事件，客户端处理 message事件
  	socket.broadcast.to(room).emit('message',{
  		text: nickNames[socket.id] + 'has joined '+ room +'.'
  	})
  	// 并向客户端显示该房间当前用户数量
  	//let usersInRoom = io.clients(room);
    let usersInRoom=io.sockets.adapter.rooms[room];
    /*
    io.sockets.adapter.rooms=
  { '517': Room { sockets: { Rpopwemq4j5duw8vAAAC: true }, length: 1 },
  room428: Room { sockets: { EJ71_NOlcEC5GJYeAAAD: true }, length: 1 },
  Rpopwemq4j5duw8vAAAC: Room { sockets: { Rpopwemq4j5duw8vAAAC: true }, length: 1 },
  EJ71_NOlcEC5GJYeAAAD: Room { sockets: { EJ71_NOlcEC5GJYeAAAD: true }, length: 1 } }
    */


    console.log('usersInRoom:',usersInRoom);
  	if(usersInRoom.length>1){
  		let usersInRoomSummary = 'Users currently in ' + room + ': ';   
      // 注意
  		for(let userSocketId in usersInRoom.sockets){  			
  			if(userSocketId != socket.id){ 			
  				usersInRoomSummary +=nickNames[userSocketId]+',';
  			}
  		}
      usersInRoomSummary=usersInRoomSummary.substring(0,usersInRoomSummary.length-1);
  		usersInRoomSummary +='.';
  		socket.emit('message',{text: usersInRoomSummary})
  	}
  }

const handleNameChangeAttempts = (socket,nickNames,namesUsed)=>{
	// 注册一个事件
	socket.on('nameAttempt',(name)=>{
		//新的名称不能以guest开头
      if(name.indexOf('Guest_') ==0){
      	socket.emit('nameResult',{
      		success: false,
      		message: 'Name cannot begin with "Guest".'
      	})
      }else{
      	// 如果新名称没有被使用过，则改名成功
      	if(namesUsed.indexOf(name)==-1){
      		let previousName = nickNames[socket.id];
      		let previousNameIndex = namesUsed.indexOf(previousName);
      	    namesUsed.splice(previousNameIndex,1,name);
      		nickNames[socket.id] = name;
      		socket.emit('nameResult',{
      			success: true,
      			name: name
      		});
      		socket.broadcast.to(currentRoom[socket.id]).emit('message',{
      			text: previousName + 'is now known as ' + name +'.'
      		})
      	}else{
      		socket.emit('nameResult',{
      			success: false,
      			message: 'That name is already in use.'
      		})
      	}
      }
	})
}

// 处理广播信息,这里为发送聊天信息
let handleMessageBroadcasting = socket=>{
	socket.on('message-server',(msg)=>{
    // 除了自己以外房间中的其他用户广播信息
		socket.broadcast.to(msg.room).emit('message',{
      user: nickNames[socket.id],
			text: msg.text
		})
	})
}

let handleRoomJoining = socket=>{
  // 注册加入房间事件
	socket.on('join',room=>{
		socket.leave(currentRoom[socket.id]); // leave 为socketio自带的函数
		joinRoom(socket,room.newRoom);
	})
}
// 处理用户断线
let handleClientDisconnection = socket=>{
	socket.on('disconnect',()=>{
    // 将nameused 中用户的信息删除
		let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		namesUsed.splice(nameIndex,1);
		// 删除nickname中的信息
    console.log(nickNames[socket.id] + ' has leaved the room.');
    delete nickNames[socket.id];
})
}
}