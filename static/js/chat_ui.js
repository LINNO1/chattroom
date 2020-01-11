
//用户信息，不授信，用text

const divEscapedContent = message=>$(`<li class="user-msg other clearfix"><span class="user-name">${message.user}</span>
 				<span class="user-text">${message.text}</span></li>`);
// 授信
const divSystemContent = message=>$(`<li class="system-msg"><span>${message}</span></li>`);

// 处理用户输入的信息
const processUserInput = (chatApp,socket,curname)=>{
	let message = $('#input-message').val();
	let systemMessage;
	// 如果用户输入的是命令
	if(message.charAt(0)=='/'){
		systemMessage = chatApp.processCommand(message);
		//如果是无法识别的命令
		if(systemMessage){
			$('.chat-panel').append(divSystemContent(systemMessage));
		}
	}else{
		// 向该房间其他用户广播
		chatApp.sendMessage($('.room-id').text(),message);
		// 自己的页面上显示
		let msgitem = $(`<li class="user-msg mime clearfix"><span class="user-name">${curname}</span>
 				<span class="user-text">${message}</span></li>`);
		$('.chat-panel').append(msgitem);

		$('.chat-panel').scrollTop($('.room-id').prop('scrollHeight'));
	}
	$('#input-message').val('');
}

// 客户端的 socket 程序

const socket = io();
$(document).ready(()=>{
	let curname = 'LLL';
	let chatApp = new Chat(socket);
	// ***********socket注册事件**********************************
	// 修改昵称事件
	// 回调函数的参数 { success: true/false, name: newName}
	socket.on('nameResult',result=>{
		let message;
		if(result.success){
			message = 'You are now konwn as '+ result.name+'.';
			curname=result.name;
		}else{
			message = result.message;
		}
		$('.chat-panel').append(divSystemContent(message));
	});
    // 加入房间事件
	// 回调函数的参数 { room: newRoom }
	socket.on('joinResult',result=>{
		$('.room-id').text(result.room);
		$('.chat-panel').append(divSystemContent('Room changed.'));
	});

	// 发送消息事件
	// 回调函数的参数 { text: msg, type: }
	socket.on('message',message=>{
		console.log(message);
		if(message.user!=undefined){
			$('.chat-panel').append(divEscapedContent(message));
		}else{
            $('.chat-panel').append(divSystemContent(message.text));
		}
		
		
	});

	// 房间列表更新事件
	// 回调函数的参数 { room: newRoom }
	socket.on('rooms',rooms=>{
		/*console.log('rooms...:',rooms);*/
		$('.room-list').empty();
		for(let room in rooms){
			if(room !=''){
				$('.room-list').append($(`<li>${room}</li>`));
			}
		}
	})
   
  //***********元素绑定事件**********************************
    // 由于 setInterval，每次append新的li,新li没有绑定事件
	// 点击右面的房间号，进入该房间
	$('.room-list').click('li',function(e){
		e.preventDefault();		
		console.log(e.target);
		//注意，这里用了事件代理 this为ul，e.target为每个被点击的li
		chatApp.processCommand('/join ' + $(e.target).text());
		$('.input-message').focus();
	})
	// 每秒更新一次房间列表
	setInterval(()=>{
		socket.emit('rooms');
	},1000);

	$('.input-message').focus();
	$('.chat-form').submit(()=>{
		processUserInput(chatApp,socket,curname);
		return false;
	})
})