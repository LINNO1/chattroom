
/*定义一个chat类*/
class Chat{
	constructor(socket){
		this.socket = socket;
	}
	// 发送消息
	sendMessage(room,text){
		console.log('chatApp sendMessage:' +text);
		let msg = {
			room: room,
			text: text		
		}
		this.socket.emit('message-server',msg);
	}
	// 改变房间
	changeRoom(room){
		console.log('chatApp changeRoom:' +room);
		this.socket.emit('join',{
		   newRoom: room
		})
	}
	// 处理用户的命令
	processCommand(command){
		console.log('chatApp processCommand:' +command);
		let words = command.split(' ');
		console.log('words: ',words);
		command = words[0].substring(1,words[0].length).toLowerCase();
		let message = false;
		switch(command){
			case 'join':
			     words.shift();
			     console.log('shift',words);
			     let room = words.join(' ');
			     this.changeRoom(room);
			     break;
			case 'nick':
				 words.shift();
				 let name= words.join(' ');
			     this.socket.emit('nameAttempt',name);
			     break;
			default:
			     message = 'Unrecognized command.';
		}
		return message;
	}

}
